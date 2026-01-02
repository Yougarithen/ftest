// Script de migration complet pour le système de sessions
// À exécuter une seule fois : node migrate-database.js

const Database = require('better-sqlite3');
const path = require('path');

// Chemin vers votre base de données
const dbPath = path.join(__dirname, '../database/stock.db');
const db = new Database(dbPath);

console.log('🔧 MIGRATION DE LA BASE DE DONNÉES\n');
console.log('Base de données:', dbPath);
console.log('─────────────────────────────────────────\n');

let migrationsApplied = 0;

try {
  // ============================================================
  // 1. Ajouter date_derniere_activite à SessionToken
  // ============================================================
  console.log('📋 1. Table SessionToken');
  const sessionCols = db.prepare('PRAGMA table_info(SessionToken)').all();
  const hasDateDerniereActivite = sessionCols.some(col => col.name === 'date_derniere_activite');

  if (!hasDateDerniereActivite) {
    console.log('   ➕ Ajout de la colonne date_derniere_activite...');
    db.prepare(`
      ALTER TABLE SessionToken 
      ADD COLUMN date_derniere_activite TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `).run();
    console.log('   ✅ Colonne ajoutée');
    migrationsApplied++;
  } else {
    console.log('   ✅ Colonne date_derniere_activite déjà présente');
  }

  // ============================================================
  // 2. Ajouter id_utilisateur à TentativeConnexion
  // ============================================================
  console.log('\n📋 2. Table TentativeConnexion');
  const tentativeCols = db.prepare('PRAGMA table_info(TentativeConnexion)').all();
  const hasIdUtilisateur = tentativeCols.some(col => col.name === 'id_utilisateur');

  if (!hasIdUtilisateur) {
    console.log('   ➕ Ajout de la colonne id_utilisateur...');
    db.prepare(`
      ALTER TABLE TentativeConnexion 
      ADD COLUMN id_utilisateur INTEGER
    `).run();
    console.log('   ✅ Colonne ajoutée');
    migrationsApplied++;
  } else {
    console.log('   ✅ Colonne id_utilisateur déjà présente');
  }

  // Renommer raison_echec en raison si elle existe
  const hasRaisonEchec = tentativeCols.some(col => col.name === 'raison_echec');
  const hasRaison = tentativeCols.some(col => col.name === 'raison');

  if (hasRaisonEchec && !hasRaison) {
    console.log('   ➕ Ajout de la colonne raison...');
    db.prepare(`
      ALTER TABLE TentativeConnexion 
      ADD COLUMN raison TEXT
    `).run();
    
    // Copier les données
    db.prepare(`
      UPDATE TentativeConnexion 
      SET raison = raison_echec
    `).run();
    
    console.log('   ✅ Colonne raison ajoutée et données copiées');
    migrationsApplied++;
  } else if (hasRaison) {
    console.log('   ✅ Colonne raison déjà présente');
  } else {
    console.log('   ➕ Ajout de la colonne raison...');
    db.prepare(`
      ALTER TABLE TentativeConnexion 
      ADD COLUMN raison TEXT
    `).run();
    console.log('   ✅ Colonne raison ajoutée');
    migrationsApplied++;
  }

  // ============================================================
  // 3. Vérifier la structure finale des tables
  // ============================================================
  console.log('\n📊 STRUCTURE FINALE DES TABLES');
  console.log('─────────────────────────────────────────\n');

  // SessionToken
  console.log('🔐 SessionToken:');
  const finalSessionCols = db.prepare('PRAGMA table_info(SessionToken)').all();
  finalSessionCols.forEach(col => {
    const nullable = col.notnull ? 'NOT NULL' : 'NULL';
    const defaultVal = col.dflt_value ? `DEFAULT ${col.dflt_value}` : '';
    console.log(`   - ${col.name.padEnd(25)} ${col.type.padEnd(15)} ${nullable.padEnd(10)} ${defaultVal}`);
  });

  // TentativeConnexion
  console.log('\n🔍 TentativeConnexion:');
  const finalTentativeCols = db.prepare('PRAGMA table_info(TentativeConnexion)').all();
  finalTentativeCols.forEach(col => {
    const nullable = col.notnull ? 'NOT NULL' : 'NULL';
    const defaultVal = col.dflt_value ? `DEFAULT ${col.dflt_value}` : '';
    console.log(`   - ${col.name.padEnd(25)} ${col.type.padEnd(15)} ${nullable.padEnd(10)} ${defaultVal}`);
  });

  // ============================================================
  // 4. Statistiques
  // ============================================================
  console.log('\n📊 STATISTIQUES');
  console.log('─────────────────────────────────────────');
  
  const sessionCount = db.prepare('SELECT COUNT(*) as count FROM SessionToken').get();
  console.log(`   Sessions: ${sessionCount.count}`);
  
  const tentativeCount = db.prepare('SELECT COUNT(*) as count FROM TentativeConnexion').get();
  console.log(`   Tentatives de connexion: ${tentativeCount.count}`);
  
  const userCount = db.prepare('SELECT COUNT(*) as count FROM Utilisateur').get();
  console.log(`   Utilisateurs: ${userCount.count}`);

  // ============================================================
  // Résumé
  // ============================================================
  console.log('\n╔════════════════════════════════════════╗');
  if (migrationsApplied > 0) {
    console.log(`║  ✅ ${migrationsApplied} migration(s) appliquée(s)       ║`);
    console.log('║  Base de données mise à jour !         ║');
  } else {
    console.log('║  ✅ Base de données déjà à jour        ║');
  }
  console.log('╚════════════════════════════════════════╝\n');

} catch (error) {
  console.error('\n❌ ERREUR lors de la migration:', error.message);
  console.error(error);
  process.exit(1);
} finally {
  db.close();
}
