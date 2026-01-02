// ========== controllers/ligneFactureController.js ==========
const LigneFacture = require('../models/LigneFacture');

exports.getAll = (req, res) => {
  try {
    const lignes = LigneFacture.getAll();
    res.json({ success: true, data: lignes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = (req, res) => {
  try {
    const ligne = LigneFacture.getById(req.params.id);
    if (!ligne) {
      return res.status(404).json({ success: false, error: 'Ligne non trouvée' });
    }
    res.json({ success: true, data: ligne });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByFacture = (req, res) => {
  try {
    const lignes = LigneFacture.getByFacture(req.params.id_facture);
    res.json({ success: true, data: lignes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = (req, res) => {
  try {
    const ligne = LigneFacture.create(req.body);
    res.status(201).json({ success: true, data: ligne });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = (req, res) => {
  try {
    const ligne = LigneFacture.update(req.params.id, req.body);
    res.json({ success: true, data: ligne });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = (req, res) => {
  try {
    LigneFacture.delete(req.params.id);
    res.json({ success: true, message: 'Ligne supprimée' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.calculerTotaux = (req, res) => {
  try {
    const totaux = LigneFacture.calculerTotaux(req.params.id);
    res.json({ success: true, data: totaux });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.verifierStock = (req, res) => {
  try {
    const { id_produit, quantite } = req.body;
    const verification = LigneFacture.verifierStock(id_produit, quantite);
    res.json({ success: true, data: verification });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
