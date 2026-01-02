const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CONFIGURATION CORS POUR AUTORISER LOCALHOST
// ✅ CONFIGURATION CORS AMÉLIORÉE
// ✅ CONFIGURATION CORS - Utilise la variable d'environnement
const corsOptions = {
  origin: function (origin, callback) {
    // Récupérer les origines depuis la variable d'environnement
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [
          'http://localhost:8080',
          'http://localhost:5173',
          'http://localhost:5174',
          'http://127.0.0.1:8080',
          'http://127.0.0.1:5173'
        ];
    
    console.log('🔍 CORS - Origin reçue:', origin);
    console.log('🔍 CORS - Origins autorisées:', allowedOrigins);
    
    // Autoriser les requêtes sans origin (Postman, curl, etc.)
    if (!origin) {
      console.log('✅ CORS - Pas d\'origin (Postman/curl) → Autorisé');
      return callback(null, true);
    }
    
    // Vérifier si l'origin est autorisée
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS - Origin autorisée:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS - Origin NON autorisée:', origin);
      // En production, rejeter. En dev, autoriser pour debug
      callback(null, process.env.NODE_ENV !== 'production');
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// ✅ Le middleware cors() gère automatiquement les OPTIONS
app.use(cors(corsOptions));

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