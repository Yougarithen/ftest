// ========== controllers/inventaireProduitController.js ==========
const InventaireProduit = require('../models/InventaireProduit');

exports.getAll = (req, res) => {
  try {
    const lignes = InventaireProduit.getAll();
    res.json({ success: true, data: lignes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = (req, res) => {
  try {
    const ligne = InventaireProduit.getById(req.params.id);
    if (!ligne) {
      return res.status(404).json({ success: false, error: 'Ligne non trouvée' });
    }
    res.json({ success: true, data: ligne });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByInventaire = (req, res) => {
  try {
    const lignes = InventaireProduit.getByInventaire(req.params.id_inventaire);
    res.json({ success: true, data: lignes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = (req, res) => {
  try {
    const ligne = InventaireProduit.create(req.body);
    res.status(201).json({ success: true, data: ligne });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = (req, res) => {
  try {
    const ligne = InventaireProduit.update(req.params.id, req.body);
    res.json({ success: true, data: ligne });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = (req, res) => {
  try {
    InventaireProduit.delete(req.params.id);
    res.json({ success: true, message: 'Ligne supprimée' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getEcartsSignificatifs = (req, res) => {
  try {
    const ecarts = InventaireProduit.getEcartsSignificatifs(req.params.id_inventaire);
    res.json({ success: true, data: ecarts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
