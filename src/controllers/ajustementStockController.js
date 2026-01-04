// Controller pour les ajustements de stock - PostgreSQL LOL
const AjustementStock = require('../models/AjustementStock');

exports.getAll = async (req, res) => {
  try {
    const ajustements = await AjustementStock.getAll();
    res.json({ success: true, data: ajustements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const ajustement = await AjustementStock.getById(req.params.id);
    if (!ajustement) {
      return res.status(404).json({ success: false, error: 'Ajustement non trouvé' });
    }
    res.json({ success: true, data: ajustement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByArticle = async (req, res) => {
  try {
    const { type_article, id_article } = req.params;
    const ajustements = await AjustementStock.getByArticle(type_article, id_article);
    res.json({ success: true, data: ajustements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByInventaire = async (req, res) => {
  try {
    const ajustements = await AjustementStock.getByInventaire(req.params.id_inventaire);
    res.json({ success: true, data: ajustements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
