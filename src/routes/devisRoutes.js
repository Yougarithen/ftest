
// ========== devisRoutes.js - SÉCURISÉ ==========
const express = require('express');
const router = express.Router();
const controller = require('../controllers/devisController');
const { authenticate, requirePermission } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', requirePermission('devis.read'), controller.getAll);
router.get('/:id', requirePermission('devis.read'), controller.getById);
router.post('/', requirePermission('devis.create'), controller.create);
router.put('/:id', requirePermission('devis.update'), controller.update);
router.delete('/:id', requirePermission('devis.delete'), controller.delete);
router.post('/:id/lignes', requirePermission('devis.update'), controller.ajouterLigne);
router.post('/:id/convertir', requirePermission('devis.validate', 'factures.create'), controller.convertirEnFacture);
router.post('/:id/valider', devisController.validerDevis);
module.exports = router;
