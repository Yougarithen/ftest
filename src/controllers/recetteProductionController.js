// Controller recettes production - PostgreSQL
const RecetteProduction = require('../models/RecetteProduction');

exports.getAll = async (req, res) => {
  try {
    const recettes = await RecetteProduction.getAll();
    res.json({ success: true, data: recettes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const recette = await RecetteProduction.getById(req.params.id);
    if (!recette) {
      return res.status(404).json({ success: false, error: 'Recette non trouvée' });
    }
    res.json({ success: true, data: recette });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByProduit = async (req, res) => {
  try {
    const recettes = await RecetteProduction.getByProduit(req.params.id_produit);
    res.json({ success: true, data: recettes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const recette = await RecetteProduction.create(req.body);
    res.status(201).json({ success: true, data: recette });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const recette = await RecetteProduction.update(req.params.id, req.body);
    res.json({ success: true, data: recette });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await RecetteProduction.delete(req.params.id);
    res.json({ success: true, message: 'Recette supprimée' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.calculerCout = async (req, res) => {
  try {
    const { id_produit } = req.params;
    const { quantite } = req.query;
    const cout = await RecetteProduction.calculerCoutProduction(id_produit, quantite || 1);
    res.json({ success: true, data: cout });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.verifierDisponibilite = async (req, res) => {
  try {
    const { id_produit } = req.params;
    const { quantite } = req.query;
    const disponibilite = await RecetteProduction.verifierDisponibilite(id_produit, quantite || 1);
    res.json({ success: true, data: disponibilite });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
