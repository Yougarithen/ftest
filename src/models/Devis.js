// Model pour les devis - PostgreSQL (VERSION OPTIMISÉE AVEC PRIX_TTC)
const pool = require('../database/connection');

class Devis {

    // VERSION OPTIMISÉE : Utilise un JOIN au lieu de requêtes multiples
    static async getAll() {
        const result = await pool.query(`
      SELECT 
        v.*,
        d.notes,
        d.id_client as devis_id_client,
        d.auteur
      FROM Vue_DevisTotaux v
      INNER JOIN Devis d ON v.id_devis = d.id_devis
      ORDER BY v.date_devis DESC
    `);

        // S'assurer que id_client est présent pour chaque devis
        const devis = result.rows.map(d => {
            if (!d.id_client && d.devis_id_client) {
                d.id_client = d.devis_id_client;
            }
            return d;
        });

        return devis;
    }

    // VERSION OPTIMISÉE : Récupère tout en une seule requête
    static async getById(id) {
        // Récupérer les données de la vue + notes + id_client + auteur en un seul JOIN
        const devisResult = await pool.query(`
      SELECT 
        v.*,
        d.notes,
        d.id_client as devis_id_client,
        d.auteur
      FROM Vue_DevisTotaux v
      INNER JOIN Devis d ON v.id_devis = d.id_devis
      WHERE v.id_devis = $1
    `, [id]);

        const devis = devisResult.rows[0];

        if (!devis) return null;

        // S'assurer que id_client est présent (de la vue ou de la table)
        if (!devis.id_client && devis.devis_id_client) {
            devis.id_client = devis.devis_id_client;
        }

        // Récupérer les lignes du devis
        const lignesResult = await pool.query('SELECT * FROM LigneDevis WHERE id_devis = $1', [id]);
        devis.lignes = lignesResult.rows;

        return devis;
    }

    /**
     * Générer un numéro de devis unique au format AAXXXX
     * AA = Année (ex: 26 pour 2026)
     * XXXX = Numéro de série sur 4 chiffres
     * @param {Date} date - Date du devis
     * @returns {Promise<string>} Numéro de devis généré
     */
    static async genererNumeroDevis(date = new Date()) {
        // Formater l'année: AA (2 derniers chiffres)
        const annee = date.getFullYear().toString().slice(-2);
        const prefixe = annee;

        // Trouver le dernier numéro avec verrouillage pour éviter les doublons
        const result = await pool.query(`
            SELECT numero_devis 
            FROM Devis 
            WHERE numero_devis ~ '^[0-9]{6}$'
            ORDER BY numero_devis DESC 
            LIMIT 1
            FOR UPDATE
        `);

        let serie = 1;
        if (result.rows.length > 0) {
            // Extraire les 4 derniers chiffres et incrémenter
            const dernierNumero = result.rows[0].numero_devis;
            const derniereSerie = parseInt(dernierNumero.slice(-4), 10);
            serie = derniereSerie + 1;
        }

        return `${prefixe}${serie.toString().padStart(4, '0')}`;
    }

    static async create(data) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Générer le numéro de devis (utiliser celui fourni ou en générer un nouveau)
            let numeroDevis = data.numero_devis;

            if (!numeroDevis) {
                const dateDevis = data.date_devis ? new Date(data.date_devis) : new Date();
                const annee = dateDevis.getFullYear().toString().slice(-2);
                const prefixe = annee;

                // Récupérer le dernier devis (tous confondus)
                const lastResult = await client.query(`
                    SELECT numero_devis 
                    FROM Devis 
                    WHERE numero_devis ~ '^[0-9]{6}$'
                    ORDER BY numero_devis DESC 
                    LIMIT 1
                    FOR UPDATE
                `);

                let serie = 1;
                if (lastResult.rows.length > 0) {
                    // Extraire les 4 derniers chiffres et incrémenter
                    const dernierNumero = lastResult.rows[0].numero_devis;
                    const derniereSerie = parseInt(dernierNumero.slice(-4), 10);
                    serie = derniereSerie + 1;
                }

                numeroDevis = `${prefixe}${serie.toString().padStart(4, '0')}`;
            }

