// Controller pour les devis - PostgreSQL
const Devis = require('../models/Devis');

exports.getAll = async (req, res) => {
    try {
        const devis = await Devis.getAll();
        res.json({ success: true, data: devis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// À ajouter dans devisController.js

exports.validerDevis = async (req, res) => {
    try {
        const bonLivraison = await Devis.validerDevis(req.params.id);
        res.json({
            success: true,
            data: bonLivraison,
            message: 'Devis validé et bon de livraison créé avec succès'
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const devis = await Devis.getById(req.params.id);
        if (!devis) {
            return res.status(404).json({ success: false, error: 'Devis non trouvé' });
        }
        res.json({ success: true, data: devis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        // Ajouter automatiquement le nom de l'utilisateur connecté comme auteur
        const devisData = {
            ...req.body,
            auteur: req.user ? `${req.user.prenom} ${req.user.nom}` : req.body.auteur
        };

        const devis = await Devis.create(devisData);
        res.status(201).json({ success: true, data: devis });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const devis = await Devis.update(req.params.id, req.body);
        res.json({ success: true, data: devis });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await Devis.delete(req.params.id);
        res.json({ success: true, message: 'Devis supprimé' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.ajouterLigne = async (req, res) => {
    try {
        await Devis.ajouterLigne(req.params.id, req.body);
        const devis = await Devis.getById(req.params.id);
        res.json({ success: true, data: devis });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.convertirEnFacture = async (req, res) => {
    try {
        const facture = await Devis.convertirEnFacture(req.params.id);
        res.json({ success: true, data: facture, message: 'Devis converti en facture' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};