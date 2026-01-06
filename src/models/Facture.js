// Model pour les factures - PostgreSQL VERSION CORRIGÉE
const pool = require('../database/connection');
const BonLivraisonFacture = require('./BonLivraisonFacture');
class Facture {

    static async getAll() {
        // ✅ Ajouter f.type_facture dans le SELECT
        const facturesResult = await pool.query(`
      SELECT 
        f.id_facture,
        f.numero_facture,
        f.id_client,
        c.nom as client,
        f.date_facture,
        f.date_echeance,
        f.statut,
        f.type_facture,
        f.remise_globale,
        COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100)), 0) as montant_ht,
        COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100) * lf.taux_tva / 100), 0) as montant_tva,
        COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100) * (1 + lf.taux_tva / 100)), 0) as montant_ttc
      FROM Facture f
      LEFT JOIN Client c ON f.id_client = c.id_client
      LEFT JOIN LigneFacture lf ON f.id_facture = lf.id_facture
      GROUP BY f.id_facture, c.nom, f.type_facture
      ORDER BY f.date_facture DESC
    `);

        const factures = facturesResult.rows;

        // ✅ Récupérer les montants payés pour toutes les factures
        const paiementsResult = await pool.query(`
      SELECT id_facture, COALESCE(SUM(montant_paye), 0) as montant_paye
      FROM Paiement
      GROUP BY id_facture
    `);

        const paiementsMap = {};
        paiementsResult.rows.forEach(p => {
            paiementsMap[p.id_facture] = parseFloat(p.montant_paye);
        });

        // ✅ Ajouter montant_paye et montant_restant
        return factures.map(f => ({
            ...f,
            montant_paye: paiementsMap[f.id_facture] || 0,
            montant_restant: parseFloat(f.montant_ttc) - (paiementsMap[f.id_facture] || 0)
        }));
    }

    static async getById(id) {
        const factureResult = await pool.query(`
      SELECT 
        f.id_facture,
        f.numero_facture,
        f.id_client,
        c.nom as client,
        f.date_facture,
        f.date_echeance,
        f.statut,
        f.type_facture,
        f.remise_globale,
        f.conditions_paiement,
        f.notes,
        COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100)), 0) as montant_ht,
        COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100) * lf.taux_tva / 100), 0) as montant_tva,
        COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100) * (1 + lf.taux_tva / 100)), 0) as montant_ttc
      FROM Facture f
      LEFT JOIN Client c ON f.id_client = c.id_client
      LEFT JOIN LigneFacture lf ON f.id_facture = lf.id_facture
      WHERE f.id_facture = $1
      GROUP BY f.id_facture, c.nom, f.type_facture
    `, [id]);

        const facture = factureResult.rows[0];
        if (!facture) return null;

        // ✅ Récupérer le montant payé séparément
        const paiementResult = await pool.query(`
      SELECT COALESCE(SUM(montant_paye), 0) as montant_paye
      FROM Paiement
      WHERE id_facture = $1
    `, [id]);

        facture.montant_paye = parseFloat(paiementResult.rows[0].montant_paye);
        facture.montant_restant = parseFloat(facture.montant_ttc) - facture.montant_paye;

        // Récupérer les lignes avec le nom du produit
        const lignesResult = await pool.query(`
      SELECT 
        lf.*,
        p.nom as produit_nom
      FROM LigneFacture lf
      LEFT JOIN Produit p ON lf.id_produit = p.id_produit
      WHERE lf.id_facture = $1
    `, [id]);

        facture.lignes = lignesResult.rows;

        return facture;
    }

