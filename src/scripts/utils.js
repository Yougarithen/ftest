// scripts/utils.js - Scripts utilitaires pour la gestion de sécurité
require('dotenv').config();
const db = require('../database/connection');
const UserModel = require('../src/models/userModel');

// ============================================================
// GESTION DES UTILISATEURS
// ============================================================

// Lister tous les utilisateurs
function listUsers() {
  console.log('\n📋 Liste des utilisateurs:\n');
  const users = UserModel.getAll();
  console.table(users.map(u => ({
    ID: u.id_utilisateur,
    'Nom utilisateur': u.nom_utilisateur,
    Email: u.email,
    'Nom complet': u.nom_complet,
    Rôle: u.role,
    Actif: u.actif ? '✅' : '❌',
    'Dernière connexion': u.derniere_connexion || 'Jamais'
  })));
}

// Créer un utilisateur
async function createUser(username, email, password, fullName, roleId = 5) {
  try {
    const user = await UserModel.create({
      nom_utilisateur: username,
      email: email,
      mot_de_passe: password,
      nom_complet: fullName,
      id_role: roleId
    });
    console.log('✅ Utilisateur créé:', user);
    return user;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Désactiver un utilisateur
function deactivateUser(userId) {
  try {
    UserModel.update(userId, { actif: false });
    console.log(`✅ Utilisateur ${userId} désactivé`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Activer un utilisateur
function activateUser(userId) {
  try {
    UserModel.update(userId, { actif: true });
    console.log(`✅ Utilisateur ${userId} activé`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Changer le rôle d'un utilisateur
function changeUserRole(userId, roleId) {
  try {
    UserModel.update(userId, { id_role: roleId });
    console.log(`✅ Rôle de l'utilisateur ${userId} changé en ${roleId}`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Réinitialiser le mot de passe
async function resetPassword(userId, newPassword) {
  try {
    await UserModel.changePassword(userId, newPassword);
    console.log(`✅ Mot de passe de l'utilisateur ${userId} réinitialisé`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// ============================================================
// GESTION DES SESSIONS
// ============================================================

// Lister toutes les sessions actives
function listActiveSessions() {
  console.log('\n🔓 Sessions actives:\n');
  const sessions = db.prepare(`
    SELECT 
      s.id_session,
      u.nom_utilisateur,
      u.email,
      s.ip_address,
      s.date_creation,
      s.date_expiration
    FROM SessionToken s
    JOIN Utilisateur u ON s.id_utilisateur = u.id_utilisateur
    WHERE s.actif = 1 AND s.date_expiration > datetime('now')
    ORDER BY s.date_creation DESC
  `).all();

  if (sessions.length === 0) {
    console.log('Aucune session active');
    return;
  }

  console.table(sessions.map(s => ({
    ID: s.id_session,
    Utilisateur: s.nom_utilisateur,
    Email: s.email,
    IP: s.ip_address,
    Créée: s.date_creation,
    Expire: s.date_expiration
  })));
}

// Révoquer toutes les sessions d'un utilisateur
function revokeUserSessions(userId) {
  const result = db.prepare(`
    UPDATE SessionToken
    SET actif = 0
    WHERE id_utilisateur = ?
  `).run(userId);
  console.log(`✅ ${result.changes} session(s) révoquée(s) pour l'utilisateur ${userId}`);
}

// Révoquer toutes les sessions
function revokeAllSessions() {
  const result = db.prepare(`
    UPDATE SessionToken
    SET actif = 0
    WHERE actif = 1
  `).run();
  console.log(`✅ ${result.changes} session(s) révoquée(s)`);
}

// Nettoyer les sessions expirées
function cleanExpiredSessions() {
  const result = db.prepare(`
    DELETE FROM SessionToken
    WHERE actif = 0 OR date_expiration < datetime('now')
  `).run();
  console.log(`✅ ${result.changes} session(s) expirée(s) supprimée(s)`);
}

// ============================================================
// AUDIT ET SÉCURITÉ
// ============================================================

// Afficher les tentatives de connexion récentes
function showLoginAttempts(limit = 20) {
  console.log(`\n🔍 Dernières ${limit} tentatives de connexion:\n`);
  const attempts = db.prepare(`
    SELECT *
    FROM TentativeConnexion
    ORDER BY date_tentative DESC
    LIMIT ?
  `).all(limit);

  console.table(attempts.map(a => ({
    Identifiant: a.identifiant,
    IP: a.ip_address,
    Succès: a.succes ? '✅' : '❌',
    Raison: a.raison_echec || '-',
    Date: a.date_tentative
  })));
}

// Afficher les échecs de connexion par IP
function showFailedLoginsByIP() {
  console.log('\n⚠️  Échecs de connexion par IP (dernières 24h):\n');
  const failures = db.prepare(`
    SELECT 
      ip_address,
      COUNT(*) as tentatives,
      MAX(date_tentative) as derniere_tentative
    FROM TentativeConnexion
    WHERE succes = 0
      AND date_tentative > datetime('now', '-24 hours')
    GROUP BY ip_address
    ORDER BY tentatives DESC
  `).all();

  if (failures.length === 0) {
    console.log('✅ Aucun échec de connexion dans les dernières 24h');
    return;
  }

  console.table(failures.map(f => ({
    IP: f.ip_address,
    Tentatives: f.tentatives,
    'Dernière tentative': f.derniere_tentative
  })));
}

// Nettoyer l'historique des tentatives
function cleanLoginAttempts(daysOld = 30) {
  const result = db.prepare(`
    DELETE FROM TentativeConnexion
    WHERE date_tentative < datetime('now', '-${daysOld} days')
  `).run();
  console.log(`✅ ${result.changes} tentative(s) de plus de ${daysOld} jours supprimée(s)`);
}

// Afficher le journal d'activité récent
function showRecentActivity(limit = 50) {
  console.log(`\n📊 Activité récente (${limit} dernières actions):\n`);
  const activity = db.prepare(`
    SELECT 
      j.date_action,
      u.nom_utilisateur,
      j.action,
      j.module,
      j.ip_address
    FROM JournalActivite j
    LEFT JOIN Utilisateur u ON j.id_utilisateur = u.id_utilisateur
    ORDER BY j.date_action DESC
    LIMIT ?
  `).all(limit);

  console.table(activity.map(a => ({
    Date: a.date_action,
    Utilisateur: a.nom_utilisateur || 'Système',
    Action: a.action,
    Module: a.module,
    IP: a.ip_address
  })));
}

// Nettoyer le journal d'activité
function cleanActivityLog(daysOld = 90) {
  const result = db.prepare(`
    DELETE FROM JournalActivite
    WHERE date_action < datetime('now', '-${daysOld} days')
  `).run();
  console.log(`✅ ${result.changes} entrée(s) de plus de ${daysOld} jours supprimée(s)`);
}

// Statistiques de sécurité
function showSecurityStats() {
  console.log('\n📈 Statistiques de sécurité:\n');

  const stats = {
    'Utilisateurs actifs': db.prepare(`
      SELECT COUNT(*) as count FROM Utilisateur WHERE actif = 1
    `).get().count,
    
    'Utilisateurs désactivés': db.prepare(`
      SELECT COUNT(*) as count FROM Utilisateur WHERE actif = 0
    `).get().count,
    
    'Sessions actives': db.prepare(`
      SELECT COUNT(*) as count FROM SessionToken
      WHERE actif = 1 AND date_expiration > datetime('now')
    `).get().count,
    
    'Connexions réussies (24h)': db.prepare(`
      SELECT COUNT(*) as count FROM TentativeConnexion
      WHERE succes = 1 AND date_tentative > datetime('now', '-24 hours')
    `).get().count,
    
    'Connexions échouées (24h)': db.prepare(`
      SELECT COUNT(*) as count FROM TentativeConnexion
      WHERE succes = 0 AND date_tentative > datetime('now', '-24 hours')
    `).get().count,
    
    'Actions enregistrées (7j)': db.prepare(`
      SELECT COUNT(*) as count FROM JournalActivite
      WHERE date_action > datetime('now', '-7 days')
    `).get().count
  };

  console.table(stats);
}

// ============================================================
// PERMISSIONS
// ============================================================

// Afficher les permissions d'un utilisateur
function showUserPermissions(userId) {
  const user = UserModel.findById(userId);
  if (!user) {
    console.error('❌ Utilisateur non trouvé');
    return;
  }

  console.log(`\n🔐 Permissions de ${user.nom_utilisateur} (${user.role}):\n`);
  const permissions = UserModel.getPermissions(userId);
  
  // Grouper par module
  const grouped = {};
  permissions.forEach(perm => {
    const [module, action] = perm.split('.');
    if (!grouped[module]) grouped[module] = [];
    grouped[module].push(action);
  });

  Object.entries(grouped).forEach(([module, actions]) => {
    console.log(`\n📦 ${module.toUpperCase()}`);
    actions.forEach(action => console.log(`   • ${action}`));
  });
}

// ============================================================
// MAINTENANCE
// ============================================================

// Nettoyage complet
function fullCleanup() {
  console.log('\n🧹 Nettoyage complet en cours...\n');
  
  cleanExpiredSessions();
  cleanLoginAttempts(30);
  cleanActivityLog(90);
  
  console.log('\n✅ Nettoyage terminé');
}

// Vérification de santé du système
function healthCheck() {
  console.log('\n🏥 Vérification de santé du système:\n');

  const checks = {
    '✅ Base de données': 'OK',
    '✅ Tables créées': db.prepare(`
      SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'
    `).get().count > 0 ? 'OK' : '❌ ERREUR',
    '✅ Utilisateurs': db.prepare(`
      SELECT COUNT(*) as count FROM Utilisateur
    `).get().count > 0 ? 'OK' : '⚠️  Aucun utilisateur',
    '✅ Configuration': db.prepare(`
      SELECT COUNT(*) as count FROM ConfigurationSecurite
    `).get().count > 0 ? 'OK' : '❌ ERREUR'
  };

  console.table(checks);
}

// ============================================================
// INTERFACE EN LIGNE DE COMMANDE
// ============================================================

function showHelp() {
  console.log(`
╔══════════════════════════════════════════════╗
║   🛠️  Utilitaires de gestion de sécurité     ║
╚══════════════════════════════════════════════╝

UTILISATEURS:
  node scripts/utils.js list-users
  node scripts/utils.js deactivate-user <userId>
  node scripts/utils.js activate-user <userId>
  node scripts/utils.js change-role <userId> <roleId>
  node scripts/utils.js reset-password <userId> <newPassword>
  node scripts/utils.js show-permissions <userId>

SESSIONS:
  node scripts/utils.js list-sessions
  node scripts/utils.js revoke-user-sessions <userId>
  node scripts/utils.js revoke-all-sessions

AUDIT:
  node scripts/utils.js login-attempts [limit]
  node scripts/utils.js failed-logins
  node scripts/utils.js activity [limit]
  node scripts/utils.js stats

MAINTENANCE:
  node scripts/utils.js cleanup
  node scripts/utils.js health-check

RÔLES DISPONIBLES:
  1 = ADMIN
  2 = GESTIONNAIRE
  3 = VENDEUR
  4 = MAGASINIER
  5 = LECTEUR
  `);
}

// Point d'entrée
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'list-users':
      listUsers();
      break;
    case 'deactivate-user':
      deactivateUser(parseInt(args[1]));
      break;
    case 'activate-user':
      activateUser(parseInt(args[1]));
      break;
    case 'change-role':
      changeUserRole(parseInt(args[1]), parseInt(args[2]));
      break;
    case 'reset-password':
      resetPassword(parseInt(args[1]), args[2]).then(() => process.exit(0));
      break;
    case 'show-permissions':
      showUserPermissions(parseInt(args[1]));
      break;
    case 'list-sessions':
      listActiveSessions();
      break;
    case 'revoke-user-sessions':
      revokeUserSessions(parseInt(args[1]));
      break;
    case 'revoke-all-sessions':
      revokeAllSessions();
      break;
    case 'login-attempts':
      showLoginAttempts(parseInt(args[1]) || 20);
      break;
    case 'failed-logins':
      showFailedLoginsByIP();
      break;
    case 'activity':
      showRecentActivity(parseInt(args[1]) || 50);
      break;
    case 'stats':
      showSecurityStats();
      break;
    case 'cleanup':
      fullCleanup();
      break;
    case 'health-check':
      healthCheck();
      break;
    default:
      showHelp();
  }
}

module.exports = {
  listUsers,
  createUser,
  deactivateUser,
  activateUser,
  changeUserRole,
  resetPassword,
  showUserPermissions,
  listActiveSessions,
  revokeUserSessions,
  revokeAllSessions,
  cleanExpiredSessions,
  showLoginAttempts,
  showFailedLoginsByIP,
  cleanLoginAttempts,
  showRecentActivity,
  cleanActivityLog,
  showSecurityStats,
  fullCleanup,
  healthCheck
};