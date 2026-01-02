// Controller lignes devis - PostgreSQL
const LigneDevis = require('../models/LigneDevis');

exports.getAll = async (req, res) => {
  try {
    const lignes = await LigneDevis.getAll();
    res.json({ success: true, data: lignes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const ligne = await LigneDevis.getById(req.params.id);
    if (!ligne) {
      return res.status(404).json({ success: false, error: 'Ligne non trouvée' });
    }
    res.json({ success: true, data: ligne });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByDevis = async (req, res) => {
  try {
    const lignes = await LigneDevis.getByDevis(req.params.id_devis);
    res.json({ success: true, data: lignes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const ligne = await LigneDevis.create(req.body);
    res.status(201).json({ success: true, data: ligne });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const ligne = await LigneDevis.update(req.params.id, req.body);
    res.json({ success: true, data: ligne });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await LigneDevis.delete(req.params.id);
    res.json({ success: true, message: 'Ligne supprimée' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.calculerTotaux = async (req, res) => {
  try {
    const totaux = await LigneDevis.calculerTotaux(req.params.id);
    res.json({ success: true, data: totaux });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
