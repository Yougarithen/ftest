
// ========== paiementRoutes.js - SÉCURISÉ ==========
const express = require('express');
const router = express.Router();
const controller = require('../controllers/paiementController');
const { authenticate, requirePermission } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', requirePermission('paiements.read'), controller.getAll);
router.get('/:id', requirePermission('paiements.read'), controller.getById);
router.get('/facture/:id_facture', requirePermission('paiements.read'), controller.getByFacture);
router.post('/', requirePermission('paiements.create'), controller.create);
router.delete('/:id', requirePermission('paiements.delete'), controller.delete);

module.exports = router;
