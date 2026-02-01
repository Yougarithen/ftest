const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// CONFIGURATION CORS ULTRA-SIMPLE ET FONCTIONNELLE
// ============================================================
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Liste des origines autorisées depuis ENV ou valeurs par défaut
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'];
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 CORS Check');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Origin:', origin || 'AUCUNE');
  console.log('Origins autorisées:', allowedOrigins);
  
  // Si l'origin est dans la liste OU pas d'origin (Postman), autoriser
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    console.log('✅ CORS AUTORISÉ');
  } else {
    // Même si non autorisée, on accepte quand même (pour debug)
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    console.log('⚠️  Origin non dans la liste mais autorisée quand même (debug)');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Répondre immédiatement aux OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('✅ Réponse OPTIONS 204 envoyée');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return res.status(204).end();
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  next();
});

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
╔═══════════════════════════════════════╗
║   🚀 Serveur démarré avec succès      ║
║                                        ║
║   📡 Port: ${PORT}                       ║
║   🌐 Environnement: ${process.env.NODE_ENV || 'development'}  ║
║   🔓 CORS: ${process.env.ALLOWED_ORIGINS ? 'Configuré' : 'Par défaut'}          ║
╚═══════════════════════════════════════╝
  `);

  // === DÉMARRAGE DU NETTOYAGE AUTOMATIQUE DES SESSIONS ===
  try {
    const { startAutomaticCleanup } = require('./src/utils/sessionCleanup');
    startAutomaticCleanup(60);
    console.log('✅ Nettoyage automatique des sessions activé (toutes les 60 minutes)');
  } catch (error) {
    console.warn('⚠️  Impossible de démarrer le nettoyage automatique:', error.message);
  }
});

module.exports = app;