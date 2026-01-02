
// ========== ajustementStockRoutes.js - SÉCURISÉ ==========
const express = require('express');
const router = express.Router();
const controller = require('../controllers/ajustementStockController');
const { authenticate, requirePermission } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', requirePermission('inventaires.read'), controller.getAll);
router.get('/:id', requirePermission('inventaires.read'), controller.getById);
router.get('/article/:type_article/:id_article', requirePermission('inventaires.read'), controller.getByArticle);
router.get('/inventaire/:id_inventaire', requirePermission('inventaires.read'), controller.getByInventaire);

module.exports = router;
