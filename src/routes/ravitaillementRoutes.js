// ========== ravitaillementRoutes.js - SÉCURISÉ ==========
const express = require('express');
const router = express.Router();
const controller = require('../controllers/ravitaillementController');
const { authenticate, requirePermission } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// ⚠️ IMPORTANT: Routes spécifiques AVANT routes avec paramètres dynamiques

// GET - Statistiques globales
router.get('/stats', requirePermission('matieres.read'), controller.getStats);

// GET - Statistiques par matière
router.get('/stats/matieres', requirePermission('matieres.read'), controller.getStatsByMatiere);

// GET - Ravitaillements par période
router.get('/periode', requirePermission('matieres.read'), controller.getByPeriode);

// GET - Ravitaillements d'une matière spécifique
router.get('/matiere/:idMatiere', requirePermission('matieres.read'), controller.getByMatiere);

// GET - Liste tous les ravitaillements
router.get('/', requirePermission('matieres.read'), controller.getAll);

// GET - Détails d'un ravitaillement (DOIT être en dernier des GET)
router.get('/:id', requirePermission('matieres.read'), controller.getById);

// POST - Créer un nouveau ravitaillement
router.post('/', requirePermission('matieres.create'), controller.create);

// DELETE - Supprimer un ravitaillement (annule aussi le stock)
router.delete('/:id', requirePermission('matieres.delete'), controller.delete);

module.exports = router;