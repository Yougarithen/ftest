// src/utils/sessionCleanup.js
// Script de nettoyage automatique des sessions expirées

const db = require('../database/connection');

/**
 * Nettoyer les sessions expirées
 */
function cleanupExpiredSessions() {
  try {
    const result = db.prepare(`
      UPDATE SessionToken
      SET actif = 0
      WHERE actif = 1 
      AND date_expiration < datetime('now')
    `).run();

    if (result.changes > 0) {
      console.log(`🧹 ${result.changes} session(s) expirée(s) nettoyée(s)`);
    }

    return result.changes;
  } catch (error) {
    console.error('❌ Erreur nettoyage sessions:', error);
    return 0;
  }
}

/**
 * Supprimer les anciennes sessions inactives (plus de 30 jours)
 */
function deleteOldSessions(daysOld = 30) {
  try {
    const result = db.prepare(`
      DELETE FROM SessionToken
      WHERE actif = 0 
      AND date_creation < datetime('now', '-${daysOld} days')
    `).run();

    if (result.changes > 0) {
      console.log(`🗑️  ${result.changes} ancienne(s) session(s) supprimée(s)`);
    }

    return result.changes;
  } catch (error) {
    console.error('❌ Erreur suppression anciennes sessions:', error);
    return 0;
  }
}

/**
 * Obtenir des statistiques sur les sessions
 */
function getSessionStats() {
  try {
    const stats = {
      actives: db.prepare(`
        SELECT COUNT(*) as count FROM SessionToken
        WHERE actif = 1 AND date_expiration > datetime('now')
      `).get().count,
      
      expirees: db.prepare(`
        SELECT COUNT(*) as count FROM SessionToken
        WHERE actif = 1 AND date_expiration <= datetime('now')
      `).get().count,
      
      revoquees: db.prepare(`
        SELECT COUNT(*) as count FROM SessionToken
        WHERE actif = 0
      `).get().count,
      
      total: db.prepare(`
        SELECT COUNT(*) as count FROM SessionToken
      `).get().count,
      
      utilisateurs_connectes: db.prepare(`
        SELECT COUNT(DISTINCT id_utilisateur) as count FROM SessionToken
        WHERE actif = 1 AND date_expiration > datetime('now')
      `).get().count
    };

    return stats;
  } catch (error) {
    console.error('❌ Erreur récupération stats:', error);
    return null;
  }
}

/**
 * Démarrer le nettoyage automatique périodique
 */
function startAutomaticCleanup(intervalMinutes = 60) {
  console.log(`🚀 Démarrage du nettoyage automatique (toutes les ${intervalMinutes} minutes)`);
  
  // Nettoyage immédiat
  cleanupExpiredSessions();
  
  // Puis nettoyage périodique
  const intervalMs = intervalMinutes * 60 * 1000;
  
  setInterval(() => {
    console.log('\n⏰ Nettoyage automatique des sessions...');
    const cleaned = cleanupExpiredSessions();
    const deleted = deleteOldSessions(30);
    
    if (cleaned === 0 && deleted === 0) {
      console.log('✅ Aucune session à nettoyer');
    }
    
    const stats = getSessionStats();
    if (stats) {
      console.log(`📊 Sessions actives: ${stats.actives}, Utilisateurs connectés: ${stats.utilisateurs_connectes}`);
    }
  }, intervalMs);
}

module.exports = {
  cleanupExpiredSessions,
  deleteOldSessions,
  getSessionStats,
  startAutomaticCleanup
};
