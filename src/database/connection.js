// Connexion PostgreSQL pour Railway
const { Pool } = require('pg');
require('dotenv').config();

// 🔧 CONFIGURATION PostgreSQL
// Support de DATABASE_URL (standard) et DATABASE_PATH (Railway)
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PATH;

if (!databaseUrl) {
  console.error('❌ ERREUR CRITIQUE : Aucune variable de connexion DB trouvée !');
  console.error('   Variables cherchées : DATABASE_URL ou DATABASE_PATH');
  console.error('   Configurez l\'une de ces variables dans Railway Dashboard → Variables');
}

const pool = new Pool({
  connectionString: databaseUrl,
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
  console.log('✅ Connexion PostgreSQL établie avec succès');
});

pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL inattendue:', err.message);
});

// Fonction pour tester la connexion
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Base de données PostgreSQL connectée:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à PostgreSQL:', error.message);
    console.error('   Vérifiez que la base de données est bien démarrée dans Railway');
    return false;
  }
}

// Fonction pour fermer proprement la connexion
async function closeDatabase() {
  try {
    await pool.end();
    console.log('🔌 Pool PostgreSQL fermé proprement');
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
if (databaseUrl) {
  console.log('🔍 Variable de connexion DB trouvée, test de connexion...');
  testConnection().catch(err => {
    console.error('⚠️ La connexion a échoué mais l\'application continuera');
    console.error('   Les fonctionnalités nécessitant la DB seront indisponibles');
  });
} else {
  console.warn('⚠️ Aucune URL de base de données configurée');
  console.warn('   L\'application démarrera mais la DB ne sera pas accessible');
}

module.exports = pool;
module.exports.closeDatabase = closeDatabase;
module.exports.testConnection = testConnection;