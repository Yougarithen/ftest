// Model pour les factures - PostgreSQL VERSION CORRIGÉE
const pool = require('../database/connection');
const BonLivraisonFacture = require('./BonLivraisonFacture');

class Facture {

    static async getAll() {
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

        const paiementsResult = await pool.query(`
      SELECT id_facture, COALESCE(SUM(montant_paye), 0) as montant_paye
      FROM Paiement
      GROUP BY id_facture
    `);

        const paiementsMap = {};
        paiementsResult.rows.forEach(p => {
            paiementsMap[p.id_facture] = parseFloat(p.montant_paye);
        });

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

        const paiementResult = await pool.query(`
      SELECT COALESCE(SUM(montant_paye), 0) as montant_paye
      FROM Paiement
      WHERE id_facture = $1
    `, [id]);

        facture.montant_paye = parseFloat(paiementResult.rows[0].montant_paye);
        facture.montant_restant = parseFloat(facture.montant_ttc) - facture.montant_paye;

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
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Générer le numéro de facture (utiliser celui fourni ou en générer un nouveau)
            let numeroFacture = data.numero_facture;

            if (!numeroFacture) {
                const typeFacture = data.type_facture || 'FACTURE';
                const dateFacture = data.date_facture ? new Date(data.date_facture) : new Date();

                // Déterminer le préfixe selon le type
                let prefixeType = 'FACT';
                if (typeFacture === 'BON_LIVRAISON') {
                    prefixeType = 'BL';
                } else if (typeFacture === 'AVOIR') {
                    prefixeType = 'AVOIR';
                } else if (typeFacture === 'PROFORMA') {
                    prefixeType = 'PRO';
                }

                const annee = dateFacture.getFullYear().toString().slice(-2);
                const mois = (dateFacture.getMonth() + 1).toString().padStart(2, '0');
                const jour = dateFacture.getDate().toString().padStart(2, '0');
                const prefixe = `${prefixeType}-${annee}${mois}${jour}`;

                // Verrouiller la table pour éviter les doublons
                const lastResult = await client.query(`
                    SELECT numero_facture 
                    FROM Facture 
                    WHERE numero_facture LIKE $1 
                    ORDER BY numero_facture DESC 
                    LIMIT 1
                    FOR UPDATE
                `, [`${prefixe}%`]);

                let serie = 1;
                if (lastResult.rows.length > 0) {
                    const match = lastResult.rows[0].numero_facture.match(/-(\d+)$/);
                    if (match) {
                        serie = parseInt(match[1], 10) + 1;
                    }
                }

                numeroFacture = `${prefixe}-${serie.toString().padStart(3, '0')}`;
            }

            const result = await client.query(`
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
                data.type_facture || 'FACTURE',
                data.remise_globale || 0,
                data.conditions_paiement || null,
                data.notes || null
            ]);

            await client.query('COMMIT');
            return this.getById(result.rows[0].id_facture);

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
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

    /**
     * Valider une facture ou un bon de livraison
     * IMPORTANT: 
     * - Seuls les BONS DE LIVRAISON (type_facture = 'BON_LIVRAISON') déduisent le stock
     * - Les FACTURES normales ne déduisent PAS le stock (le stock a déjà été déduit par les bons)
     */
    static async valider(id) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Vérifier si la facture est déjà validée et récupérer son type
            const factureCheck = await client.query(`
            SELECT statut, type_facture FROM facture WHERE id_facture = $1
        `, [id]);

            if (factureCheck.rows.length === 0) {
                throw new Error('Facture introuvable');
            }

            if (factureCheck.rows[0].statut !== 'Brouillon') {
                throw new Error('Cette facture a déjà été validée');
            }

            const typeFacture = factureCheck.rows[0].type_facture;

            // ✅ Déduire le stock UNIQUEMENT pour les BONS DE LIVRAISON
            if (typeFacture === 'BON_LIVRAISON') {
                // Récupérer les lignes du bon de livraison
                const lignesResult = await client.query(`
                SELECT id_produit, quantite 
                FROM lignefacture 
                WHERE id_facture = $1
            `, [id]);

                // Déduire le stock pour chaque produit
                for (const ligne of lignesResult.rows) {
                    await client.query(`
                    UPDATE produit 
                    SET stock_actuel = stock_actuel - $1 
                    WHERE id_produit = $2
                `, [ligne.quantite, ligne.id_produit]);

                    // Vérifier que le stock ne devient pas négatif
                    const stockCheck = await client.query(`
                    SELECT stock_actuel, nom 
                    FROM produit 
                    WHERE id_produit = $1
                `, [ligne.id_produit]);

                    if (stockCheck.rows[0].stock_actuel < 0) {
                        throw new Error(
                            `Stock insuffisant pour ${stockCheck.rows[0].nom}. ` +
                            `Stock disponible: ${stockCheck.rows[0].stock_actuel + ligne.quantite}`
                        );
                    }
                }
            }
            // Pour les FACTURES normales, on ne touche PAS au stock

            // Valider la facture/bon
            const result = await client.query(`
            UPDATE facture 
            SET statut = 'Validée', date_validation = CURRENT_TIMESTAMP
            WHERE id_facture = $1
            RETURNING *
        `, [id]);

            await client.query('COMMIT');
            return this.getById(id);

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    static async getFacturesCredit() {
        const result = await pool.query('SELECT * FROM Vue_FacturesCredit');
        return result.rows;
    }

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

    static async creerFactureDepuisBons(data) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Générer le numéro de facture
            let numeroFacture = data.numero_facture;

            if (!numeroFacture) {
                const dateFacture = data.date_facture ? new Date(data.date_facture) : new Date();
                const annee = dateFacture.getFullYear().toString().slice(-2);
                const mois = (dateFacture.getMonth() + 1).toString().padStart(2, '0');
                const jour = dateFacture.getDate().toString().padStart(2, '0');
                const prefixe = `FACT-${annee}${mois}${jour}`;

                // Verrouiller pour éviter les doublons
                const lastResult = await client.query(`
                SELECT numero_facture 
                FROM facture 
                WHERE numero_facture LIKE $1 
                ORDER BY numero_facture DESC 
                LIMIT 1
                FOR UPDATE
            `, [`${prefixe}%`]);

                let serie = 1;
                if (lastResult.rows.length > 0) {
                    const match = lastResult.rows[0].numero_facture.match(/-(\d+)$/);
                    if (match) {
                        serie = parseInt(match[1], 10) + 1;
                    }
                }

                numeroFacture = `${prefixe}-${serie.toString().padStart(3, '0')}`;
            }

            // 1️⃣ CRÉER LA FACTURE D'ABORD
            const factureResult = await client.query(`
            INSERT INTO facture (
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

            // 2️⃣ COPIER LES LIGNES DES BONS DE LIVRAISON
            for (const id_bon of data.id_bons_livraison) {
                await client.query(`
                INSERT INTO lignefacture (
                    id_facture, id_produit, quantite, unite_vente, 
                    prix_unitaire_ht, taux_tva, remise_ligne, description
                )
                SELECT 
                    $1, id_produit, quantite, unite_vente,
                    prix_unitaire_ht, taux_tva, remise_ligne, description
                FROM lignefacture
                WHERE id_facture = $2
            `, [id_facture, id_bon]);

                // 3️⃣ CRÉER LA LIAISON BON → FACTURE
                await client.query(`
                INSERT INTO bonlivraisonfacture (id_bon_livraison, id_facture)
                VALUES ($1, $2)
            `, [id_bon, id_facture]);
            }

            await client.query('COMMIT');
            return this.getById(id_facture);

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erreur creerFactureDepuisBons:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    static async getBonsLivraisonDeFacture(id_facture) {
        return await BonLivraisonFacture.getByFacture(id_facture);
    }
}

module.exports = Facture;