
// ========== factureRoutes.js - SÉCURISÉ ==========
const express = require('express');
const router = express.Router();
const controller = require('../controllers/factureController');
const { authenticate, requirePermission } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', requirePermission('factures.read'), controller.getAll);
router.get('/credit', requirePermission('factures.read'), controller.getFacturesCredit);
router.get('/client/:id_client/bons-non-factures',
    requirePermission('factures.read'),
    controller.getBonsLivraisonNonFactures
);

router.post('/depuis-bons',
    requirePermission('factures.create'),
    controller.creerFactureDepuisBons
);

router.get('/:id/bons-livraison',
    requirePermission('factures.read'),
    controller.getBonsLivraisonDeFacture
);
router.get('/:id', requirePermission('factures.read'), controller.getById);
router.post('/', requirePermission('factures.create'), controller.create);
router.put('/:id', requirePermission('factures.update'), controller.update);
router.delete('/:id', requirePermission('factures.delete'), controller.delete);
router.post('/:id/lignes', requirePermission('factures.update'), controller.ajouterLigne);
router.post('/:id/valider', requirePermission('factures.validate'), controller.valider);

module.exports = router;
