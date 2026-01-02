
// ========== ligneDevisRoutes.js - SÉCURISÉ ==========
const express = require('express');
const router = express.Router();
const controller = require('../controllers/ligneDevisController');
const { authenticate, requirePermission } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', requirePermission('devis.read'), controller.getAll);
router.get('/:id', requirePermission('devis.read'), controller.getById);
router.get('/devis/:id_devis', requirePermission('devis.read'), controller.getByDevis);
router.get('/:id/totaux', requirePermission('devis.read'), controller.calculerTotaux);
router.post('/', requirePermission('devis.update'), controller.create);
router.put('/:id', requirePermission('devis.update'), controller.update);
router.delete('/:id', requirePermission('devis.update'), controller.delete);

module.exports = router;
