// Controller pour les factures - PostgreSQL avec auteur
const Facture = require('../models/Facture');

exports.getAll = async (req, res) => {
    try {
        const factures = await Facture.getAll();
        res.json({ success: true, data: factures });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const facture = await Facture.getById(req.params.id);
        if (!facture) {
            return res.status(404).json({ success: false, error: 'Facture non trouvée' });
        }
        res.json({ success: true, data: facture });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Ajoutez ces méthodes à votre factureController.js

/**
 * Changer le statut d'une facture/bon de commande
 * PUT /factures/:id/statut
 */
exports.changerStatut = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;

        // Validation du statut
        const statutsValides = ['Brouillon', 'En attente', 'En production', 'Livré', 'Annulé', 'Validée'];
        if (!statut || !statutsValides.includes(statut)) {
            return res.status(400).json({
                success: false,
                error: `Statut invalide. Statuts valides: ${statutsValides.join(', ')}`
            });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Récupérer la facture actuelle
            const factureCheck = await client.query(`
                SELECT statut, type_facture FROM facture WHERE id_facture = $1
            `, [id]);

            if (factureCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    error: 'Facture/Bon de commande introuvable'
                });
            }

            const { statut: statutActuel, type_facture } = factureCheck.rows[0];

            // Validation des transitions de statut pour BON_COMMANDE
            if (type_facture === 'BON_COMMANDE') {
                const transitionsValides = {
                    'Brouillon': ['En attente', 'Annulé'],
                    'En attente': ['En production', 'Annulé'],
                    'En production': ['Livré', 'Annulé'],
                    'Livré': [],
                    'Annulé': []
                };

                if (!transitionsValides[statutActuel]?.includes(statut)) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        error: `Transition impossible: ${statutActuel} → ${statut}`
                    });
                }
            }

            // Si passage à "Livré", déduire du stock
            if (statut === 'Livré' && type_facture === 'BON_COMMANDE') {
                const lignesResult = await client.query(`
                    SELECT id_produit, quantite 
                    FROM lignefacture 
                    WHERE id_facture = $1
                `, [id]);

                for (const ligne of lignesResult.rows) {
                    // Vérifier le stock disponible
                    const stockCheck = await client.query(`
                        SELECT stock_actuel, nom 
                        FROM produit 
                        WHERE id_produit = $1
                    `, [ligne.id_produit]);

                    if (stockCheck.rows.length === 0) {
                        throw new Error(`Produit ID ${ligne.id_produit} introuvable`);
                    }

                    const stockActuel = stockCheck.rows[0].stock_actuel;
                    if (stockActuel < ligne.quantite) {
                        throw new Error(
                            `Stock insuffisant pour ${stockCheck.rows[0].nom}. ` +
                            `Disponible: ${stockActuel}, Demandé: ${ligne.quantite}`
                        );
                    }

                    // Déduire du stock
                    await client.query(`
                        UPDATE produit 
                        SET stock_actuel = stock_actuel - $1 
                        WHERE id_produit = $2
                    `, [ligne.quantite, ligne.id_produit]);
                }
            }

            // Mettre à jour le statut
            await client.query(`
                UPDATE facture 
                SET statut = $1, date_modification = CURRENT_TIMESTAMP
                WHERE id_facture = $2
            `, [statut, id]);

            await client.query('COMMIT');

            // Récupérer la facture mise à jour
            const facture = await Facture.getById(id);
            res.json({ success: true, data: facture });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Erreur changerStatut:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erreur lors du changement de statut'
        });
    }
};

/**
 * Mettre à jour une ligne de facture
 * PUT /factures/:id/lignes/:id_ligne
 */
exports.updateLigne = async (req, res) => {
    try {
        const { id, id_ligne } = req.params;
        const { id_produit, quantite, prix_unitaire_ht, prix_ttc, taux_tva, remise_ligne, description, unite_vente } = req.body;

        const result = await pool.query(`
            UPDATE lignefacture 
            SET id_produit = $1, quantite = $2, prix_unitaire_ht = $3, 
                prix_ttc = $4, taux_tva = $5, remise_ligne = $6, 
                description = $7, unite_vente = $8
            WHERE id_ligne = $9 AND id_facture = $10
            RETURNING *
        `, [
            id_produit,
            quantite,
            prix_unitaire_ht,
            prix_ttc,
            taux_tva,
            remise_ligne || 0,
            description || null,
            unite_vente || 'unité',
            id_ligne,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Ligne de facture introuvable'
            });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erreur updateLigne:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erreur lors de la mise à jour de la ligne'
        });
    }
};

/**
 * Supprimer une ligne de facture
 * DELETE /factures/:id/lignes/:id_ligne
 */
exports.deleteLigne = async (req, res) => {
    try {
        const { id, id_ligne } = req.params;

        const result = await pool.query(`
            DELETE FROM lignefacture 
            WHERE id_ligne = $1 AND id_facture = $2
        `, [id_ligne, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Ligne de facture introuvable'
            });
        }

        res.json({
            success: true,
            message: 'Ligne supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur deleteLigne:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erreur lors de la suppression de la ligne'
        });
    }
};
exports.create = async (req, res) => {
    try {
        // Ajouter le nom d'utilisateur connecté aux données
        const factureData = {
            ...req.body,
            auteur: req.user.nom_utilisateur  // req.user vient du middleware authenticate
        };

        const facture = await Facture.create(factureData);
        res.status(201).json({ success: true, data: facture });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const facture = await Facture.update(req.params.id, req.body);
        res.json({ success: true, data: facture });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await Facture.delete(req.params.id);
        res.json({ success: true, message: 'Facture supprimée' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.ajouterLigne = async (req, res) => {
    try {
        await Facture.ajouterLigne(req.params.id, req.body);
        const facture = await Facture.getById(req.params.id);
        res.json({ success: true, data: facture });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.valider = async (req, res) => {
    try {
        const facture = await Facture.valider(req.params.id);
        res.json({ success: true, data: facture, message: 'Facture validée' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getFacturesCredit = async (req, res) => {
    try {
        const factures = await Facture.getFacturesCredit();
        res.json({ success: true, data: factures });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getBonsLivraisonNonFactures = async (req, res) => {
    try {
        const { id_client } = req.params;
        const bons = await Facture.getBonsLivraisonNonFactures(id_client);
        res.json({ success: true, data: bons });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.creerFactureDepuisBons = async (req, res) => {
    try {
        // Ajouter le nom d'utilisateur connecté aux données
        const factureData = {
            ...req.body,
            auteur: req.user.nom_utilisateur
        };

        const facture = await Facture.creerFactureDepuisBons(factureData);
        res.status(201).json({
            success: true,
            data: facture,
            message: 'Facture créée à partir des bons de livraison'
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getBonsLivraisonDeFacture = async (req, res) => {
    try {
        const bons = await Facture.getBonsLivraisonDeFacture(req.params.id);
        res.json({ success: true, data: bons });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};