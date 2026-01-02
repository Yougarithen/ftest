// Controller pour les matières premières
const MatierePremiere = require('../models/MatierePremiere');

// GET /api/matieres - Récupérer toutes les matières
exports.getAll = (req, res) => {
  try {
    const matieres = MatierePremiere.getAll();
    res.json({ success: true, data: matieres });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/matieres/:id - Récupérer une matière par ID
exports.getById = (req, res) => {
  try {
    const matiere = MatierePremiere.getById(req.params.id);
    if (!matiere) {
      return res.status(404).json({ success: false, error: 'Matière non trouvée' });
    }
    res.json({ success: true, data: matiere });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/matieres/type/:type - Récupérer les matières par type
exports.getByType = (req, res) => {
  try {
    const matieres = MatierePremiere.getByType(req.params.type);
    res.json({ success: true, data: matieres });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/matieres/stats/by-type - Récupérer les statistiques par type
exports.getStatsByType = (req, res) => {
  try {
    const stats = MatierePremiere.getStatsByType();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/matieres - Créer une nouvelle matière
exports.create = (req, res) => {
  try {
    const matiere = MatierePremiere.create(req.body);
    res.status(201).json({ success: true, data: matiere });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// PUT /api/matieres/:id - Mettre à jour une matière
exports.update = (req, res) => {
  try {
    const matiere = MatierePremiere.update(req.params.id, req.body);
    res.json({ success: true, data: matiere });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// DELETE /api/matieres/:id - Supprimer une matière
exports.delete = (req, res) => {
  try {
    MatierePremiere.delete(req.params.id);
    res.json({ success: true, message: 'Matière supprimée' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET /api/matieres/alertes - Récupérer les alertes de stock
exports.getAlertes = (req, res) => {
  try {
    const alertes = MatierePremiere.getAlertes();
    res.json({ success: true, data: alertes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/matieres/:id/ajuster - Ajuster le stock
exports.ajusterStock = (req, res) => {
  try {
    const { quantite, responsable, motif } = req.body;
    const matiere = MatierePremiere.ajusterStock(req.params.id, quantite, responsable, motif);
    res.json({ success: true, data: matiere });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};