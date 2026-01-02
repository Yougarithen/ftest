
// ========== inventaireRoutes.js - SÉCURISÉ ==========
const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventaireController');
const { authenticate, requirePermission } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', requirePermission('inventaires.read'), controller.getAll);
router.get('/:id', requirePermission('inventaires.read'), controller.getById);
router.post('/', requirePermission('inventaires.create'), controller.create);
router.put('/:id', requirePermission('inventaires.update'), controller.update);
router.delete('/:id', requirePermission('inventaires.delete'), controller.delete);
router.post('/:id/matieres', requirePermission('inventaires.update'), controller.ajouterLigneMatiere);
router.post('/:id/produits', requirePermission('inventaires.update'), controller.ajouterLigneProduit);
router.post('/:id/cloturer', requirePermission('inventaires.validate'), controller.cloturer);

module.exports = router;
