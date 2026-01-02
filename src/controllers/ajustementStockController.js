// Controller pour les ajustements de stock
const AjustementStock = require('../models/AjustementStock');

exports.getAll = (req, res) => {
  try {
    const ajustements = AjustementStock.getAll();
    res.json({ success: true, data: ajustements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = (req, res) => {
  try {
    const ajustement = AjustementStock.getById(req.params.id);
    if (!ajustement) {
      return res.status(404).json({ success: false, error: 'Ajustement non trouvé' });
    }
    res.json({ success: true, data: ajustement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByArticle = (req, res) => {
  try {
    const { type_article, id_article } = req.params;
    const ajustements = AjustementStock.getByArticle(type_article, id_article);
    res.json({ success: true, data: ajustements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByInventaire = (req, res) => {
  try {
    const ajustements = AjustementStock.getByInventaire(req.params.id_inventaire);
    res.json({ success: true, data: ajustements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};