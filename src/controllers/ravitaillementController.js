// Controller ravitaillements - PostgreSQL
const Ravitaillement = require('../models/Ravitaillement');

exports.getAll = async (req, res) => {
    try {
        const ravitaillements = await Ravitaillement.getAll();
        res.json({ success: true, data: ravitaillements });
    } catch (error) {
        console.error('Erreur getAll ravitaillements:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const ravitaillement = await Ravitaillement.getById(req.params.id);
        if (!ravitaillement) {
            return res.status(404).json({ success: false, error: 'Ravitaillement non trouvé' });
        }
        res.json({ success: true, data: ravitaillement });
    } catch (error) {
        console.error('Erreur getById ravitaillement:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getByMatiere = async (req, res) => {
    try {
        const ravitaillements = await Ravitaillement.getByMatiere(req.params.idMatiere);
        res.json({ success: true, data: ravitaillements });
    } catch (error) {
        console.error('Erreur getByMatiere:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getByPeriode = async (req, res) => {
    try {
        const { dateDebut, dateFin } = req.query;

        if (!dateDebut || !dateFin) {
            return res.status(400).json({
                success: false,
                error: 'Les paramètres dateDebut et dateFin sont requis'
            });
        }

        const ravitaillements = await Ravitaillement.getByPeriode(dateDebut, dateFin);
        res.json({ success: true, data: ravitaillements });
    } catch (error) {
        console.error('Erreur getByPeriode:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { id_matiere, quantite, prix_achat, fournisseur, numero_bon_livraison, commentaire, responsable } = req.body;

        // Validation
        if (!id_matiere || !quantite || !responsable) {
            return res.status(400).json({
                success: false,
                error: 'Les champs id_matiere, quantite et responsable sont requis'
            });
        }

        if (quantite <= 0) {
            return res.status(400).json({
                success: false,
                error: 'La quantité doit être supérieure à 0'
            });
        }

        const ravitaillement = await Ravitaillement.create({
            id_matiere,
            quantite,
            prix_achat,
            fournisseur,
            numero_bon_livraison,
            commentaire,
            responsable
        });

        res.status(201).json({
            success: true,
            data: ravitaillement,
            message: 'Ravitaillement enregistré avec succès'
        });
    } catch (error) {
        console.error('Erreur create ravitaillement:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const result = await Ravitaillement.delete(req.params.id);
        res.json({
            success: true,
            message: 'Ravitaillement supprimé avec succès',
            data: result
        });
    } catch (error) {
        console.error('Erreur delete ravitaillement:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const stats = await Ravitaillement.getStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Erreur getStats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getStatsByMatiere = async (req, res) => {
    try {
        const stats = await Ravitaillement.getStatsByMatiere();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Erreur getStatsByMatiere:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};