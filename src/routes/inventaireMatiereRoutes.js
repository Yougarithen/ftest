// ========== routes/inventaireMatiereRoutes.js ==========
const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventaireMatiereController');

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.get('/inventaire/:id_inventaire', controller.getByInventaire);
router.get('/inventaire/:id_inventaire/ecarts', controller.getEcartsSignificatifs);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
