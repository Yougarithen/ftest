const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CONFIGURATION CORS POUR AUTORISER LOCALHOST
const corsOptions = {
  origin: function (origin, callback) {
    // Liste des origines autorisées
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:5173'
    ];
    
    // Autoriser les requêtes sans origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origin est autorisée
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Origin non autorisée:', origin);
      callback(null, true); // Temporairement autoriser tous pendant le debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400
};

// ✅ Le middleware cors() gère automatiquement les OPTIONS
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

  // === DÉMARRAGE DU NETTOYAGE AUTOMATIQUE DES SESSIONS ===
  try {
    const { startAutomaticCleanup } = require('./src/utils/sessionCleanup');
    startAutomaticCleanup(60);
    console.log('✅ Nettoyage automatique des sessions activé (toutes les 60 minutes)');
  } catch (error) {
    console.warn('⚠️  Impossible de démarrer le nettoyage automatique:', error.message);
    console.warn('   Le fichier sessionCleanup.js est peut-être manquant.');
  }
});

module.exports = app;