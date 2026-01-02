// Controller pour les inventaires
const Inventaire = require('../models/Inventaire');

exports.getAll = (req, res) => {
  try {
    const inventaires = Inventaire.getAll();
    res.json({ success: true, data: inventaires });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = (req, res) => {
  try {
    const inventaire = Inventaire.getById(req.params.id);
    if (!inventaire) {
      return res.status(404).json({ success: false, error: 'Inventaire non trouvé' });
    }
    res.json({ success: true, data: inventaire });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = (req, res) => {
  try {
    const inventaire = Inventaire.create(req.body);
    res.status(201).json({ success: true, data: inventaire });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = (req, res) => {
  try {
    const inventaire = Inventaire.update(req.params.id, req.body);
    res.json({ success: true, data: inventaire });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = (req, res) => {
  try {
    Inventaire.delete(req.params.id);
    res.json({ success: true, message: 'Inventaire supprimé' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// POST /api/inventaires/:id/matieres - Ajouter une ligne matière
exports.ajouterLigneMatiere = (req, res) => {
  try {
    const { id_matiere, stock_physique } = req.body;
    Inventaire.ajouterLigneMatiere(req.params.id, id_matiere, stock_physique);
    const inventaire = Inventaire.getById(req.params.id);
    res.json({ success: true, data: inventaire });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// POST /api/inventaires/:id/produits - Ajouter une ligne produit
exports.ajouterLigneProduit = (req, res) => {
  try {
    const { id_produit, stock_physique } = req.body;
    Inventaire.ajouterLigneProduit(req.params.id, id_produit, stock_physique);
    const inventaire = Inventaire.getById(req.params.id);
    res.json({ success: true, data: inventaire });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// POST /api/inventaires/:id/cloturer - Clôturer l'inventaire
exports.cloturer = (req, res) => {
  try {
    const { responsable } = req.body;
    const inventaire = Inventaire.cloturer(req.params.id, responsable);
    res.json({ success: true, data: inventaire, message: 'Inventaire clôturé et stocks ajustés' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};