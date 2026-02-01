// src/routes/index.js - Fichier principal des routes - VERSION SÉCURISÉE
const express = require('express');
const router = express.Router();
const { auditMiddleware } = require('../middleware/securityMiddleware');

// Importer toutes les routes
const matierePremiereRoutes = require('./matierePremiereRoutes');
const produitRoutes = require('./produitRoutes');
const clientRoutes = require('./clientRoutes');
const devisRoutes = require('./devisRoutes');
const factureRoutes = require('./factureRoutes');
const paiementRoutes = require('./paiementRoutes');
const inventaireRoutes = require('./inventaireRoutes');
const productionRoutes = require('./productionRoutes');
const ajustementStockRoutes = require('./ajustementStockRoutes');
const recetteProductionRoutes = require('./recetteProductionRoutes');
const ligneDevisRoutes = require('./ligneDevisRoutes');
const ligneFactureRoutes = require('./ligneFactureRoutes');
const inventaireMatiereRoutes = require('./inventaireMatiereRoutes');
const inventaireProduitRoutes = require('./inventaireProduitRoutes');
const ravitaillementRoutes = require('./ravitaillementRoutes');

const regionRoutes = require('./regionRoutes');

// Importer les routes d'authentification et de sécurité
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const securityRoutes = require('./securityRoutes');

// ============================================================
// ROUTES PUBLIQUES (authentification)
// ============================================================
router.use('/auth', authRoutes);

// ============================================================
// ROUTES DE SÉCURITÉ (admin uniquement)
// ============================================================
router.use('/security', securityRoutes);

// ============================================================
// ROUTES PROTÉGÉES (toutes nécessitent authentification)
// ============================================================

// Gestion des utilisateurs
router.use('/users', userRoutes);

// Matières premières (avec audit sur créations/modifications/suppressions)
router.use('/matieres', matierePremiereRoutes);

// Produits
router.use('/produits', produitRoutes);

// Clients
router.use('/clients', clientRoutes);

// Devis
router.use('/devis', devisRoutes);

// Factures (audit logging important)
router.use('/factures', factureRoutes);

// Paiements (audit logging critique)
router.use('/paiements', paiementRoutes);

router.use('/regions', regionRoutes);

// Production
router.use('/production', productionRoutes);

// Inventaires
router.use('/inventaires', inventaireRoutes);

// Ajustements de stock
router.use('/ajustements', ajustementStockRoutes);

// Recettes de production
router.use('/recettes', recetteProductionRoutes);

// Lignes de devis
router.use('/lignes-devis', ligneDevisRoutes);

// Lignes de facture
router.use('/lignes-facture', ligneFactureRoutes);

// Inventaire matières
router.use('/inventaire-matieres', inventaireMatiereRoutes);

// Inventaire produits
router.use('/inventaire-produits', inventaireProduitRoutes);

// Ravitaillements
router.use('/ravitaillements', ravitaillementRoutes);
// ============================================================
// ROUTE DE DOCUMENTATION
// ============================================================

router.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API ERP Gestion de Stock - Sécurisée',
    version: '2.0.0',
    security: '🔒 Authentification JWT + Permissions',
    endpoints: {
      // Authentification
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout (protected)',
        profile: 'GET /api/auth/profile (protected)',
        changePassword: 'POST /api/auth/change-password (protected)',
        verify: 'GET /api/auth/verify (protected)',
        loginHistory: 'GET /api/auth/login-history (protected)',
        sessions: 'GET /api/auth/sessions (protected)'
      },
      
      // Gestion des utilisateurs
      users: {
        list: 'GET /api/users (protected - users.read)',
        get: 'GET /api/users/:id (protected - users.read)',
        create: 'POST /api/users (protected - users.create)',
        update: 'PUT /api/users/:id (protected - users.update)',
        delete: 'DELETE /api/users/:id (protected - users.delete)',
        permissions: 'GET /api/users/:id/permissions (protected - users.read)'
      },
      
      // Sécurité (admin uniquement)
      security: {
        config: 'GET/PUT /api/security/config (admin)',
        audit: 'GET /api/security/audit (admin)',
        loginAttempts: 'GET /api/security/login-attempts (admin)',
        activeSessions: 'GET /api/security/active-sessions (admin)',
        statistics: 'GET /api/security/statistics (admin)'
      },
      
      // Modules métier
      matieres: 'GET /api/matieres (protected - matieres.read)',
      produits: 'GET /api/produits (protected - produits.read)',
      clients: 'GET /api/clients (protected - clients.read)',
      devis: 'GET /api/devis (protected - devis.read)',
      factures: 'GET /api/factures (protected - factures.read)',
      paiements: 'GET /api/paiements (protected - paiements.read)',
      inventaires: 'GET /api/inventaires (protected - inventaires.read)',
      production: 'GET /api/production (protected - production.read)',
      ajustements: 'GET /api/ajustements (protected - inventaires.read)',
      recettes: 'GET /api/recettes (protected - production.read)',
      lignesDevis: 'GET /api/lignes-devis (protected - devis.read)',
      lignesFacture: 'GET /api/lignes-facture (protected - factures.read)',
      inventaireMatieres: 'GET /api/inventaire-matieres (protected - inventaires.read)',
      inventaireProduits: 'GET /api/inventaire-produits (protected - inventaires.read)'
    },
    
    permissions: {
      description: 'Système de permissions granulaire par module',
      modules: [
        'users (create, read, update, delete)',
        'clients (create, read, update, delete)',
        'produits (create, read, update, delete)',
        'matieres (create, read, update, delete)',
        'devis (create, read, update, delete, validate)',
        'factures (create, read, update, delete, validate)',
        'paiements (create, read, delete)',
        'production (create, read, delete)',
        'inventaires (create, read, update, validate)',
        'rapports (view, export)',
        'settings (read, update)'
      ]
    },
    
    roles: {
      ADMIN: 'Toutes les permissions',
      GESTIONNAIRE: 'Toutes sauf users/settings',
      VENDEUR: 'Clients, devis, factures, paiements',
      MAGASINIER: 'Stock, production, inventaires',
      LECTEUR: 'Lecture seule'
    },
    
    security: {
      authentication: 'JWT Bearer Token',
      rateLimit: '5 tentatives max avant blocage',
      sessionTracking: 'Sessions tracées et révocables',
      auditLog: 'Journal complet des activités',
      passwordPolicy: 'Validation forte des mots de passe'
    }
  });
});

module.exports = router;