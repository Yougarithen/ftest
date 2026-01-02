// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const UserModel = require('../models/userModel');
const { authenticate, requirePermission } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// GET /api/users - Liste tous les utilisateurs
router.get('/', requirePermission('users.read'), (req, res) => {
  try {
    const users = UserModel.getAll();
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/users/:id - Obtenir un utilisateur
router.get('/:id', requirePermission('users.read'), (req, res) => {
  try {
    const user = UserModel.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const permissions = UserModel.getPermissions(user.id_utilisateur);

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
});

// POST /api/users - Créer un utilisateur (admin uniquement)
router.post('/', requirePermission('users.create'), async (req, res) => {
  try {
    const { nom_utilisateur, email, mot_de_passe, nom_complet, id_role } = req.body;

    if (!nom_utilisateur || !email || !mot_de_passe || !nom_complet) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis'
      });
    }

    const user = await UserModel.create({
      nom_utilisateur,
      email,
      mot_de_passe,
      nom_complet,
      id_role: id_role || 5
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
});

// PUT /api/users/:id - Modifier un utilisateur
router.put('/:id', requirePermission('users.update'), (req, res) => {
  try {
    const { nom_complet, email, id_role, actif } = req.body;
    
    const user = UserModel.update(req.params.id, {
      nom_complet,
      email,
      id_role,
      actif
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Utilisateur modifié avec succès',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete('/:id', requirePermission('users.delete'), (req, res) => {
  try {
    // Empêcher de se supprimer soi-même
    if (req.user.id === parseInt(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    const result = UserModel.delete(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/users/:id/permissions - Obtenir les permissions d'un utilisateur
router.get('/:id/permissions', requirePermission('users.read'), (req, res) => {
  try {
    const permissions = UserModel.getPermissions(req.params.id);
    
    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;