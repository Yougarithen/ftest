// Model pour les ravitaillements - PostgreSQL
const pool = require('../database/connection');

class Ravitaillement {

    static async getAll() {
        const result = await pool.query(`
      SELECT * FROM Vue_Historique_Ravitaillement
      ORDER BY date_ravitaillement DESC
    `);
        return result.rows;
    }

    static async getById(id) {
        const result = await pool.query(`
      SELECT * FROM Vue_Historique_Ravitaillement
      WHERE id_ravitaillement = $1
    `, [id]);
        return result.rows[0];
    }

    static async getByMatiere(idMatiere) {
        const result = await pool.query(`
      SELECT * FROM Vue_Historique_Ravitaillement
      WHERE id_matiere = $1
      ORDER BY date_ravitaillement DESC
    `, [idMatiere]);
        return result.rows;
    }

    static async getByPeriode(dateDebut, dateFin) {
        const result = await pool.query(`
      SELECT * FROM Vue_Historique_Ravitaillement
      WHERE date_ravitaillement BETWEEN $1 AND $2
      ORDER BY date_ravitaillement DESC
    `, [dateDebut, dateFin]);
        return result.rows;
    }

    static async create(data) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Vérifier que la matière première existe
            const matiereResult = await client.query(
                'SELECT id_matiere, nom, stock_actuel FROM MatierePremiere WHERE id_matiere = $1',
                [data.id_matiere]
            );

            if (matiereResult.rows.length === 0) {
                throw new Error('Matière première introuvable');
            }

            const matiere = matiereResult.rows[0];

            // Préparer les champs et valeurs pour l'insertion
            const fields = [
                'id_matiere',
                'quantite',
                'prix_achat',
                'fournisseur',
                'numero_bon_livraison',
                'commentaire',
                'responsable'
            ];

            const values = [
                data.id_matiere,
                data.quantite,
                data.prix_achat || null,
                data.fournisseur || null,
                data.numero_bon_livraison || null,
                data.commentaire || null,
                data.responsable
            ];

            // Si une date est fournie, l'ajouter aux champs
            if (data.date_ravitaillement) {
                fields.push('date_ravitaillement');
                values.push(data.date_ravitaillement);
            }

            // Construire la requête dynamiquement
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            const returningFields = fields.concat(['id_ravitaillement', 'date_ravitaillement']).join(', ');

            // Insérer le ravitaillement
            const ravitaillementResult = await client.query(`
        INSERT INTO Ravitaillement (${fields.join(', ')})
        VALUES (${placeholders})
        RETURNING ${returningFields}
      `, values);

            const ravitaillement = ravitaillementResult.rows[0];

            // Mettre à jour le stock de la matière première
            const nouveauStock = parseFloat(matiere.stock_actuel) + parseFloat(data.quantite);

            await client.query(`
        UPDATE MatierePremiere 
        SET stock_actuel = $1 
        WHERE id_matiere = $2
      `, [nouveauStock, data.id_matiere]);

            // Enregistrer dans l'historique des ajustements
            await client.query(`
        INSERT INTO AjustementStock (
          type_article, 
          id_article, 
          type_ajustement, 
          quantite_avant, 
          quantite_ajustee, 
          quantite_apres, 
          responsable, 
          motif
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
                'MATIERE',
                data.id_matiere,
                'AJOUT',
                matiere.stock_actuel,
                data.quantite,
                nouveauStock,
                data.responsable,
                `Ravitaillement ${data.fournisseur ? 'de ' + data.fournisseur : ''} - ${data.commentaire || 'Aucun commentaire'}`
            ]);

            await client.query('COMMIT');

            // Retourner les détails complets
            const result = await pool.query(`
        SELECT * FROM Vue_Historique_Ravitaillement
        WHERE id_ravitaillement = $1
      `, [ravitaillement.id_ravitaillement]);

            return result.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async delete(id) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Récupérer les détails du ravitaillement avant suppression
            const ravitaillementResult = await client.query(
                'SELECT * FROM Ravitaillement WHERE id_ravitaillement = $1',
                [id]
            );

            if (ravitaillementResult.rows.length === 0) {
                throw new Error('Ravitaillement introuvable');
            }

            const ravitaillement = ravitaillementResult.rows[0];

            // Supprimer le ravitaillement (sans modifier le stock)
            await client.query('DELETE FROM Ravitaillement WHERE id_ravitaillement = $1', [id]);

            await client.query('COMMIT');
            return { deleted: true, quantite_retrait: ravitaillement.quantite };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getStats() {
        const result = await pool.query(`
      SELECT 
        COUNT(*) as total_ravitaillements,
        SUM(quantite) as quantite_totale,
        SUM(quantite * COALESCE(prix_achat, 0)) as valeur_totale,
        COUNT(DISTINCT id_matiere) as matieres_ravitaillees,
        COUNT(DISTINCT fournisseur) as nombre_fournisseurs
      FROM Ravitaillement
    `);
        return result.rows[0];
    }

    static async getStatsByMatiere() {
        const result = await pool.query(`
      SELECT 
        m.id_matiere,
        m.nom as nom_matiere,
        m.unite,
        COUNT(r.id_ravitaillement) as nombre_ravitaillements,
        SUM(r.quantite) as quantite_totale,
        AVG(r.quantite) as quantite_moyenne,
        SUM(r.quantite * COALESCE(r.prix_achat, 0)) as valeur_totale,
        MAX(r.date_ravitaillement) as dernier_ravitaillement
      FROM MatierePremiere m
      LEFT JOIN Ravitaillement r ON m.id_matiere = r.id_matiere
      GROUP BY m.id_matiere, m.nom, m.unite
      HAVING COUNT(r.id_ravitaillement) > 0
      ORDER BY COUNT(r.id_ravitaillement) DESC
    `);
        return result.rows;
    }
}

module.exports = Ravitaillement;