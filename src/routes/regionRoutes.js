// Routes pour les régions des bons de livraison - SÉCURISÉ
const express = require('express');
const router = express.Router();
const controller = require('../controllers/regionController');
const { authenticate, requirePermission } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// Routes pour les statistiques et les bons sans région (avant les routes avec :id)
router.get('/statistiques', 
    requirePermission('regions.read'), 
    controller.getStatistiques
);

router.get('/bons-sans-region', 
    requirePermission('regions.read'), 
    controller.getBonsLivraisonSansRegion
);

// Routes de recherche par nom de région ou chauffeur
router.get('/par-nom/:nomRegion', 
    requirePermission('regions.read'), 
    controller.getByNomRegion
);

router.get('/par-chauffeur/:nomChauffeur', 
    requirePermission('regions.read'), 
    controller.getByChauffeur
);

// Route pour récupérer une région par ID de bon de livraison
router.get('/bon-livraison/:idBonLivraison', 
    requirePermission('regions.read'), 
    controller.getByBonLivraison
);

// Routes CRUD de base
router.get('/', 
    requirePermission('regions.read'), 
    controller.getAll
);

router.get('/:id', 
    requirePermission('regions.read'), 
    controller.getById
);

router.post('/', 
    requirePermission('regions.create'), 
    controller.create
);

router.put('/:id', 
    requirePermission('regions.update'), 
    controller.update
);

router.delete('/:id', 
    requirePermission('regions.delete'), 
    controller.delete
);

module.exports = router;
