// Controller pour les factures
const Facture = require('../models/Facture');

exports.getAll = (req, res) => {
  try {
    const factures = Facture.getAll();
    res.json({ success: true, data: factures });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = (req, res) => {
  try {
    const facture = Facture.getById(req.params.id);
    if (!facture) {
      return res.status(404).json({ success: false, error: 'Facture non trouvée' });
    }
    res.json({ success: true, data: facture });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = (req, res) => {
  try {
    const facture = Facture.create(req.body);
    res.status(201).json({ success: true, data: facture });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = (req, res) => {
  try {
    const facture = Facture.update(req.params.id, req.body);
    res.json({ success: true, data: facture });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = (req, res) => {
  try {
    Facture.delete(req.params.id);
    res.json({ success: true, message: 'Facture supprimée' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// POST /api/factures/:id/lignes - Ajouter une ligne
exports.ajouterLigne = (req, res) => {
  try {
    Facture.ajouterLigne(req.params.id, req.body);
    const facture = Facture.getById(req.params.id);
    res.json({ success: true, data: facture });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// POST /api/factures/:id/valider - Valider une facture
exports.valider = (req, res) => {
  try {
    const facture = Facture.valider(req.params.id);
    res.json({ success: true, data: facture, message: 'Facture validée' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET /api/factures/credit - Récupérer les factures en crédit
exports.getFacturesCredit = (req, res) => {
  try {
    const factures = Facture.getFacturesCredit();
    res.json({ success: true, data: factures });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
