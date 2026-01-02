// src/routes/securityRoutes.js - Routes d'administration de la sécurité
const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { 
  getSecurityConfig, 
  updateSecurityConfig,
  journaliserActivite 
} = require('../middleware/securityMiddleware');

// Toutes les routes nécessitent authentification et rôle ADMIN
router.use(authenticate);
router.use(requireRole('ADMIN'));

// ============================================================
// CONFIGURATION DE SÉCURITÉ
// ============================================================

// GET /api/security/config - Obtenir la configuration de sécurité
router.get('/config', (req, res) => {
  try {
    const config = getSecurityConfig();
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/security/config - Mettre à jour la configuration
router.put('/config', (req, res) => {
  try {
    const updates = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    Object.entries(updates).forEach(([cle, valeur]) => {
      updateSecurityConfig(cle, valeur);
    });

    journaliserActivite(req.user.id, 'MODIFICATION_CONFIG_SECURITE', 'securite',
      `Configuration modifiée: ${JSON.stringify(updates)}`, ip);

    res.json({
      success: true,
      message: 'Configuration mise à jour avec succès',
      data: getSecurityConfig()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// JOURNAL D'AUDIT
// ============================================================

// GET /api/security/audit - Journal d'activité
router.get('/audit', (req, res) => {
  try {
    const { 
      limite = 100, 
      page = 1, 
      utilisateur, 
      action, 
      module,
      date_debut,
      date_fin 
    } = req.query;

    const offset = (page - 1) * limite;
    let whereConditions = [];
    let params = [];

    if (utilisateur) {
      whereConditions.push('id_utilisateur = ?');
      params.push(utilisateur);
    }
    if (action) {
      whereConditions.push('action = ?');
      params.push(action);
    }
    if (module) {
      whereConditions.push('module = ?');
      params.push(module);
    }
    if (date_debut) {
      whereConditions.push('date_action >= ?');
      params.push(date_debut);
    }
    if (date_fin) {
      whereConditions.push('date_action <= ?');
      params.push(date_fin);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Compter le total
    const total = db.prepare(`
      SELECT COUNT(*) as count FROM JournalActivite ${whereClause}
    `).get(...params);

    // Récupérer les logs avec les infos utilisateur
    const logs = db.prepare(`
      SELECT 
        j.*,
        u.nom_utilisateur,
        u.nom_complet
      FROM JournalActivite j
      LEFT JOIN Utilisateur u ON j.id_utilisateur = u.id_utilisateur
      ${whereClause}
      ORDER BY date_action DESC
      LIMIT ? OFFSET ?
    `).all(...params, limite, offset);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total: total.count,
          page: parseInt(page),
          limite: parseInt(limite),
          pages: Math.ceil(total.count / limite)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// TENTATIVES DE CONNEXION
// ============================================================

// GET /api/security/login-attempts - Tentatives de connexion
router.get('/login-attempts', (req, res) => {
  try {
    const { limite = 100, page = 1, succes, ip } = req.query;
    const offset = (page - 1) * limite;
    
    let whereConditions = [];
    let params = [];

    if (succes !== undefined) {
      whereConditions.push('succes = ?');
      params.push(succes === 'true' ? 1 : 0);
    }
    if (ip) {
      whereConditions.push('ip_address = ?');
      params.push(ip);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM TentativeConnexion ${whereClause}
    `).get(...params);

    const tentatives = db.prepare(`
      SELECT * FROM TentativeConnexion
      ${whereClause}
      ORDER BY date_tentative DESC
      LIMIT ? OFFSET ?
    `).all(...params, limite, offset);

    res.json({
      success: true,
      data: {
        tentatives,
        pagination: {
          total: total.count,
          page: parseInt(page),
          limite: parseInt(limite),
          pages: Math.ceil(total.count / limite)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GESTION DES SESSIONS
// ============================================================

// GET /api/security/active-sessions - Toutes les sessions actives
router.get('/active-sessions', (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT 
        s.*,
        u.nom_utilisateur,
        u.nom_complet,
        u.email,
        r.nom as role
      FROM SessionToken s
      JOIN Utilisateur u ON s.id_utilisateur = u.id_utilisateur
      JOIN Role r ON u.id_role = r.id_role
      WHERE s.actif = 1 AND s.date_expiration > datetime('now')
      ORDER BY s.date_creation DESC
    `).all();

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/security/sessions/:id - Révoquer n'importe quelle session (admin)
router.delete('/sessions/:id_session', (req, res) => {
  try {
    const { id_session } = req.params;
    const ip = req.ip || req.connection.remoteAddress;

    const session = db.prepare('SELECT * FROM SessionToken WHERE id_session = ?')
      .get(id_session);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session non trouvée'
      });
    }

    db.prepare(`
      UPDATE SessionToken
      SET actif = 0
      WHERE id_session = ?
    `).run(id_session);

    journaliserActivite(req.user.id, 'REVOCATION_SESSION_ADMIN', 'securite',
      `Session ${id_session} de l'utilisateur ${session.id_utilisateur} révoquée par admin`, ip);

    res.json({
      success: true,
      message: 'Session révoquée avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/security/revoke-all-sessions - Révoquer toutes les sessions
router.post('/revoke-all-sessions', (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    
    const result = db.prepare(`
      UPDATE SessionToken
      SET actif = 0
      WHERE actif = 1
    `).run();

    journaliserActivite(req.user.id, 'REVOCATION_TOUTES_SESSIONS', 'securite',
      `${result.changes} sessions révoquées par admin`, ip);

    res.json({
      success: true,
      message: `${result.changes} session(s) révoquée(s) avec succès`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// STATISTIQUES
// ============================================================

// GET /api/security/statistics - Statistiques de sécurité
router.get('/statistics', (req, res) => {
  try {
    const stats = {
      // Utilisateurs
      utilisateurs: {
        total: db.prepare('SELECT COUNT(*) as count FROM Utilisateur').get().count,
        actifs: db.prepare('SELECT COUNT(*) as count FROM Utilisateur WHERE actif = 1').get().count,
        desactives: db.prepare('SELECT COUNT(*) as count FROM Utilisateur WHERE actif = 0').get().count
      },
      
      // Connexions (24h)
      connexions_24h: {
        total: db.prepare(`
          SELECT COUNT(*) as count FROM TentativeConnexion
          WHERE date_tentative > datetime('now', '-24 hours')
        `).get().count,
        reussies: db.prepare(`
          SELECT COUNT(*) as count FROM TentativeConnexion
          WHERE date_tentative > datetime('now', '-24 hours') AND succes = 1
        `).get().count,
        echouees: db.prepare(`
          SELECT COUNT(*) as count FROM TentativeConnexion
          WHERE date_tentative > datetime('now', '-24 hours') AND succes = 0
        `).get().count
      },
      
      // Sessions
      sessions: {
        actives: db.prepare(`
          SELECT COUNT(*) as count FROM SessionToken
          WHERE actif = 1 AND date_expiration > datetime('now')
        `).get().count,
        utilisateurs_connectes: db.prepare(`
          SELECT COUNT(DISTINCT id_utilisateur) as count FROM SessionToken
          WHERE actif = 1 AND date_expiration > datetime('now')
        `).get().count
      },
      
      // IPs uniques (24h)
      ips_uniques_24h: db.prepare(`
        SELECT COUNT(DISTINCT ip_address) as count FROM TentativeConnexion
        WHERE date_tentative > datetime('now', '-24 hours')
      `).get().count,
      
      // Top 10 actions (7 jours)
      top_actions_7j: db.prepare(`
        SELECT action, COUNT(*) as count
        FROM JournalActivite
        WHERE date_action > datetime('now', '-7 days')
        GROUP BY action
        ORDER BY count DESC
        LIMIT 10
      `).all(),
      
      // Top utilisateurs actifs (7 jours)
      top_utilisateurs_7j: db.prepare(`
        SELECT 
          u.nom_utilisateur,
          u.nom_complet,
          COUNT(*) as nb_actions
        FROM JournalActivite j
        JOIN Utilisateur u ON j.id_utilisateur = u.id_utilisateur
        WHERE j.date_action > datetime('now', '-7 days')
        GROUP BY j.id_utilisateur
        ORDER BY nb_actions DESC
        LIMIT 10
      `).all(),
      
      // Alertes récentes
      alertes: {
        tentatives_echouees_recentes: db.prepare(`
          SELECT COUNT(*) as count FROM TentativeConnexion
          WHERE succes = 0 AND date_tentative > datetime('now', '-1 hour')
        `).get().count,
        ips_suspectes: db.prepare(`
          SELECT ip_address, COUNT(*) as tentatives
          FROM TentativeConnexion
          WHERE succes = 0 AND date_tentative > datetime('now', '-24 hours')
          GROUP BY ip_address
          HAVING tentatives >= 3
          ORDER BY tentatives DESC
        `).all()
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// NETTOYAGE
// ============================================================

// POST /api/security/cleanup - Nettoyer les données anciennes
router.post('/cleanup', (req, res) => {
  try {
    const { 
      tentatives_jours = 30, 
      journal_jours = 90,
      sessions_expirees = true
    } = req.body;
    
    const ip = req.ip || req.connection.remoteAddress;
    const resultats = {};

    // Nettoyer les tentatives de connexion
    if (tentatives_jours > 0) {
      const result = db.prepare(`
        DELETE FROM TentativeConnexion
        WHERE date_tentative < datetime('now', '-${tentatives_jours} days')
      `).run();
      resultats.tentatives_supprimees = result.changes;
    }

    // Nettoyer le journal d'activité
    if (journal_jours > 0) {
      const result = db.prepare(`
        DELETE FROM JournalActivite
        WHERE date_action < datetime('now', '-${journal_jours} days')
      `).run();
      resultats.logs_supprimes = result.changes;
    }

    // Nettoyer les sessions expirées
    if (sessions_expirees) {
      const result = db.prepare(`
        DELETE FROM SessionToken
        WHERE actif = 0 OR date_expiration < datetime('now')
      `).run();
      resultats.sessions_supprimees = result.changes;
    }

    journaliserActivite(req.user.id, 'NETTOYAGE_DONNEES', 'securite',
      JSON.stringify(resultats), ip);

    res.json({
      success: true,
      message: 'Nettoyage effectué avec succès',
      data: resultats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;