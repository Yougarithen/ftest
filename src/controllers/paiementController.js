// Controller pour les paiements
const Paiement = require('../models/Paiement');

exports.getAll = (req, res) => {
  try {
    const paiements = Paiement.getAll();
    res.json({ success: true, data: paiements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = (req, res) => {
  try {
    const paiement = Paiement.getById(req.params.id);
    if (!paiement) {
      return res.status(404).json({ success: false, error: 'Paiement non trouvé' });
    }
    res.json({ success: true, data: paiement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByFacture = (req, res) => {
  try {
    const paiements = Paiement.getByFacture(req.params.id_facture);
    res.json({ success: true, data: paiements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = (req, res) => {
  try {
    const paiement = Paiement.create(req.body);
    res.status(201).json({ success: true, data: paiement, message: 'Paiement enregistré' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = (req, res) => {
  try {
    Paiement.delete(req.params.id);
    res.json({ success: true, message: 'Paiement supprimé' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};