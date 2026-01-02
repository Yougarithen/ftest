
// ========== authRoutes.js - VERSION COMPLÈTE SÉCURISÉE ==========
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { rateLimitMiddleware, auditMiddleware } = require('../middleware/securityMiddleware');

// ============================================================
// ROUTES PUBLIQUES (avec rate limiting)
// ============================================================

router.post('/register', 
  rateLimitMiddleware,
  auditMiddleware('INSCRIPTION', 'authentification'),
  AuthController.register
);

router.post('/login', 
  rateLimitMiddleware,
  auditMiddleware('TENTATIVE_CONNEXION', 'authentification'),
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
  auditMiddleware('CHANGEMENT_MOT_DE_PASSE', 'securite'),
  AuthController.changePassword
);

router.get('/verify', 
  authenticate,
  AuthController.verifyToken
);

router.post('/logout',
  authenticate,
  auditMiddleware('DECONNEXION', 'authentification'),
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
  auditMiddleware('REVOCATION_SESSION', 'securite'),
  AuthController.revokeSession
);
console.log({
  rateLimitMiddleware,
  auditMiddleware,
  authenticate,
  AuthController
});
module.exports = router;