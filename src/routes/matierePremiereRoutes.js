// ========== matierePremiereRoutes.js - SÉCURISÉ ==========
const express = require('express');
const router = express.Router();
const controller = require('../controllers/matierePremiereController');
const { authenticate, requirePermission } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

router.get('/', requirePermission('matieres.read'), controller.getAll);
router.get('/alertes', requirePermission('matieres.read'), controller.getAlertes);
router.get('/:id', requirePermission('matieres.read'), controller.getById);
router.post('/', requirePermission('matieres.create'), controller.create);
router.put('/:id', requirePermission('matieres.update'), controller.update);
router.delete('/:id', requirePermission('matieres.delete'), controller.delete);
router.post('/:id/ajuster', requirePermission('matieres.update'), controller.ajusterStock);
router.get('/:id/historique', requirePermission('matieres.read'), controller.getHistoriqueAjustements); // 👈 NOUVEAU

module.exports = router;