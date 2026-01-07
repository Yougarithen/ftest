// Model pour les matières premières - PostgreSQL - VERSION MISE À JOUR
const pool = require('../database/connection');

class MatierePremiere {

    static async getAll() {
        const result = await pool.query(`
      SELECT 
        mp.id_matiere,
        mp.nom,
        mp.unite,
        mp.typem AS "typeM",
        mp.stock_actuel,
        mp.stock_minimum,
        mp.prix_unitaire,
        mp.date_creation,
        (
          SELECT MAX(r.date_ravitaillement)
          FROM Ravitaillement r
          WHERE r.id_matiere = mp.id_matiere
        ) as dernier_ravitaillement
      FROM MatierePremiere mp
      ORDER BY mp.nom
    `);

        console.log('✅ Matières chargées avec dates de ravitaillement');
        return result.rows;
    }

    static async getById(id) {
        const result = await pool.query(`
      SELECT 
        mp.id_matiere,
        mp.nom,
        mp.unite,
        mp.typem AS "typeM",
        mp.stock_actuel,
        mp.stock_minimum,
        mp.prix_unitaire,
        mp.date_creation,
        (
          SELECT MAX(r.date_ravitaillement)
          FROM Ravitaillement r
          WHERE r.id_matiere = mp.id_matiere
        ) as dernier_ravitaillement
      FROM MatierePremiere mp
      WHERE mp.id_matiere = $1
    `, [id]);
        return result.rows[0];
    }

    static async getByType(type) {
        const result = await pool.query(`
      SELECT 
        mp.id_matiere,
        mp.nom,
        mp.unite,
        mp.typem AS "typeM",
        mp.stock_actuel,
        mp.stock_minimum,
        mp.prix_unitaire,
        mp.date_creation,
        (
          SELECT MAX(r.date_ravitaillement)
          FROM Ravitaillement r
          WHERE r.id_matiere = mp.id_matiere
        ) as dernier_ravitaillement
      FROM MatierePremiere mp
      WHERE mp.typem = $1 
      ORDER BY mp.nom
    `, [type]);
        return result.rows;
    }

    static async create(data) {
        const result = await pool.query(`
      INSERT INTO MatierePremiere (nom, unite, typem, stock_actuel, stock_minimum, prix_unitaire)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id_matiere,
        nom,
        unite,
        typem AS "typeM",
        stock_actuel,
        stock_minimum,
        prix_unitaire,
        date_creation
    `, [
            data.nom,
            data.unite,
            data.typeM || data.type_matiere,
            data.stock_actuel || 0,
            data.stock_minimum || 0,
            data.prix_unitaire || null
        ]);

        return result.rows[0];
    }

    static async update(id, data) {
        const result = await pool.query(`
      UPDATE MatierePremiere 
      SET nom = $1, 
          unite = $2, 
          typem = $3, 
          stock_actuel = $4, 
          stock_minimum = $5, 
          prix_unitaire = $6
      WHERE id_matiere = $7
      RETURNING 
        id_matiere,
        nom,
        unite,
        typem AS "typeM",
        stock_actuel,
        stock_minimum,
        prix_unitaire,
        date_creation
    `, [
            data.nom,
            data.unite,
            data.typeM || data.type_matiere,
            data.stock_actuel,
            data.stock_minimum,
            data.prix_unitaire,
            id
        ]);

        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query('DELETE FROM MatierePremiere WHERE id_matiere = $1', [id]);
        return result.rowCount;
    }

    static async getAlertes() {
        const result = await pool.query('SELECT * FROM Vue_AlerteStock');
        return result.rows;
    }

    static async getStatsByType() {
        const result = await pool.query(`
      SELECT 
        typem AS "type",
        COUNT(*) as nb_matieres,
        SUM(stock_actuel) as stock_total,
        SUM(stock_actuel * COALESCE(prix_unitaire, 0)) as valeur_totale,
        SUM(CASE WHEN stock_actuel < stock_minimum THEN 1 ELSE 0 END) as nb_alertes
      FROM MatierePremiere
      GROUP BY typem
      ORDER BY typem
    `);
        return result.rows;
    }

    static async ajusterStock(id, quantite, responsable, typeAjustement, motif) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const matiereResult = await client.query(`
        SELECT * FROM MatierePremiere WHERE id_matiere = $1
      `, [id]);
            const matiere = matiereResult.rows[0];

            if (!matiere) throw new Error('Matière première introuvable');

            const nouvelleQuantite = parseFloat(matiere.stock_actuel) + parseFloat(quantite);

            if (nouvelleQuantite < 0) {
                throw new Error('Le stock ne peut pas être négatif');
            }

            // Enregistrer l'ajustement
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
                id,
                typeAjustement,
                matiere.stock_actuel,
                quantite,
                nouvelleQuantite,
                responsable,
                motif
            ]);

            // Mettre à jour le stock
            const updateResult = await client.query(`
        UPDATE MatierePremiere 
        SET stock_actuel = $1 
        WHERE id_matiere = $2 
        RETURNING *
      `, [nouvelleQuantite, id]);

            await client.query('COMMIT');
            return updateResult.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Récupérer l'historique des ajustements d'une matière
    static async getHistoriqueAjustements(id) {
        const result = await pool.query(`
      SELECT * FROM Vue_HistoriqueAjustements
      WHERE type_article = 'MATIERE' AND id_article = $1
      ORDER BY date_ajustement DESC
    `, [id]);
        return result.rows;
    }

}  // 👈 ACCOLADE FERMANTE MANQUANTE !

module.exports = MatierePremiere;