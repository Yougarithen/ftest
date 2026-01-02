// Connexion simple à la base de données SQLite
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Créer le dossier database s'il n'existe pas
const dbDir = path.dirname(process.env.DATABASE_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connexion à la base de données
const db = new Database(process.env.DATABASE_PATH, { 
  verbose: process.env.NODE_ENV === 'development' ? console.log : null 
});

// Activer les clés étrangères (important pour SQLite)
db.pragma('foreign_keys = ON');

// Fonction pour initialiser la base de données avec le schéma
function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    // Si le fichier schema.sql existe, l'exécuter
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      db.exec(schema);
      console.log('✅ Base de données initialisée avec succès');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error.message);
  }
}

// Initialiser la base au démarrage si elle est vide
const tableCount = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get();
if (tableCount.count === 0) {
  console.log('📦 Création de la base de données...');
  initDatabase();
}

module.exports = db;