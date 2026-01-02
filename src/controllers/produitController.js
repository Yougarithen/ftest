// Controller pour les produits
const Produit = require('../models/Produit');

exports.getAll = (req, res) => {
  try {
    const produits = Produit.getAll();
    res.json({ success: true, data: produits });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = (req, res) => {
  try {
    const produit = Produit.getById(req.params.id);
    if (!produit) {
      return res.status(404).json({ success: false, error: 'Produit non trouvé' });
    }
    res.json({ success: true, data: produit });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = (req, res) => {
  try {
    const produit = Produit.create(req.body);
    res.status(201).json({ success: true, data: produit });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = (req, res) => {
  try {
    const produit = Produit.update(req.params.id, req.body);
    res.json({ success: true, data: produit });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = (req, res) => {
  try {
    Produit.delete(req.params.id);
    res.json({ success: true, message: 'Produit supprimé' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET /api/produits/:id/recette - Récupérer la recette
exports.getRecette = (req, res) => {
  try {
    const recette = Produit.getRecette(req.params.id);
    res.json({ success: true, data: recette });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/produits/:id/recette - Ajouter un ingrédient
exports.ajouterIngredient = (req, res) => {
  try {
    const { id_matiere, quantite } = req.body;
    Produit.ajouterIngredient(req.params.id, id_matiere, quantite);
    const recette = Produit.getRecette(req.params.id);
    res.json({ success: true, data: recette });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};