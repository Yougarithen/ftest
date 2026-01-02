// ========== controllers/recetteProductionController.js ==========
const RecetteProduction = require('../models/RecetteProduction');

exports.getAll = (req, res) => {
  try {
    const recettes = RecetteProduction.getAll();
    res.json({ success: true, data: recettes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = (req, res) => {
  try {
    const recette = RecetteProduction.getById(req.params.id);
    if (!recette) {
      return res.status(404).json({ success: false, error: 'Recette non trouvée' });
    }
    res.json({ success: true, data: recette });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByProduit = (req, res) => {
  try {
    const recettes = RecetteProduction.getByProduit(req.params.id_produit);
    res.json({ success: true, data: recettes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = (req, res) => {
  try {
    const recette = RecetteProduction.create(req.body);
    res.status(201).json({ success: true, data: recette });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = (req, res) => {
  try {
    const recette = RecetteProduction.update(req.params.id, req.body);
    res.json({ success: true, data: recette });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = (req, res) => {
  try {
    RecetteProduction.delete(req.params.id);
    res.json({ success: true, message: 'Recette supprimée' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.calculerCout = (req, res) => {
  try {
    const { id_produit } = req.params;
    const { quantite } = req.query;
    const cout = RecetteProduction.calculerCoutProduction(id_produit, quantite || 1);
    res.json({ success: true, data: cout });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.verifierDisponibilite = (req, res) => {
  try {
    const { id_produit } = req.params;
    const { quantite } = req.query;
    const disponibilite = RecetteProduction.verifierDisponibilite(id_produit, quantite || 1);
    res.json({ success: true, data: disponibilite });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
