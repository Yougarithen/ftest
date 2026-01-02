// ========== authRoutes.js - VERSION SIMPLIFIÉE POUR DEBUG ==========
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// Middleware de sécurité temporairement désactivés pour debug
// Réactive-les une fois que l'authentification fonctionne

// ============================================================
// ROUTES PUBLIQUES
// ============================================================

router.post('/register', 
  AuthController.register
);

router.post('/login', 
  AuthController.login
);

// ============================================================
// ROUTES PROTÉGÉES (nécessitent authentification)
// ============================================================

router.get('/profile', 
  authenticate,
  AuthController.getProfile
);

router.post('/change-password', 
  authenticate,
  AuthController.changePassword
);

router.get('/verify', 
  authenticate,
  AuthController.verifyToken
);

router.post('/logout',
  authenticate,
  AuthController.logout
);

// Historique des connexions de l'utilisateur
router.get('/login-history',
  authenticate,
  AuthController.getLoginHistory
);

// Gestion des sessions actives
router.get('/sessions',
  authenticate,
  AuthController.getActiveSessions
);

router.delete('/sessions/:id_session',
  authenticate,
  AuthController.revokeSession
);

module.exports = router;