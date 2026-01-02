// Controller pour les clients
const Client = require('../models/Client');

exports.getAll = (req, res) => {
  try {
    const clients = Client.getAll();
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = (req, res) => {
  try {
    const client = Client.getById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client non trouvé' });
    }
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = (req, res) => {
  try {
    const client = Client.create(req.body);
    res.status(201).json({ success: true, data: client });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = (req, res) => {
  try {
    const client = Client.update(req.params.id, req.body);
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = (req, res) => {
  try {
    Client.delete(req.params.id);
    res.json({ success: true, message: 'Client supprimé' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET /api/clients/:id/credits - Récupérer les crédits
exports.getCredits = (req, res) => {
  try {
    const credits = Client.getCredits(req.params.id);
    res.json({ success: true, data: credits });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/clients/types - Récupérer tous les types de clients distincts
exports.getTypes = (req, res) => {
  try {
    const types = Client.getTypes();
    res.json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};