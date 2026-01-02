// Connexion simple à la base de données SQLite
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 🔧 CONFIGURATION DU CHEMIN DE LA BASE DE DONNÉES
function getDatabasePath() {
  // En production (Railway), utiliser le volume monté
  if (process.env.NODE_ENV === 'production') {
    return process.env.DATABASE_PATH || '/data/stock.db';
  }
  // En développement, utiliser le chemin local
  return process.env.DATABASE_PATH || './database/stock.db';
}

const DATABASE_PATH = getDatabasePath();
console.log(`📍 Chemin de la base de données : ${DATABASE_PATH}`);

// Créer le dossier database s'il n'existe pas
const dbDir = path.dirname(DATABASE_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`✅ Dossier créé : ${dbDir}`);
}

// Connexion à la base de données
let db;
try {
  db = new Database(DATABASE_PATH, { 
    verbose: process.env.NODE_ENV === 'development' ? console.log : null 
  });
  console.log('✅ Connexion à la base de données établie');
} catch (error) {
  console.error('❌ Erreur de connexion à la base de données:', error.message);
  throw error;
}

// Activer les clés étrangères (important pour SQLite)
db.pragma('foreign_keys = ON');

// Configuration optimale pour SQLite en production
if (process.env.NODE_ENV === 'production') {
  // Améliore les performances en production
  db.pragma('journal_mode = WAL'); // Write-Ahead Logging
  db.pragma('synchronous = NORMAL'); // Balance entre vitesse et sécurité
  db.pragma('cache_size = -64000'); // 64MB de cache
  db.pragma('temp_store = MEMORY'); // Utiliser la RAM pour les tables temporaires
  console.log('✅ Optimisations SQLite appliquées pour la production');
}

// Fonction pour initialiser la base de données avec le schéma
function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    // Si le fichier schema.sql existe, l'exécuter
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      db.exec(schema);
      console.log('✅ Base de données initialisée avec succès');
    } else {
      console.warn('⚠️  Fichier schema.sql introuvable');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error.message);
    throw error;
  }
}

// Initialiser la base au démarrage si elle est vide
try {
  const tableCount = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get();
  
  if (tableCount.count === 0) {
    console.log('📦 Création de la base de données...');
    initDatabase();
  } else {
    console.log(`✅ Base de données existante (${tableCount.count} tables trouvées)`);
  }
} catch (error) {
  console.error('❌ Erreur lors de la vérification de la base:', error.message);
}

// Fonction pour fermer proprement la connexion (utile pour les tests)
function closeDatabase() {
  if (db) {
    db.close();
    console.log('🔌 Connexion à la base de données fermée');
  }
}

// Gestion de l'arrêt propre de l'application
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});

module.exports = db;
module.exports.closeDatabase = closeDatabase;