            const result = await client.query(`
                INSERT INTO Devis (numero_devis, id_client, date_devis, date_validite, statut, remise_globale, conditions_paiement, notes, auteur)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [
                numeroDevis,
                data.id_client,
                data.date_devis || new Date().toISOString().split('T')[0],
                data.date_validite || null,
                data.statut || 'Brouillon',
                data.remise_globale || 0,
                data.conditions_paiement || null,
                data.notes || null,
                data.auteur || null
            ]);

            const devisId = result.rows[0].id_devis;

            // 🆕 CRÉER LES LIGNES DU DEVIS si elles sont fournies
            if (data.lignes && Array.isArray(data.lignes) && data.lignes.length > 0) {
                for (const ligne of data.lignes) {
                    // Calculer prix_ttc depuis prix_unitaire_ttc ou prix_ttc (compatibilité)
                    const prixTTC = ligne.prix_unitaire_ttc || ligne.prix_ttc || (ligne.prix_unitaire_ht * (1 + (ligne.taux_tva || 0) / 100));

                    await client.query(`
                        INSERT INTO LigneDevis (id_devis, id_produit, quantite, unite_vente, prix_unitaire_ht, prix_ttc, taux_tva, remise_ligne, description)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    `, [
                        devisId,
                        ligne.id_produit,
                        ligne.quantite,
                        ligne.unite_vente || null,
                        ligne.prix_unitaire_ht,
                        prixTTC,
                        ligne.taux_tva || 0,
                        ligne.remise_ligne || 0,
                        ligne.description || null
                    ]);
                }
            }

            await client.query('COMMIT');
            return this.getById(devisId);

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async update(id, data) {
        // Récupérer les données actuelles pour préserver les champs non modifiés
        const currentDevis = await pool.query('SELECT * FROM Devis WHERE id_devis = $1', [id]);
        if (currentDevis.rows.length === 0) {
            throw new Error('Devis introuvable');
        }

        const current = currentDevis.rows[0];

        // Utiliser les valeurs actuelles si les nouvelles ne sont pas fournies
        const result = await pool.query(`
      UPDATE Devis 
      SET id_client = $1, 
          date_devis = $2, 
          date_validite = $3, 
          statut = $4, 
          remise_globale = $5, 
          conditions_paiement = $6, 
          notes = $7,
          auteur = $8, 
          date_modification = CURRENT_TIMESTAMP
      WHERE id_devis = $9
      RETURNING *
    `, [
            data.id_client ?? current.id_client,
            data.date_devis ?? current.date_devis,
            data.date_validite ?? current.date_validite,
            data.statut ?? current.statut,
            data.remise_globale ?? current.remise_globale,
            data.conditions_paiement ?? current.conditions_paiement,
            data.notes ?? current.notes,
            data.auteur ?? current.auteur,
            id
        ]);

        return this.getById(id);
    }

    static async delete(id) {
        const result = await pool.query('DELETE FROM Devis WHERE id_devis = $1', [id]);
        return result.rowCount;
    }

    // Ajouter une ligne au devis (AVEC PRIX_TTC)
    static async ajouterLigne(id_devis, data) {
        // Calculer prix_ttc si non fourni (pour compatibilité)
        const prixTTC = data.prix_ttc || (data.prix_unitaire_ht * (1 + (data.taux_tva || 0) / 100));

        const result = await pool.query(`
      INSERT INTO LigneDevis (id_devis, id_produit, quantite, unite_vente, prix_unitaire_ht, prix_ttc, taux_tva, remise_ligne, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
            id_devis,
            data.id_produit,
            data.quantite,
            data.unite_vente,
            data.prix_unitaire_ht,
            prixTTC,
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

    // Convertir un devis en facture (AVEC PRIX_TTC)
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
                notes: devis.notes,
                type_facture: 'FACTURE'
            });

            // Copier les lignes du devis vers la facture (AVEC PRIX_TTC)
            for (const ligne of devis.lignes) {
                await Facture.ajouterLigne(facture.id_facture, {
                    id_produit: ligne.id_produit,
                    quantite: ligne.quantite,
                    unite_vente: ligne.unite_vente,
                    prix_unitaire_ht: ligne.prix_unitaire_ht,
                    prix_ttc: ligne.prix_ttc,
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

    // Valider un devis et créer un bon de livraison (AVEC PRIX_TTC)
    static async validerDevis(id_devis) {
        const devis = await this.getById(id_devis);
        if (!devis) throw new Error('Devis introuvable');
        if (devis.statut === 'Validé') throw new Error('Le devis est déjà validé');

        const Facture = require('./Facture');

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Créer un bon de livraison (type_facture = 'BON_LIVRAISON')
            const facture = await Facture.create({
                id_client: devis.id_client,
                id_devis: id_devis,
                type_facture: 'BON_LIVRAISON',
                statut: 'Brouillon',
                remise_globale: devis.remise_globale,
                conditions_paiement: devis.conditions_paiement,
                notes: devis.notes
            });

            // Copier les lignes du devis vers le bon de livraison (AVEC PRIX_TTC)
            for (const ligne of devis.lignes) {
                await Facture.ajouterLigne(facture.id_facture, {
                    id_produit: ligne.id_produit,
                    quantite: ligne.quantite,
                    unite_vente: ligne.unite_vente,
                    prix_unitaire_ht: ligne.prix_unitaire_ht,
                    prix_ttc: ligne.prix_ttc,
                    taux_tva: ligne.taux_tva,
                    remise_ligne: ligne.remise_ligne,
                    description: ligne.description
                });
            }

            // Mettre à jour le devis : statut = 'Validé' et lier le bon de livraison
            await client.query(
                'UPDATE Devis SET statut = $1, id_facture = $2 WHERE id_devis = $3',
                ['Validé', facture.id_facture, id_devis]
            );

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