// Controller pour les factures - PostgreSQL
const Facture = require('../models/Facture');

exports.getAll = async (req, res) => {
  try {
    const factures = await Facture.getAll();
    res.json({ success: true, data: factures });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const facture = await Facture.getById(req.params.id);
    if (!facture) {
      return res.status(404).json({ success: false, error: 'Facture non trouvée' });
    }
    res.json({ success: true, data: facture });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const facture = await Facture.create(req.body);
    res.status(201).json({ success: true, data: facture });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const facture = await Facture.update(req.params.id, req.body);
    res.json({ success: true, data: facture });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Facture.delete(req.params.id);
    res.json({ success: true, message: 'Facture supprimée' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.ajouterLigne = async (req, res) => {
  try {
    await Facture.ajouterLigne(req.params.id, req.body);
    const facture = await Facture.getById(req.params.id);
    res.json({ success: true, data: facture });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.valider = async (req, res) => {
  try {
    const facture = await Facture.valider(req.params.id);
    res.json({ success: true, data: facture, message: 'Facture validée' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getFacturesCredit = async (req, res) => {
  try {
    const factures = await Facture.getFacturesCredit();
    res.json({ success: true, data: factures });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBonsLivraisonNonFactures = async (req, res) => {
    try {
        const { id_client } = req.params;
        const bons = await Facture.getBonsLivraisonNonFactures(id_client);
        res.json({ success: true, data: bons });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.creerFactureDepuisBons = async (req, res) => {
    try {
        const facture = await Facture.creerFactureDepuisBons(req.body);
        res.status(201).json({
            success: true,
            data: facture,
            message: 'Facture créée à partir des bons de livraison'
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getBonsLivraisonDeFacture = async (req, res) => {
    try {
        const bons = await Facture.getBonsLivraisonDeFacture(req.params.id);
        res.json({ success: true, data: bons });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};