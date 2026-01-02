// src/utils/sessionCleanup.js
const pool = require('../database/connection');

/**
 * Nettoie les sessions expirées de la base de données
 */
async function cleanExpiredSessions() {
  try {
    const result = await pool.query(`
      DELETE FROM SessionToken
      WHERE date_expiration < NOW()
      AND actif = TRUE
    `);
    
    if (result.rowCount > 0) {
      console.log(`🧹 ${result.rowCount} session(s) expirée(s) nettoyée(s)`);
    }
    
    return result.rowCount;
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des sessions:', error.message);
    return 0;
  }
}

/**
 * Démarre le nettoyage automatique des sessions
 * @param {number} intervalMinutes - Intervalle en minutes entre chaque nettoyage
 */
function startAutomaticCleanup(intervalMinutes = 60) {
  console.log(`⏰ Démarrage du nettoyage automatique (toutes les ${intervalMinutes} minutes)`);
  
  // Nettoyage initial au démarrage
  cleanExpiredSessions();
  
  // Nettoyage périodique
  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(() => {
    cleanExpiredSessions();
  }, intervalMs);
}

/**
 * Désactive toutes les sessions d'un utilisateur
 * @param {number} userId - ID de l'utilisateur
 */
async function revokeUserSessions(userId) {
  try {
    const result = await pool.query(`
      UPDATE SessionToken
      SET actif = FALSE
      WHERE id_utilisateur = $1
      AND actif = TRUE
    `, [userId]);
    
    console.log(`🔒 ${result.rowCount} session(s) révoquée(s) pour l'utilisateur ${userId}`);
    return result.rowCount;
  } catch (error) {
    console.error('❌ Erreur lors de la révocation des sessions:', error.message);
    return 0;
  }
}

/**
 * Obtient le nombre de sessions actives
 */
async function getActiveSessionsCount() {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM SessionToken
      WHERE actif = TRUE
      AND date_expiration > NOW()
    `);
    
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('❌ Erreur lors du comptage des sessions:', error.message);
    return 0;
  }
}

module.exports = {
  cleanExpiredSessions,
  startAutomaticCleanup,
  revokeUserSessions,
  getActiveSessionsCount
};