// Controller matières premières - PostgreSQL
const MatierePremiere = require('../models/MatierePremiere');

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

exports.update = async (req, res) => {
  try {
    const matiere = await MatierePremiere.update(req.params.id, req.body);
    res.json({ success: true, data: matiere });
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
    const { quantite, responsable, motif } = req.body;
    const matiere = await MatierePremiere.ajusterStock(req.params.id, quantite, responsable, motif);
    res.json({ success: true, data: matiere });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
