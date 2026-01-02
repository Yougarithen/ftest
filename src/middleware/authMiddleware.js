// src/middleware/authMiddleware.js - PostgreSQL
const jwt = require('jsonwebtoken');
const pool = require('../database/connection');

/**
 * Middleware d'authentification avec vérification de session en base de données
 */
const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification manquant'
      });
    }

    const token = authHeader.substring(7); // Enlever 'Bearer '

    // Vérifier et décoder le token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Session expirée',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Token invalide'
      });
    }

    // Vérifier la session dans la base de données
    const result = await pool.query(`
      SELECT 
        s.*,
        u.actif as user_actif
      FROM SessionToken s
      JOIN Utilisateur u ON s.id_utilisateur = u.id_utilisateur
      WHERE s.token_hash = $1
      AND s.actif = 1
    `, [token]);

    const session = result.rows[0];

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Session invalide ou révoquée',
        code: 'SESSION_REVOKED'
      });
    }

    // Vérifier si l'utilisateur est toujours actif
    if (!session.user_actif) {
      return res.status(403).json({
        success: false,
        error: 'Compte désactivé'
      });
    }

    // Vérifier l'expiration de la session
    const now = new Date();
    const expirationDate = new Date(session.date_expiration);
    
    if (now > expirationDate) {
      // Désactiver la session expirée
      await pool.query(`
        UPDATE SessionToken
        SET actif = 0
        WHERE id_session = $1
      `, [session.id_session]);

      return res.status(401).json({
        success: false,
        error: 'Session expirée',
        code: 'SESSION_EXPIRED'
      });
    }

    // Mettre à jour la dernière activité
    await pool.query(`
      UPDATE SessionToken
      SET date_derniere_activite = NOW()
      WHERE id_session = $1
    `, [session.id_session]);

    // Ajouter les infos utilisateur et session à la requête
    req.user = decoded;
    req.session = session;
    req.token = token;

    next();
  } catch (error) {
    console.error('Erreur authentification:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur d\'authentification'
    });
  }
};

/**
 * Middleware pour vérifier un rôle spécifique
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Permissions insuffisantes'
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier une permission spécifique
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise'
      });
    }

    // Les admins ont toutes les permissions
    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: `Permission requise: ${permission}`
      });
    }

    next();
  };
};

/**
 * Middleware optionnel - ne bloque pas si non authentifié
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue sans authentification
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Vérifier la session
      const result = await pool.query(`
        SELECT * FROM SessionToken 
        WHERE token_hash = $1
        AND actif = 1
        AND date_expiration > NOW()
      `, [token]);

      const session = result.rows[0];

      if (session) {
        req.user = decoded;
        req.session = session;
        req.token = token;
      }
    } catch (error) {
      // Token invalide, on continue sans authentification
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  requireRole,
  requirePermission,
  optionalAuth
};
