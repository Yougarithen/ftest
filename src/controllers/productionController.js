// Controller production - PostgreSQL
const Production = require('../models/Production');

exports.getAll = async (req, res) => {
  try {
    const productions = await Production.getAll();
    res.json({ success: true, data: productions });
  } catch (error) {
    console.error('Erreur lors de la récupération des productions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const production = await Production.getById(id);
    
    if (!production) {
      return res.status(404).json({ success: false, error: 'Production non trouvée' });
    }
    
    res.json({ success: true, data: production });
  } catch (error) {
    console.error('Erreur lors de la récupération de la production:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByProduit = async (req, res) => {
  try {
    const { id_produit } = req.params;
    const productions = await Production.getByProduit(id_produit);
    res.json({ success: true, data: productions });
  } catch (error) {
    console.error('Erreur lors de la récupération des productions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const production = await Production.create(req.body);
    res.status(201).json({ success: true, data: production });
  } catch (error) {
    console.error('Erreur lors de la création de la production:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.produire = async (req, res) => {
  try {
    const { id_produit, quantite_produite, operateur, commentaire } = req.body;
    
    if (!id_produit || !quantite_produite || !operateur) {
      return res.status(400).json({ 
        success: false, 
        error: 'Données manquantes (id_produit, quantite_produite, operateur requis)' 
      });
    }

    if (quantite_produite <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'La quantité doit être supérieure à 0' 
      });
    }

    const production = await Production.produire(id_produit, quantite_produite, operateur, commentaire);
    
    res.status(201).json({
      success: true,
      data: production,
      message: `Production créée avec succès. ${quantite_produite} unité(s) produite(s).`
    });
  } catch (error) {
    console.error('Erreur lors de la production:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.verifierStock = async (req, res) => {
  try {
    const { id } = req.params;
    const quantite = parseFloat(req.query.quantite) || 1;

    if (quantite <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'La quantité doit être supérieure à 0' 
      });
    }

    const verification = await Production.verifierStock(id, quantite);
    res.json({ success: true, data: verification });
  } catch (error) {
    console.error('Erreur lors de la vérification du stock:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await Production.delete(id);
    res.json({ success: true, message: 'Production supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la production:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};
