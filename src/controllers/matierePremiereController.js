// Controller matières premières - PostgreSQL
const MatierePremiere = require('../models/MatierePremiere');
const pool = require('../database/connection');

exports.getAll = async (req, res) => {
    try {
        const matieres = await MatierePremiere.getAll();
        res.json({ success: true, data: matieres });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const matiere = await MatierePremiere.getById(req.params.id);
        if (!matiere) {
            return res.status(404).json({ success: false, error: 'Matière non trouvée' });
        }
        res.json({ success: true, data: matiere });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getByType = async (req, res) => {
    try {
        const matieres = await MatierePremiere.getByType(req.params.type);
        res.json({ success: true, data: matieres });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getStatsByType = async (req, res) => {
    try {
        const stats = await MatierePremiere.getStatsByType();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const matiere = await MatierePremiere.create(req.body);
        res.status(201).json({ success: true, data: matiere });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// 🆕 UPDATE MODIFIÉ POUR INCLURE LE RESPONSABLE
exports.update = async (req, res) => {
    try {
        // Récupérer l'utilisateur connecté depuis le token JWT
        const responsable = req.user?.username || req.user?.email || 'Utilisateur inconnu';

        // Passer le responsable au model
        const matiere = await MatierePremiere.update(
            req.params.id,
            req.body,
            responsable
        );

        res.json({
            success: true,
            data: matiere,
            message: 'Matière mise à jour avec succès'
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await MatierePremiere.delete(req.params.id);
        res.json({ success: true, message: 'Matière supprimée' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getAlertes = async (req, res) => {
    try {
        const alertes = await MatierePremiere.getAlertes();
        res.json({ success: true, data: alertes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.ajusterStock = async (req, res) => {
    try {
        const { quantite, responsable, typeAjustement, motif } = req.body;

        // Validation
        if (!typeAjustement) {
            return res.status(400).json({
                success: false,
                error: 'Le type d\'ajustement est obligatoire'
            });
        }

        const matiere = await MatierePremiere.ajusterStock(
            req.params.id,
            quantite,
            responsable,
            typeAjustement,
            motif
        );

        res.json({ success: true, data: matiere });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getHistoriqueAjustements = async (req, res) => {
    try {
        const historique = await MatierePremiere.getHistoriqueAjustements(req.params.id);
        res.json({ success: true, data: historique });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getHistoriqueGlobal = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM Vue_HistoriqueAjustements
            WHERE type_article = 'MATIERE'
            ORDER BY date_ajustement DESC
            LIMIT 100
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};