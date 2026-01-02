// Controller pour les clients - PostgreSQL
const Client = require('../models/Client');

exports.getAll = async (req, res) => {
  try {
    const clients = await Client.getAll();
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const client = await Client.getById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client non trouvé' });
    }
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json({ success: true, data: client });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const client = await Client.update(req.params.id, req.body);
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Client.delete(req.params.id);
    res.json({ success: true, message: 'Client supprimé' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getCredits = async (req, res) => {
  try {
    const credits = await Client.getCredits(req.params.id);
    res.json({ success: true, data: credits });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTypes = async (req, res) => {
  try {
    const types = await Client.getTypes();
    res.json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
