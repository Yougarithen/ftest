
// ========== inventaireProduitRoutes.js - SÉCURISÉ ==========
const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventaireProduitController');
const { authenticate, requirePermission } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', requirePermission('inventaires.read'), controller.getAll);
router.get('/:id', requirePermission('inventaires.read'), controller.getById);
router.get('/inventaire/:id_inventaire', requirePermission('inventaires.read'), controller.getByInventaire);
router.get('/inventaire/:id_inventaire/ecarts', requirePermission('inventaires.read'), controller.getEcartsSignificatifs);
router.post('/', requirePermission('inventaires.update'), controller.create);
router.put('/:id', requirePermission('inventaires.update'), controller.update);
router.delete('/:id', requirePermission('inventaires.update'), controller.delete);

module.exports = router;
