// controllers/productionController.js
const Production = require('../models/Production');

/**
 * Récupérer toutes les productions avec les détails du produit
 */
exports.getAll = (req, res) => {
  try {
    const productions = Production.getAll();
    res.json({ 
      success: true, 
      data: productions 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des productions:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * Récupérer une production par ID
 */
exports.getById = (req, res) => {
  try {
    const { id } = req.params;
    const production = Production.getById(id);
    
    if (!production) {
      return res.status(404).json({ 
        success: false, 
        error: 'Production non trouvée' 
      });
    }
    
    res.json({ 
      success: true, 
      data: production 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la production:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * Récupérer les productions d'un produit spécifique
 */
exports.getByProduit = (req, res) => {
  try {
    const { id_produit } = req.params;
    const productions = Production.getByProduit(id_produit);
    
    res.json({ 
      success: true, 
      data: productions 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des productions:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * Créer une entrée de production simple (sans logique de stock)
 */
exports.create = (req, res) => {
  try {
    const production = Production.create(req.body);
    
    res.status(201).json({ 
      success: true, 
      data: production 
    });
  } catch (error) {
    console.error('Erreur lors de la création de la production:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * 🎯 PRODUIRE - Fonction principale avec logique complète
 * Cette fonction :
 * 1. Vérifie le stock des matières premières
 * 2. Déduit les matières premières
 * 3. Ajoute le produit fini au stock
 * 4. Enregistre la production
 */
exports.produire = (req, res) => {
  try {
    const { id_produit, quantite_produite, operateur, commentaire } = req.body;
    
    // Validation des données
    if (!id_produit || !quantite_produite || !operateur) {
      return res.status(400).json({ 
        success: false, 
        error: 'Données manquantes (id_produit, quantite_produite, operateur requis)' 
      });
    }

    if (quantite_produite <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'La quantité doit être supérieure à 0' 
      });
    }

    // Appeler la méthode du modèle qui gère toute la logique
    const production = Production.produire(
      id_produit, 
      quantite_produite, 
      operateur, 
      commentaire
    );
    
    res.status(201).json({
      success: true,
      data: production,
      message: `Production créée avec succès. ${quantite_produite} unité(s) produite(s).`
    });

  } catch (error) {
    console.error('Erreur lors de la production:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * 🆕 Vérifier le stock avant production
 * Endpoint: GET /production/verifier-stock/:id?quantite=100
 */
exports.verifierStock = (req, res) => {
  try {
    const { id } = req.params;
    const quantite = parseFloat(req.query.quantite) || 1;

    if (quantite <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'La quantité doit être supérieure à 0' 
      });
    }

    // Appeler la méthode du modèle pour vérifier le stock
    const verification = Production.verifierStock(id, quantite);

    res.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du stock:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * Supprimer une production
 */
exports.delete = (req, res) => {
  try {
    const { id } = req.params;
    Production.delete(id);
    
    res.json({ 
      success: true, 
      message: 'Production supprimée avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la production:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};