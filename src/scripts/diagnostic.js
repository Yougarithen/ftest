// Script pour corriger le mot de passe de l'utilisateur existant
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = 'C:\\Users\\Admin\\Desktop\\KLINKOL PROJECT\\PROJET\\database\\stock.db';
const db = new Database(dbPath);

async function fixUserPassword() {
  console.log('=== CORRECTION DU MOT DE PASSE ===\n');

  try {
    // Récupérer l'utilisateur existant
    const user = db.prepare('SELECT * FROM Utilisateur WHERE id_utilisateur = 1').get();
    
    console.log('👤 Utilisateur actuel:');
    console.log(`   ID: ${user.id_utilisateur}`);
    console.log(`   Username: ${user.nom_utilisateur}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Mot de passe actuel: ${user.mot_de_passe_hash} (EN CLAIR!)\n`);

    // Le mot de passe actuel en clair est "12345"
    const motDePasseClair = '12345';
    
    console.log('🔐 Hashage du mot de passe "12345" avec bcrypt...');
    const hash = await bcrypt.hash(motDePasseClair, 10);
    console.log(`   Hash généré: ${hash}\n`);

    // Mettre à jour le mot de passe
    db.prepare(`
      UPDATE Utilisateur 
      SET mot_de_passe_hash = ?,
          actif = 1,
          date_modification = CURRENT_TIMESTAMP
      WHERE id_utilisateur = ?
    `).run(hash, user.id_utilisateur);

    console.log('✅ Mot de passe mis à jour avec succès!\n');

    // Vérifier
    const updatedUser = db.prepare('SELECT * FROM Utilisateur WHERE id_utilisateur = 1').get();
    console.log('🔍 Vérification:');
    console.log(`   Username: ${updatedUser.nom_utilisateur}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Hash: ${updatedUser.mot_de_passe_hash.substring(0, 40)}...`);
    console.log(`   Actif: ${updatedUser.actif ? 'Oui' : 'Non'}\n`);

    // Test du mot de passe
    console.log('🧪 Test de vérification du mot de passe...');
    const isValid = await bcrypt.compare(motDePasseClair, updatedUser.mot_de_passe_hash);
    
    if (isValid) {
      console.log('✅ Le mot de passe fonctionne correctement!\n');
      console.log('📝 IDENTIFIANTS DE CONNEXION:');
      console.log('   ═══════════════════════════════════════');
      console.log(`   Email/Username: ${updatedUser.email} ou ${updatedUser.nom_utilisateur}`);
      console.log(`   Mot de passe: ${motDePasseClair}`);
      console.log('   ═══════════════════════════════════════\n');
    } else {
      console.log('❌ Erreur: Le mot de passe ne fonctionne pas!\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    db.close();
  }
}

fixUserPassword().catch(console.error);