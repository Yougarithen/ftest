// Point d'entrée de l'application
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globaux
app.use(cors()); // Permet les requêtes cross-origin
app.use(express.json()); // Parse le JSON dans les requêtes
app.use(express.urlencoded({ extended: true })); // Parse les données de formulaire

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
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 Serveur démarré avec succès      ║
║                                        ║
║   📡 Port: ${PORT}                       ║
║   🌍 URL: http://localhost:${PORT}      ║
║   📚 API: http://localhost:${PORT}/api  ║
╚════════════════════════════════════════╝
  `);

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