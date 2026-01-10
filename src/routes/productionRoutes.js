// ========== productionRoutes.js - SÉCURISÉ avec gestion rebuts ==========
const express = require('express');
const router = express.Router();
const controller = require('../controllers/productionController');
const { authenticate, requirePermission } = require('../middleware/authMiddleware');

router.use(authenticate);

// Routes générales
router.get('/', requirePermission('production.read'), controller.getAll);
router.get('/:id', requirePermission('production.read'), controller.getById);
router.get('/produit/:id_produit', requirePermission('production.read'), controller.getByProduit);

// Route pour vérifier le stock AVANT la production
// IMPORTANT : Doit être AVANT '/:id' pour éviter les conflits
router.get('/verifier-stock/:id', requirePermission('production.read'), controller.verifierStock);

// Routes de création/modification
router.post('/', requirePermission('production.create'), controller.create);
router.post('/produire', requirePermission('production.create'), controller.produire);

// Route pour mettre à jour les rebuts d'une production existante
router.patch('/:id/rebuts', requirePermission('production.update'), controller.updateRebuts);

// Routes de suppression
router.delete('/:id', requirePermission('production.delete'), controller.delete);

module.exports = router;