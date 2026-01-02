// Controller pour les inventaires - PostgreSQL
const Inventaire = require('../models/Inventaire');

exports.getAll = async (req, res) => {
  try {
    const inventaires = await Inventaire.getAll();
    res.json({ success: true, data: inventaires });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const inventaire = await Inventaire.getById(req.params.id);
    if (!inventaire) {
      return res.status(404).json({ success: false, error: 'Inventaire non trouvé' });
    }
    res.json({ success: true, data: inventaire });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const inventaire = await Inventaire.create(req.body);
    res.status(201).json({ success: true, data: inventaire });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const inventaire = await Inventaire.update(req.params.id, req.body);
    res.json({ success: true, data: inventaire });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Inventaire.delete(req.params.id);
    res.json({ success: true, message: 'Inventaire supprimé' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.ajouterLigneMatiere = async (req, res) => {
  try {
    const { id_matiere, stock_physique } = req.body;
    await Inventaire.ajouterLigneMatiere(req.params.id, id_matiere, stock_physique);
    const inventaire = await Inventaire.getById(req.params.id);
    res.json({ success: true, data: inventaire });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.ajouterLigneProduit = async (req, res) => {
  try {
    const { id_produit, stock_physique } = req.body;
    await Inventaire.ajouterLigneProduit(req.params.id, id_produit, stock_physique);
    const inventaire = await Inventaire.getById(req.params.id);
    res.json({ success: true, data: inventaire });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.cloturer = async (req, res) => {
  try {
    const { responsable } = req.body;
    const inventaire = await Inventaire.cloturer(req.params.id, responsable);
    res.json({ success: true, data: inventaire, message: 'Inventaire clôturé et stocks ajustés' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
