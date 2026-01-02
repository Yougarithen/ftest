const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CONFIGURATION CORS POUR AUTORISER LOCALHOST
const corsOptions = {
  origin: function (origin, callback) {
    // Liste des origines autorisées
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : [];
    
    // Autoriser les requêtes sans origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origin est autorisée
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true, // Permet l'envoi de cookies/tokens
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ... reste du code
// Logger simple pour le développement
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes principales
const routes = require('./src/routes/index');
app.use('/api', routes);

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API de gestion de stock',
    status: 'running',
    version: '1.0.0',
    documentation: '/api',
    features: {
      authentication: 'JWT avec sessions en base de données',
      sessionManagement: 'Session unique + expiration automatique',
      autoCleanup: 'Nettoyage automatique des sessions expirées'
    }
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur:', err.message);
  res.status(500).json({
    success: false,
    error: err.message || 'Erreur serveur'
  });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 Serveur démarré avec succès      ║
║                                        ║
║   📡 Port: ${PORT}                       ║
║   🌍 Environnement: ${process.env.NODE_ENV || 'development'}  ║
╚════════════════════════════════════════╝
  `);
  // ... reste du code


  // === DÉMARRAGE DU NETTOYAGE AUTOMATIQUE DES SESSIONS ===
  try {
    const { startAutomaticCleanup } = require('./src/utils/sessionCleanup');
    
    // Nettoyer les sessions expirées toutes les 60 minutes
    startAutomaticCleanup(60);
    
    console.log('✅ Nettoyage automatique des sessions activé (toutes les 60 minutes)');
  } catch (error) {
    console.warn('⚠️  Impossible de démarrer le nettoyage automatique:', error.message);
    console.warn('   Le fichier sessionCleanup.js est peut-être manquant.');
  }
});

module.exports = app;