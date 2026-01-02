// ========== routes/ligneFactureRoutes.js ==========
const express = require('express');
const router = express.Router();
const controller = require('../controllers/ligneFactureController');

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.get('/facture/:id_facture', controller.getByFacture);
router.get('/:id/totaux', controller.calculerTotaux);
router.post('/', controller.create);
router.post('/verifier-stock', controller.verifierStock);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
