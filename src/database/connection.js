// Connexion PostgreSQL pour Railway
const { Pool } = require('pg');
require('dotenv').config();

// 🔧 CONFIGURATION PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  // Configuration optimale
  max: 20, // Maximum de connexions dans le pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test de connexion
pool.on('connect', () => {
  console.log('✅ Connexion PostgreSQL établie');
});

pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL inattendue:', err);
});

// Fonction pour tester la connexion
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Base de données PostgreSQL connectée:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à PostgreSQL:', error.message);
    throw error;
  }
}

// Fonction pour fermer proprement la connexion
async function closeDatabase() {
  try {
    await pool.end();
    console.log('🔌 Pool PostgreSQL fermé');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture:', error.message);
  }
}

// Gestion de l'arrêt propre de l'application
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});

// Tester la connexion au démarrage
if (process.env.DATABASE_URL) {
  testConnection().catch(err => {
    console.error('⚠️ Impossible de se connecter à la base de données');
  });
} else {
  console.warn('⚠️ DATABASE_URL non défini - configuration PostgreSQL manquante');
}

module.exports = pool;
module.exports.closeDatabase = closeDatabase;
