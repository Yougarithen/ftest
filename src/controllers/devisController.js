// Controller pour les devis
const Devis = require('../models/Devis');

exports.getAll = (req, res) => {
  try {
    const devis = Devis.getAll();
    res.json({ success: true, data: devis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = (req, res) => {
  try {
    const devis = Devis.getById(req.params.id);
    if (!devis) {
      return res.status(404).json({ success: false, error: 'Devis non trouvé' });
    }
    res.json({ success: true, data: devis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = (req, res) => {
  try {
    const devis = Devis.create(req.body);
    res.status(201).json({ success: true, data: devis });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = (req, res) => {
  try {
    const devis = Devis.update(req.params.id, req.body);
    res.json({ success: true, data: devis });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = (req, res) => {
  try {
    Devis.delete(req.params.id);
    res.json({ success: true, message: 'Devis supprimé' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// POST /api/devis/:id/lignes - Ajouter une ligne
exports.ajouterLigne = (req, res) => {
  try {
    Devis.ajouterLigne(req.params.id, req.body);
    const devis = Devis.getById(req.params.id);
    res.json({ success: true, data: devis });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// POST /api/devis/:id/convertir - Convertir en facture
exports.convertirEnFacture = (req, res) => {
  try {
    const facture = Devis.convertirEnFacture(req.params.id);
    res.json({ success: true, data: facture, message: 'Devis converti en facture' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};