    static async create(data) {
        // Générer un numéro de facture automatique
        const lastFactureResult = await pool.query('SELECT numero_facture FROM Facture ORDER BY id_facture DESC LIMIT 1');
        const lastFacture = lastFactureResult.rows[0];
        let numeroFacture = 'FAC-001';

        if (lastFacture) {
            const lastNum = parseInt(lastFacture.numero_facture.split('-')[1]);
            numeroFacture = `FAC-${String(lastNum + 1).padStart(3, '0')}`;
        }

        const result = await pool.query(`
      INSERT INTO Facture (numero_facture, id_client, id_devis, date_facture, date_echeance, statut, type_facture, remise_globale, conditions_paiement, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
            numeroFacture,
            data.id_client,
            data.id_devis || null,
            data.date_facture || new Date().toISOString().split('T')[0],
            data.date_echeance || null,
            data.statut || 'Brouillon',
            data.type_facture || 'STANDARD',
            data.remise_globale || 0,
            data.conditions_paiement || null,
            data.notes || null
        ]);

        return this.getById(result.rows[0].id_facture);
    }

    static async update(id, data) {
        const result = await pool.query(`
      UPDATE Facture 
      SET id_client = $1, date_facture = $2, date_echeance = $3, statut = $4, 
          type_facture = $5, remise_globale = $6, conditions_paiement = $7, notes = $8, date_modification = CURRENT_TIMESTAMP
      WHERE id_facture = $9
      RETURNING *
    `, [
            data.id_client,
            data.date_facture,
            data.date_echeance,
            data.statut,
            data.type_facture,
            data.remise_globale,
            data.conditions_paiement,
            data.notes,
            id
        ]);

        return this.getById(id);
    }

    static async delete(id) {
        const result = await pool.query('DELETE FROM Facture WHERE id_facture = $1', [id]);
        return result.rowCount;
    }

    // Ajouter une ligne à la facture
    static async ajouterLigne(id_facture, data) {
        const result = await pool.query(`
      INSERT INTO LigneFacture (id_facture, id_produit, quantite, unite_vente, prix_unitaire_ht, taux_tva, remise_ligne, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
            id_facture,
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

    // Valider une facture (déclenche la déduction du stock via trigger)
    static async valider(id) {
        const result = await pool.query(`
      UPDATE Facture 
      SET statut = 'Validée', date_validation = CURRENT_TIMESTAMP
      WHERE id_facture = $1 AND statut = 'Brouillon'
      RETURNING *
    `, [id]);

        if (result.rowCount === 0) {
            throw new Error('La facture ne peut pas être validée');
        }

        return this.getById(id);
    }

    // Récupérer les factures en crédit
    static async getFacturesCredit() {
        const result = await pool.query('SELECT * FROM Vue_FacturesCredit');
        return result.rows;
    }
}
// Récupérer les bons de livraison non facturés d'un client
static async getBonsLivraisonNonFactures(id_client) {
    const result = await pool.query(`
        SELECT 
            f.id_facture,
            f.numero_facture,
            f.date_facture,
            f.statut,
            f.notes,
            COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100)), 0) as montant_ht,
            COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100) * lf.taux_tva / 100), 0) as montant_tva,
            COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100) * (1 + lf.taux_tva / 100)), 0) as montant_ttc,
            COUNT(lf.id_ligne) as nb_lignes
        FROM Facture f
        LEFT JOIN LigneFacture lf ON f.id_facture = lf.id_facture
        WHERE f.id_client = $1 
            AND f.type_facture = 'BON_LIVRAISON'
            AND f.id_facture NOT IN (
                SELECT id_bon_livraison FROM BonLivraisonFacture
            )
        GROUP BY f.id_facture
        ORDER BY f.date_facture DESC
    `, [id_client]);

    return result.rows;
}

// Créer une facture à partir de bons de livraison
static async creerFactureDepuisBons(data) {
    const client = await pool.query('BEGIN');

    try {
        // 1. Générer le numéro de facture
        const lastFactureResult = await pool.query(
            "SELECT numero_facture FROM Facture WHERE type_facture = 'FACTURE' ORDER BY id_facture DESC LIMIT 1"
        );
        const lastFacture = lastFactureResult.rows[0];
        let numeroFacture = 'FAC-001';

        if (lastFacture) {
            const lastNum = parseInt(lastFacture.numero_facture.split('-')[1]);
            numeroFacture = `FAC-${String(lastNum + 1).padStart(3, '0')}`;
        }

        // 2. Créer la facture
        const factureResult = await pool.query(`
            INSERT INTO Facture (
                numero_facture, id_client, date_facture, date_echeance, 
                statut, type_facture, remise_globale, conditions_paiement, notes
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            numeroFacture,
            data.id_client,
            data.date_facture || new Date().toISOString().split('T')[0],
            data.date_echeance || null,
            data.statut || 'Brouillon',
            'FACTURE',
            data.remise_globale || 0,
            data.conditions_paiement || null,
            data.notes || null
        ]);

        const id_facture = factureResult.rows[0].id_facture;

        // 3. Récupérer toutes les lignes des bons sélectionnés et créer les liaisons
        for (const id_bon of data.id_bons_livraison) {
            // Copier les lignes du bon vers la facture
            await pool.query(`
                INSERT INTO LigneFacture (
                    id_facture, id_produit, quantite, unite_vente, 
                    prix_unitaire_ht, taux_tva, remise_ligne, description
                )
                SELECT 
                    $1, id_produit, quantite, unite_vente,
                    prix_unitaire_ht, taux_tva, remise_ligne, description
                FROM LigneFacture
                WHERE id_facture = $2
            `, [id_facture, id_bon]);

            // Créer la liaison bon -> facture
            await BonLivraisonFacture.create(id_bon, id_facture);
        }

        await pool.query('COMMIT');
        return this.getById(id_facture);

    } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
    }
}

// Récupérer les bons de livraison d'une facture
static async getBonsLivraisonDeFacture(id_facture) {
    return await BonLivraisonFacture.getByFacture(id_facture);
}
module.exports = Facture;