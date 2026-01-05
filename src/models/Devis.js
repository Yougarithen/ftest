// Model pour les devis - PostgreSQL (VERSION OPTIMISÉE)
const pool = require('../database/connection');

class Devis {

    // VERSION OPTIMISÉE : Utilise un JOIN au lieu de requêtes multiples
    static async getAll() {
        const result = await pool.query(`
      SELECT 
        v.*,
        d.notes
      FROM Vue_DevisTotaux v
      INNER JOIN Devis d ON v.id_devis = d.id_devis
      ORDER BY v.date_devis DESC
    `);
        return result.rows;
    }

    // VERSION OPTIMISÉE : Récupère tout en une seule requête
    static async getById(id) {
        // Récupérer les données de la vue + notes en un seul JOIN
        const devisResult = await pool.query(`
      SELECT 
        v.*,
        d.notes
      FROM Vue_DevisTotaux v
      INNER JOIN Devis d ON v.id_devis = d.id_devis
      WHERE v.id_devis = $1
    `, [id]);

        const devis = devisResult.rows[0];

        if (!devis) return null;

        // Récupérer les lignes du devis
        const lignesResult = await pool.query('SELECT * FROM LigneDevis WHERE id_devis = $1', [id]);
        devis.lignes = lignesResult.rows;

        return devis;
    }

    static async create(data) {
        // Générer un numéro de devis automatique
        const lastDevisResult = await pool.query('SELECT numero_devis FROM Devis ORDER BY id_devis DESC LIMIT 1');
        const lastDevis = lastDevisResult.rows[0];
        let numeroDevis = 'DEV-001';

        if (lastDevis) {
            const lastNum = parseInt(lastDevis.numero_devis.split('-')[1]);
            numeroDevis = `DEV-${String(lastNum + 1).padStart(3, '0')}`;
        }

        const result = await pool.query(`
      INSERT INTO Devis (numero_devis, id_client, date_devis, date_validite, statut, remise_globale, conditions_paiement, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
            numeroDevis,
            data.id_client,
            data.date_devis || new Date().toISOString().split('T')[0],
            data.date_validite || null,
            data.statut || 'Brouillon',
            data.remise_globale || 0,
            data.conditions_paiement || null,
            data.notes || null
        ]);

        return this.getById(result.rows[0].id_devis);
    }

    static async update(id, data) {
        const result = await pool.query(`
      UPDATE Devis 
      SET id_client = $1, date_devis = $2, date_validite = $3, statut = $4, 
          remise_globale = $5, conditions_paiement = $6, notes = $7, date_modification = CURRENT_TIMESTAMP
      WHERE id_devis = $8
      RETURNING *
    `, [
            data.id_client,
            data.date_devis,
            data.date_validite,
            data.statut,
            data.remise_globale,
            data.conditions_paiement,
            data.notes,
            id
        ]);

        return this.getById(id);
    }

    static async delete(id) {
        const result = await pool.query('DELETE FROM Devis WHERE id_devis = $1', [id]);
        return result.rowCount;
    }

    // Ajouter une ligne au devis
    static async ajouterLigne(id_devis, data) {
        const result = await pool.query(`
      INSERT INTO LigneDevis (id_devis, id_produit, quantite, unite_vente, prix_unitaire_ht, taux_tva, remise_ligne, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
            id_devis,
            data.id_produit,
            data.quantite,
            data.unite_vente,
            data.prix_unitaire_ht,
            data.taux_tva,
            data.remise_ligne || 0,
            data.description || null
        ]);

        return result.rows[0];
    }

    // Supprimer une ligne du devis
    static async supprimerLigne(id_ligne) {
        const result = await pool.query('DELETE FROM LigneDevis WHERE id_ligne = $1', [id_ligne]);
        return result.rowCount;
    }

    // Convertir un devis en facture
    static async convertirEnFacture(id_devis) {
        const devis = await this.getById(id_devis);
        if (!devis) throw new Error('Devis introuvable');
        if (devis.statut !== 'Accepté') throw new Error('Le devis doit être accepté pour être converti');

        const Facture = require('./Facture');

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Créer la facture
            const facture = await Facture.create({
                id_client: devis.id_client,
                id_devis: id_devis,
                remise_globale: devis.remise_globale,
                conditions_paiement: devis.conditions_paiement,
                notes: devis.notes
            });

            // Copier les lignes du devis vers la facture
            for (const ligne of devis.lignes) {
                await Facture.ajouterLigne(facture.id_facture, {
                    id_produit: ligne.id_produit,
                    quantite: ligne.quantite,
                    unite_vente: ligne.unite_vente,
                    prix_unitaire_ht: ligne.prix_unitaire_ht,
                    taux_tva: ligne.taux_tva,
                    remise_ligne: ligne.remise_ligne,
                    description: ligne.description
                });
            }

            // Mettre à jour le devis avec l'ID de la facture
            await client.query('UPDATE Devis SET id_facture = $1 WHERE id_devis = $2', [facture.id_facture, id_devis]);

            await client.query('COMMIT');
            return Facture.getById(facture.id_facture);

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = Devis;