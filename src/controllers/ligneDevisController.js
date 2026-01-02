// ========== controllers/ligneDevisController.js ==========
const LigneDevis = require('../models/LigneDevis');

exports.getAll = (req, res) => {
  try {
    const lignes = LigneDevis.getAll();
    res.json({ success: true, data: lignes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = (req, res) => {
  try {
    const ligne = LigneDevis.getById(req.params.id);
    if (!ligne) {
      return res.status(404).json({ success: false, error: 'Ligne non trouvée' });
    }
    res.json({ success: true, data: ligne });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByDevis = (req, res) => {
  try {
    const lignes = LigneDevis.getByDevis(req.params.id_devis);
    res.json({ success: true, data: lignes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = (req, res) => {
  try {
    const ligne = LigneDevis.create(req.body);
    res.status(201).json({ success: true, data: ligne });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = (req, res) => {
  try {
    const ligne = LigneDevis.update(req.params.id, req.body);
    res.json({ success: true, data: ligne });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = (req, res) => {
  try {
    LigneDevis.delete(req.params.id);
    res.json({ success: true, message: 'Ligne supprimée' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.calculerTotaux = (req, res) => {
  try {
    const totaux = LigneDevis.calculerTotaux(req.params.id);
    res.json({ success: true, data: totaux });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
