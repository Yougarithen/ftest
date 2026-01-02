
// ========== clientRoutes.js - SÉCURISÉ ==========
const express = require('express');
const router = express.Router();
const controller = require('../controllers/clientController');
const { authenticate, requirePermission } = require('../middleware/authMiddleware');

router.use(authenticate);

// IMPORTANT: Les routes spécifiques doivent être avant les routes avec paramètres
router.get('/types', requirePermission('clients.read'), controller.getTypes);
router.get('/', requirePermission('clients.read'), controller.getAll);
router.get('/:id', requirePermission('clients.read'), controller.getById);
router.post('/', requirePermission('clients.create'), controller.create);
router.put('/:id', requirePermission('clients.update'), controller.update);
router.delete('/:id', requirePermission('clients.delete'), controller.delete);
router.get('/:id/credits', requirePermission('clients.read'), controller.getCredits);

module.exports = router;
