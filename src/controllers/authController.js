// src/controllers/authController.js - PostgreSQL
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const pool = require('../database/connection');

class AuthController {
  // =========================
  // INSCRIPTION
  // =========================
  static async register(req, res) {
    try {
      const { nom_utilisateur, email, mot_de_passe, nom_complet, id_role } = req.body;

      if (!nom_utilisateur || !email || !mot_de_passe || !nom_complet) {
        return res.status(400).json({
          success: false,
          error: 'Tous les champs sont requis'
        });
      }

      if (mot_de_passe.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Le mot de passe doit contenir au moins 6 caractères'
        });
      }

      const user = await UserModel.create({
        nom_utilisateur,
        email,
        mot_de_passe,
        nom_complet,
        id_role: id_role || 5 // LECTEUR par défaut
      });

      delete user.mot_de_passe_hash;

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // =========================
  // CONNEXION
  // =========================
  static async login(req, res) {
    try {
      const { identifiant, mot_de_passe } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || 'Unknown';

      if (!identifiant || !mot_de_passe) {
        return res.status(400).json({
          success: false,
          error: 'Identifiant et mot de passe requis'
        });
      }

      // Chercher l'utilisateur
      let user = await UserModel.findByEmail(identifiant);
      if (!user) {
        user = await UserModel.findByUsername(identifiant);
      }

      if (!user) {
        // Enregistrer la tentative échouée
        await pool.query(`
          INSERT INTO TentativeConnexion (identifiant, ip_address, user_agent, succes, raison)
          VALUES ($1, $2, $3, FALSE, 'Utilisateur non trouvé')
        `, [identifiant, ip, userAgent]);

        return res.status(401).json({
          success: false,
          error: 'Identifiants invalides'
        });
      }

      if (!user.actif) {
        return res.status(403).json({
          success: false,
          error: 'Compte désactivé'
        });
      }

      // Vérifier le mot de passe
      const isPasswordValid = await UserModel.verifyPassword(
        mot_de_passe,
        user.mot_de_passe_hash
      );

      if (!isPasswordValid) {
        // Enregistrer la tentative échouée
        await pool.query(`
          INSERT INTO TentativeConnexion (identifiant, ip_address, user_agent, succes, raison, id_utilisateur)
          VALUES ($1, $2, $3, FALSE, 'Mot de passe incorrect', $4)
        `, [identifiant, ip, userAgent, user.id_utilisateur]);

        return res.status(401).json({
          success: false,
          error: 'Identifiants invalides'
        });
      }

      // === GESTION SESSION UNIQUE ===
      // Désactiver toutes les sessions actives de cet utilisateur
      await pool.query(`
        UPDATE SessionToken
        SET actif = 0
        WHERE id_utilisateur = $1 AND actif = 1
      `, [user.id_utilisateur]);

      // Mettre à jour la dernière connexion
      await UserModel.updateLastLogin(user.id_utilisateur);
      const permissions = await UserModel.getPermissions(user.id_utilisateur);

      // Durée de session (par défaut 8h)
      const sessionDuration = process.env.JWT_EXPIRES_IN || '8h';
      
      // Créer le token JWT
      const token = jwt.sign(
        {
          id: user.id_utilisateur,
          nom_utilisateur: user.nom_utilisateur,
          email: user.email,
          role: user.role,
          permissions
        },
        process.env.JWT_SECRET,
        { expiresIn: sessionDuration }
      );

      // Calculer la date d'expiration
      const expirationMs = AuthController._parseJWTExpiration(sessionDuration);
      const expirationDate = new Date(Date.now() + expirationMs);

      // Enregistrer la session dans la base de données
      const sessionResult = await pool.query(`
        INSERT INTO SessionToken (
          id_utilisateur, 
          token_hash, 
          ip_address, 
          user_agent, 
          date_expiration
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id_session
      `, [
        user.id_utilisateur,
        token,
        ip,
        userAgent,
        expirationDate.toISOString()
      ]);

      // Enregistrer la tentative réussie
      await pool.query(`
        INSERT INTO TentativeConnexion (
          identifiant, 
          ip_address, 
          user_agent,
          succes, 
          id_utilisateur
        ) VALUES ($1, $2, $3, TRUE, $4)
      `, [identifiant, ip, userAgent, user.id_utilisateur]);

      delete user.mot_de_passe_hash;

      res.json({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: {
            ...user,
            permissions
          },
          token,
          sessionId: sessionResult.rows[0].id_session,
          expiresAt: expirationDate.toISOString()
        }
      });
    } catch (error) {
      console.error('Erreur login:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Helper pour parser la durée JWT
  static _parseJWTExpiration(duration) {
    const matches = duration.match(/^(\d+)([smhd])$/);
    if (!matches) return 8 * 60 * 60 * 1000; // 8h par défaut

    const value = parseInt(matches[1]);
    const unit = matches[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 8 * 60 * 60 * 1000;
    }
  }

  // =========================
  // PROFIL UTILISATEUR
  // =========================
  static async getProfile(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }

      const permissions = await UserModel.getPermissions(user.id_utilisateur);

      res.json({
        success: true,
        data: {
          ...user,
          permissions
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // =========================
  // CHANGEMENT MOT DE PASSE
  // =========================
  static async changePassword(req, res) {
    try {
      const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;

      if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
        return res.status(400).json({
          success: false,
          error: 'Ancien et nouveau mot de passe requis'
        });
      }

      if (nouveau_mot_de_passe.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Le mot de passe doit contenir au moins 6 caractères'
        });
      }

      const user = await UserModel.findByEmail(req.user.email);

      const isPasswordValid = await UserModel.verifyPassword(
        ancien_mot_de_passe,
        user.mot_de_passe_hash
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Ancien mot de passe incorrect'
        });
      }

      await UserModel.changePassword(req.user.id, nouveau_mot_de_passe);

      // Déconnecter toutes les autres sessions
      await pool.query(`
        UPDATE SessionToken
        SET actif = 0
        WHERE id_utilisateur = $1 AND token_hash != $2
      `, [req.user.id, req.token]);

      res.json({
        success: true,
        message: 'Mot de passe modifié avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // =========================
  // VÉRIFICATION TOKEN
  // =========================
  static verifyToken(req, res) {
    res.json({
      success: true,
      message: 'Token valide',
      data: {
        user: req.user,
        session: req.session
      }
    });
  }

  // =========================
  // DÉCONNEXION
  // =========================
  static async logout(req, res) {
    try {
      // Désactiver la session actuelle
      if (req.session && req.session.id_session) {
        await pool.query(`
          UPDATE SessionToken
          SET actif = 0
          WHERE id_session = $1
        `, [req.session.id_session]);
      }

      res.json({
        success: true,
        message: 'Déconnexion réussie'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // =========================
  // HISTORIQUE DES CONNEXIONS
  // =========================
  static async getLoginHistory(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          date_tentative,
          ip_address,
          succes,
          raison
        FROM TentativeConnexion
        WHERE id_utilisateur = $1
        ORDER BY date_tentative DESC
        LIMIT 50
      `, [req.user.id]);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // =========================
  // SESSIONS ACTIVES
  // =========================
  static async getActiveSessions(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          id_session,
          ip_address,
          user_agent,
          date_creation,
          date_expiration,
          date_derniere_activite
        FROM SessionToken
        WHERE id_utilisateur = $1
        AND actif = 1 
        AND date_expiration > NOW()
        ORDER BY date_creation DESC
      `, [req.user.id]);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // =========================
  // RÉVOCATION DE SESSION
  // =========================
  static async revokeSession(req, res) {
    try {
      const { id_session } = req.params;

      // Vérifier que la session appartient à l'utilisateur
      const result = await pool.query(`
        SELECT * FROM SessionToken 
        WHERE id_session = $1 AND id_utilisateur = $2
      `, [id_session, req.user.id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Session non trouvée'
        });
      }

      await pool.query(`
        UPDATE SessionToken
        SET actif = 0
        WHERE id_session = $1
      `, [id_session]);

      res.json({
        success: true,
        message: 'Session révoquée'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = AuthController;
