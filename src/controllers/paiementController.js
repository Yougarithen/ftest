// Controller paiements - PostgreSQL
const Paiement = require('../models/Paiement');

exports.getAll = async (req, res) => {
  try {
    const paiements = await Paiement.getAll();
    res.json({ success: true, data: paiements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const paiement = await Paiement.getById(req.params.id);
    if (!paiement) {
      return res.status(404).json({ success: false, error: 'Paiement non trouvé' });
    }
    res.json({ success: true, data: paiement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByFacture = async (req, res) => {
  try {
    const paiements = await Paiement.getByFacture(req.params.id_facture);
    res.json({ success: true, data: paiements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const paiement = await Paiement.create(req.body);
    res.status(201).json({ success: true, data: paiement, message: 'Paiement enregistré' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Paiement.delete(req.params.id);
    res.json({ success: true, message: 'Paiement supprimé' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
