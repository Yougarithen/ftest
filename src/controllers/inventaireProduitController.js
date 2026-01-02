// Controller pour inventaire produits - PostgreSQL
const InventaireProduit = require('../models/InventaireProduit');

exports.getAll = async (req, res) => {
  try {
    const lignes = await InventaireProduit.getAll();
    res.json({ success: true, data: lignes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const ligne = await InventaireProduit.getById(req.params.id);
    if (!ligne) {
      return res.status(404).json({ success: false, error: 'Ligne non trouvée' });
    }
    res.json({ success: true, data: ligne });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByInventaire = async (req, res) => {
  try {
    const lignes = await InventaireProduit.getByInventaire(req.params.id_inventaire);
    res.json({ success: true, data: lignes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const ligne = await InventaireProduit.create(req.body);
    res.status(201).json({ success: true, data: ligne });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const ligne = await InventaireProduit.update(req.params.id, req.body);
    res.json({ success: true, data: ligne });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await InventaireProduit.delete(req.params.id);
    res.json({ success: true, message: 'Ligne supprimée' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getEcartsSignificatifs = async (req, res) => {
  try {
    const ecarts = await InventaireProduit.getEcartsSignificatifs(req.params.id_inventaire);
    res.json({ success: true, data: ecarts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
