
// ========== recetteProductionRoutes.js - SÉCURISÉ ==========
const express = require('express');
const router = express.Router();
const controller = require('../controllers/recetteProductionController');
const { authenticate, requirePermission } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', requirePermission('production.read'), controller.getAll);
router.get('/:id', requirePermission('production.read'), controller.getById);
router.get('/produit/:id_produit', requirePermission('production.read'), controller.getByProduit);
router.get('/produit/:id_produit/cout', requirePermission('production.read'), controller.calculerCout);
router.get('/produit/:id_produit/disponibilite', requirePermission('production.read'), controller.verifierDisponibilite);
router.post('/', requirePermission('produits.update'), controller.create);
router.put('/:id', requirePermission('produits.update'), controller.update);
router.delete('/:id', requirePermission('produits.update'), controller.delete);

module.exports = router;
