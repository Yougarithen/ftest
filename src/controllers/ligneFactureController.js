// Controller lignes facture - PostgreSQL LL
const LigneFacture = require('../models/LigneFacture');

exports.getAll = async (req, res) => {
  try {
    const lignes = await LigneFacture.getAll();
    res.json({ success: true, data: lignes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const ligne = await LigneFacture.getById(req.params.id);
    if (!ligne) {
      return res.status(404).json({ success: false, error: 'Ligne non trouvée' });
    }
    res.json({ success: true, data: ligne });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByFacture = async (req, res) => {
  try {
    const lignes = await LigneFacture.getByFacture(req.params.id_facture);
    res.json({ success: true, data: lignes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const ligne = await LigneFacture.create(req.body);
    res.status(201).json({ success: true, data: ligne });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const ligne = await LigneFacture.update(req.params.id, req.body);
    res.json({ success: true, data: ligne });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await LigneFacture.delete(req.params.id);
    res.json({ success: true, message: 'Ligne supprimée' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.calculerTotaux = async (req, res) => {
  try {
    const totaux = await LigneFacture.calculerTotaux(req.params.id);
    res.json({ success: true, data: totaux });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.verifierStock = async (req, res) => {
  try {
    const { id_produit, quantite } = req.body;
    const verification = await LigneFacture.verifierStock(id_produit, quantite);
    res.json({ success: true, data: verification });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
