// Controller produits - PostgreSQL
const Produit = require('../models/Produit');

exports.getAll = async (req, res) => {
  try {
    const produits = await Produit.getAll();
    res.json({ success: true, data: produits });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.ajusterStock = async (req, res) => {
    try {
        const { quantite, responsable, typeAjustement, motif } = req.body;

        // Validation
        if (!typeAjustement) {
            return res.status(400).json({
                success: false,
                error: 'Le type d\'ajustement est obligatoire'
            });
        }

        const produit = await Produit.ajusterStock(
            req.params.id,
            quantite,
            responsable,
            typeAjustement,
            motif
        );

        res.json({ success: true, data: produit });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.getHistoriqueGlobal = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT * FROM Vue_HistoriqueAjustements
      WHERE type_article = 'PRODUIT'
      ORDER BY date_ajustement DESC
      LIMIT 100
    `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getHistoriqueAjustements = async (req, res) => {
    try {
        const historique = await Produit.getHistoriqueAjustements(req.params.id);
        res.json({ success: true, data: historique });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getById = async (req, res) => {
  try {
    const produit = await Produit.getById(req.params.id);
    if (!produit) {
      return res.status(404).json({ success: false, error: 'Produit non trouvé' });
    }
    res.json({ success: true, data: produit });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const produit = await Produit.create(req.body);
    res.status(201).json({ success: true, data: produit });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const produit = await Produit.update(req.params.id, req.body);
    res.json({ success: true, data: produit });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Produit.delete(req.params.id);
    res.json({ success: true, message: 'Produit supprimé' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getRecette = async (req, res) => {
  try {
    const recette = await Produit.getRecette(req.params.id);
    res.json({ success: true, data: recette });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.ajouterIngredient = async (req, res) => {
  try {
    const { id_matiere, quantite } = req.body;
    await Produit.ajouterIngredient(req.params.id, id_matiere, quantite);
    const recette = await Produit.getRecette(req.params.id);
    res.json({ success: true, data: recette });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
