// Controller pour les régions des bons de livraison
const Region = require('../models/Region');

/**
 * Récupérer toutes les régions
 * GET /regions
 */
exports.getAll = async (req, res) => {
    try {
        const regions = await Region.getAll();
        res.json({ success: true, data: regions });
    } catch (error) {
        console.error('Erreur getAll régions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer une région par ID
 * GET /regions/:id
 */
exports.getById = async (req, res) => {
    try {
        const region = await Region.getById(req.params.id);
        if (!region) {
            return res.status(404).json({ success: false, error: 'Région non trouvée' });
        }
        res.json({ success: true, data: region });
    } catch (error) {
        console.error('Erreur getById région:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer une région par ID de bon de livraison
 * GET /regions/bon-livraison/:idBonLivraison
 */
exports.getByBonLivraison = async (req, res) => {
    try {
        const region = await Region.getByBonLivraison(req.params.idBonLivraison);
        if (!region) {
            return res.status(404).json({ 
                success: false, 
                error: 'Aucune région assignée à ce bon de livraison' 
            });
        }
        res.json({ success: true, data: region });
    } catch (error) {
        console.error('Erreur getByBonLivraison:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Créer une nouvelle région pour un bon de livraison
 * POST /regions
 * Body: { id_bon_livraison, nom_region, nom_chauffeur?, frais_transport? }
 */
exports.create = async (req, res) => {
    try {
        const { id_bon_livraison, nom_region, nom_chauffeur, frais_transport } = req.body;
        
        // Validation
        if (!id_bon_livraison || !nom_region) {
            return res.status(400).json({
                success: false,
                error: 'id_bon_livraison et nom_region sont requis'
            });
        }
        
        const regionsValides = ['Ouest', 'Est', 'Centre'];
        if (!regionsValides.includes(nom_region)) {
            return res.status(400).json({
                success: false,
                error: `Région invalide. Régions valides: ${regionsValides.join(', ')}`
            });
        }
        
        const region = await Region.create({
            id_bon_livraison,
            nom_region,
            nom_chauffeur,
            frais_transport
        });
        
        res.status(201).json({ 
            success: true, 
            data: region,
            message: 'Région assignée avec succès'
        });
    } catch (error) {
        console.error('Erreur create région:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * Mettre à jour une région
 * PUT /regions/:id
 * Body: { nom_region, nom_chauffeur?, frais_transport? }
 */
exports.update = async (req, res) => {
    try {
        const { nom_region, nom_chauffeur, frais_transport } = req.body;
        
        // Validation
        if (!nom_region) {
            return res.status(400).json({
                success: false,
                error: 'nom_region est requis'
            });
        }
        
        const regionsValides = ['Ouest', 'Est', 'Centre'];
        if (!regionsValides.includes(nom_region)) {
            return res.status(400).json({
                success: false,
                error: `Région invalide. Régions valides: ${regionsValides.join(', ')}`
            });
        }
        
        const region = await Region.update(req.params.id, {
            nom_region,
            nom_chauffeur,
            frais_transport
        });
        
        res.json({ 
            success: true, 
            data: region,
            message: 'Région mise à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur update région:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * Supprimer une région
 * DELETE /regions/:id
 */
exports.delete = async (req, res) => {
    try {
        await Region.delete(req.params.id);
        res.json({ 
            success: true, 
            message: 'Région supprimée avec succès' 
        });
    } catch (error) {
        console.error('Erreur delete région:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer toutes les régions par nom de région
 * GET /regions/par-nom/:nomRegion
 */
exports.getByNomRegion = async (req, res) => {
    try {
        const { nomRegion } = req.params;
        
        const regionsValides = ['Ouest', 'Est', 'Centre'];
        if (!regionsValides.includes(nomRegion)) {
            return res.status(400).json({
                success: false,
                error: `Région invalide. Régions valides: ${regionsValides.join(', ')}`
            });
        }
        
        const regions = await Region.getByNomRegion(nomRegion);
        res.json({ success: true, data: regions });
    } catch (error) {
        console.error('Erreur getByNomRegion:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer toutes les régions par chauffeur
 * GET /regions/par-chauffeur/:nomChauffeur
 */
exports.getByChauffeur = async (req, res) => {
    try {
        const regions = await Region.getByChauffeur(req.params.nomChauffeur);
        res.json({ success: true, data: regions });
    } catch (error) {
        console.error('Erreur getByChauffeur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Obtenir les statistiques par région
 * GET /regions/statistiques
 */
exports.getStatistiques = async (req, res) => {
    try {
        const stats = await Region.getStatistiquesParRegion();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Erreur getStatistiques:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Récupérer les bons de livraison sans région assignée
 * GET /regions/bons-sans-region
 */
exports.getBonsLivraisonSansRegion = async (req, res) => {
    try {
        const bons = await Region.getBonsLivraisonSansRegion();
        res.json({ success: true, data: bons });
    } catch (error) {
        console.error('Erreur getBonsLivraisonSansRegion:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
