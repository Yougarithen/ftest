// Script pour créer un utilisateur de test avec mot de passe hashé
// Usage: node create-test-user.js [chemin-vers-database.db]

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Récupérer le chemin de la base depuis les arguments ou chercher automatiquement
let dbPath = process.argv[2];

if (!dbPath) {
  // Chemins possibles
  const possiblePaths = [
    './database.db',
    './src/database/database.db',
    './database/database.db',
    '../database.db',
    '../../database.db',
    './erp_database.db',
    './src/database/erp_database.db'
  ];

  console.log('🔍 Recherche de la base de données...\n');

  for (const testPath of possiblePaths) {
    const fullPath = path.resolve(testPath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ Base de données trouvée: ${fullPath}\n`);
      dbPath = fullPath;
      break;
    }
  }

  if (!dbPath) {
    console.error('❌ Base de données non trouvée!');
    console.log('\n💡 Spécifiez le chemin:');
    console.log('node create-test-user.js <chemin-vers-database.db>');
    console.log('\nExemple:');
    console.log('node create-test-user.js ./src/database/database.db');
    process.exit(1);
  }
}

const db = new Database(dbPath);

async function createTestUser() {
  console.log('=== CRÉATION D\'UN UTILISATEUR DE TEST ===\n');

  try {
    // Trouver la table des utilisateurs
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();

    const userTable = tables.find(t => 
      t.name.toLowerCase().includes('utilisateur') || 
      t.name.toLowerCase().includes('user')
    );

    if (!userTable) {
      throw new Error('Table des utilisateurs non trouvée!');
    }

    const tableName = userTable.name;
    console.log(`📊 Table utilisée: ${tableName}`);

    // Voir la structure de la table
    const structure = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const columns = structure.map(col => col.name);
    console.log(`📋 Colonnes: ${columns.join(', ')}\n`);

    // Identifier les colonnes importantes
    const usernameCol = columns.find(c => c.toLowerCase().includes('nom_utilisateur') || c === 'username') || 'nom_utilisateur';
    const emailCol = columns.find(c => c.toLowerCase().includes('email')) || 'email';
    const passwordCol = columns.find(c => c.toLowerCase().includes('password') || c.toLowerCase().includes('passe')) || 'mot_de_passe_hash';
    const nameCol = columns.find(c => c.toLowerCase().includes('nom_complet') || c.toLowerCase().includes('full_name')) || 'nom_complet';
    const roleCol = columns.find(c => c.toLowerCase().includes('role')) || 'id_role';
    const activeCol = columns.find(c => c.toLowerCase().includes('actif') || c === 'active') || 'actif';

    // Paramètres de l'utilisateur
    const userData = {
      username: 'admin',
      email: 'admin@test.com',
      password: 'password123',
      fullName: 'Administrateur Test',
      roleId: 1
    };

    console.log('👤 Création de l\'utilisateur:');
    console.log(`   Username: ${userData.username}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Password: ${userData.password}`);
    console.log(`   Nom: ${userData.fullName}\n`);

    // Vérifier si l'utilisateur existe déjà
    const checkQuery = `SELECT * FROM ${tableName} WHERE ${emailCol} = ? OR ${usernameCol} = ?`;
    const existing = db.prepare(checkQuery).get(userData.email, userData.username);

    if (existing) {
      console.log('⚠️  Un utilisateur existe déjà avec cet email ou username.');
      console.log('   Mise à jour du mot de passe...\n');
      
      // Hasher le mot de passe
      const hash = await bcrypt.hash(userData.password, 10);
      console.log(`🔐 Hash créé: ${hash.substring(0, 40)}...\n`);
      
      // Mettre à jour
      const idCol = structure.find(col => col.pk === 1)?.name || 'id';
      const updateQuery = `UPDATE ${tableName} SET ${passwordCol} = ?, ${activeCol} = 1 WHERE ${idCol} = ?`;
      db.prepare(updateQuery).run(hash, existing[idCol]);
      
      console.log('✅ Mot de passe mis à jour avec succès!\n');
      console.log('📝 Identifiants de connexion:');
      console.log(`   Email/Username: ${userData.email} ou ${userData.username}`);
      console.log(`   Mot de passe: ${userData.password}`);
      return;
    }

    // Hasher le mot de passe
    console.log('🔐 Hashage du mot de passe...');
    const hash = await bcrypt.hash(userData.password, 10);
    console.log(`   Hash: ${hash.substring(0, 40)}...`);

    // Construire la requête d'insertion
    const insertColumns = [usernameCol, emailCol, passwordCol, nameCol];
    const insertValues = [userData.username, userData.email, hash, userData.fullName];
    
    if (columns.includes(roleCol)) {
      insertColumns.push(roleCol);
      insertValues.push(userData.roleId);
    }
    
    if (columns.includes(activeCol)) {
      insertColumns.push(activeCol);
      insertValues.push(1);
    }

    const insertQuery = `
      INSERT INTO ${tableName} (${insertColumns.join(', ')})
      VALUES (${insertColumns.map(() => '?').join(', ')})
    `;

    console.log(`\n📝 Requête SQL: ${insertQuery}`);
    
    const result = db.prepare(insertQuery).run(...insertValues);

    console.log(`\n✅ Utilisateur créé avec succès! ID: ${result.lastInsertRowid}`);
    console.log('\n📝 Identifiants de connexion:');
    console.log(`   Email: ${userData.email}`);
    console.log(`   Username: ${userData.username}`);
    console.log(`   Mot de passe: ${userData.password}`);

    // Vérifier la création
    const idCol = structure.find(col => col.pk === 1)?.name || 'id';
    const user = db.prepare(`SELECT * FROM ${tableName} WHERE ${idCol} = ?`).get(result.lastInsertRowid);
    
    console.log('\n🔍 Vérification dans la base:');
    Object.entries(user).forEach(([key, value]) => {
      if (key === passwordCol) {
        console.log(`   ${key}: ${value.substring(0, 40)}...`);
      } else {
        console.log(`   ${key}: ${value}`);
      }
    });

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error);
  } finally {
    db.close();
  }
}

// Exécuter
createTestUser().catch(console.error);