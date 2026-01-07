// ========== produitRoutes.js - SÉCURISÉ ==========
const express = require('express');
const router = express.Router();
const controller = require('../controllers/produitController');
const { authenticate, requirePermission } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', requirePermission('produits.read'), controller.getAll);

// 👇 AJOUTER CETTE ROUTE AVANT /:id
router.get('/historique-global', requirePermission('produits.read'), controller.getHistoriqueGlobal);

router.get('/:id', requirePermission('produits.read'), controller.getById);
router.post('/', requirePermission('produits.create'), controller.create);
router.put('/:id', requirePermission('produits.update'), controller.update);
router.delete('/:id', requirePermission('produits.delete'), controller.delete);
router.get('/:id/recette', requirePermission('produits.read'), controller.getRecette);
router.post('/:id/recette', requirePermission('produits.update'), controller.ajouterIngredient);
router.post('/:id/ajuster', requirePermission('produits.update'), controller.ajusterStock);
router.get('/:id/historique', requirePermission('produits.read'), controller.getHistoriqueAjustements);

module.exports = router;