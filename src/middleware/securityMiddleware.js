// src/middlewares/securityMiddleware.js
const crypto = require('crypto');
const db = require('../database/connection');

// Table pour tracer les tentatives de connexion
function initSecurityTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS TentativeConnexion (
      id_tentative INTEGER PRIMARY KEY AUTOINCREMENT,
      identifiant VARCHAR(100) NOT NULL,
      ip_address VARCHAR(45) NOT NULL,
      user_agent TEXT,
      succes BOOLEAN DEFAULT 0,
      date_tentative TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      raison_echec TEXT
    );

    CREATE TABLE IF NOT EXISTS JournalActivite (
      id_journal INTEGER PRIMARY KEY AUTOINCREMENT,
      id_utilisateur INTEGER,
      action VARCHAR(100) NOT NULL,
      module VARCHAR(50) NOT NULL,
      details TEXT,
      ip_address VARCHAR(45),
      date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
    );

    CREATE TABLE IF NOT EXISTS ConfigurationSecurite (
      id_config INTEGER PRIMARY KEY AUTOINCREMENT,
      cle VARCHAR(50) UNIQUE NOT NULL,
      valeur TEXT NOT NULL,
      description TEXT,
      date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_tentative_ip ON TentativeConnexion(ip_address);
    CREATE INDEX IF NOT EXISTS idx_tentative_date ON TentativeConnexion(date_tentative);
    CREATE INDEX IF NOT EXISTS idx_journal_utilisateur ON JournalActivite(id_utilisateur);
    CREATE INDEX IF NOT EXISTS idx_journal_date ON JournalActivite(date_action);
  `);

  // Configuration par défaut
  const defaultConfig = [
    ['max_tentatives_connexion', '5', 'Nombre maximum de tentatives de connexion échouées'],
    ['duree_blocage_minutes', '30', 'Durée de blocage après échec (en minutes)'],
    ['duree_session_heures', '8', 'Durée maximale d\'une session (en heures)'],
    ['force_changement_mdp_jours', '90', 'Forcer le changement de mot de passe tous les X jours'],
    ['longueur_min_mdp', '8', 'Longueur minimale du mot de passe'],
    ['exiger_majuscule', 'true', 'Exiger au moins une majuscule'],
    ['exiger_minuscule', 'true', 'Exiger au moins une minuscule'],
    ['exiger_chiffre', 'true', 'Exiger au moins un chiffre'],
    ['exiger_caractere_special', 'true', 'Exiger au moins un caractère spécial'],
    ['activer_2fa', 'false', 'Activer l\'authentification à deux facteurs (future)'],
    ['ip_autorisees', '', 'Liste des IP autorisées (vide = toutes)']
  ];

  const insertConfig = db.prepare(`
    INSERT OR IGNORE INTO ConfigurationSecurite (cle, valeur, description)
    VALUES (?, ?, ?)
  `);

  defaultConfig.forEach(([cle, valeur, description]) => {
    insertConfig.run(cle, valeur, description);
  });
}

// Initialiser les tables au chargement
initSecurityTables();

// ============================================================
// 1. LIMITATION DES TENTATIVES DE CONNEXION (Brute Force Protection)
// ============================================================

function enregistrerTentativeConnexion(identifiant, ip, userAgent, succes, raisonEchec = null) {
  db.prepare(`
    INSERT INTO TentativeConnexion (identifiant, ip_address, user_agent, succes, raison_echec)
    VALUES (?, ?, ?, ?, ?)
  `).run(identifiant, ip, userAgent, succes ? 1 : 0, raisonEchec);
}

function verifierBlocageIP(ip) {
  const config = getSecurityConfig();
  const maxTentatives = parseInt(config.max_tentatives_connexion);
  const dureeBlocage = parseInt(config.duree_blocage_minutes);

  const tentatives = db.prepare(`
    SELECT COUNT(*) as count
    FROM TentativeConnexion
    WHERE ip_address = ?
      AND succes = 0
      AND date_tentative > datetime('now', '-${dureeBlocage} minutes')
  `).get(ip);

  return tentatives.count >= maxTentatives;
}

function verifierBlocageUtilisateur(identifiant) {
  const config = getSecurityConfig();
  const maxTentatives = parseInt(config.max_tentatives_connexion);
  const dureeBlocage = parseInt(config.duree_blocage_minutes);

  const tentatives = db.prepare(`
    SELECT COUNT(*) as count
    FROM TentativeConnexion
    WHERE identifiant = ?
      AND succes = 0
      AND date_tentative > datetime('now', '-${dureeBlocage} minutes')
  `).get(identifiant);

  return tentatives.count >= maxTentatives;
}

const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  if (verifierBlocageIP(ip)) {
    const config = getSecurityConfig();
    return res.status(429).json({
      success: false,
      error: `Trop de tentatives échouées. Réessayez dans ${config.duree_blocage_minutes} minutes.`
    });
  }

  next();
};

// ============================================================
// 2. VALIDATION FORTE DES MOTS DE PASSE
// ============================================================

function validerMotDePasse(password) {
  const config = getSecurityConfig();
  const errors = [];

  const longueurMin = parseInt(config.longueur_min_mdp);
  if (password.length < longueurMin) {
    errors.push(`Le mot de passe doit contenir au moins ${longueurMin} caractères`);
  }

  if (config.exiger_majuscule === 'true' && !/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }

  if (config.exiger_minuscule === 'true' && !/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }

  if (config.exiger_chiffre === 'true' && !/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  if (config.exiger_caractere_special === 'true' && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)');
  }

  // Vérifier les mots de passe communs
  const motsDePasseCommuns = [
    'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
    'admin', 'admin123', 'letmein', 'welcome', 'monkey', '1234567890'
  ];

  if (motsDePasseCommuns.includes(password.toLowerCase())) {
    errors.push('Ce mot de passe est trop commun');
  }

  return {
    valide: errors.length === 0,
    erreurs: errors
  };
}

// ============================================================
// 3. RESTRICTION PAR ADRESSE IP (optionnel)
// ============================================================

const ipWhitelistMiddleware = (req, res, next) => {
  const config = getSecurityConfig();
  const ipAutorisees = config.ip_autorisees;

  // Si pas de restriction IP, on continue
  if (!ipAutorisees || ipAutorisees.trim() === '') {
    return next();
  }

  const ip = req.ip || req.connection.remoteAddress;
  const listeIPs = ipAutorisees.split(',').map(ip => ip.trim());

  if (!listeIPs.includes(ip)) {
    journaliserActivite(null, 'ACCES_REFUSE_IP', 'securite', 
      `Tentative d'accès depuis IP non autorisée: ${ip}`, ip);
    
    return res.status(403).json({
      success: false,
      error: 'Accès refusé depuis cette adresse IP'
    });
  }

  next();
};

// ============================================================
// 4. EXPIRATION AUTOMATIQUE DES SESSIONS
// ============================================================

function nettoyerSessionsExpirees() {
  const config = getSecurityConfig();
  const dureeSession = parseInt(config.duree_session_heures);

  db.prepare(`
    UPDATE SessionToken
    SET actif = 0
    WHERE date_creation < datetime('now', '-${dureeSession} hours')
      AND actif = 1
  `).run();
}

// Nettoyer toutes les 30 minutes
setInterval(nettoyerSessionsExpirees, 30 * 60 * 1000);

// ============================================================
// 5. JOURNALISATION DES ACTIVITÉS CRITIQUES
// ============================================================

function journaliserActivite(idUtilisateur, action, module, details, ip) {
  db.prepare(`
    INSERT INTO JournalActivite (id_utilisateur, action, module, details, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `).run(idUtilisateur, action, module, details || null, ip || null);
}

const auditMiddleware = (action, module) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.user ? req.user.id : null;
    
    // Journaliser après la réponse
    res.on('finish', () => {
      if (res.statusCode < 400) { // Seulement si succès
        journaliserActivite(userId, action, module, 
          JSON.stringify({ 
            method: req.method, 
            path: req.path,
            params: req.params,
            query: req.query
          }), 
          ip
        );
      }
    });

    next();
  };
};

// ============================================================
// 6. DÉTECTION D'ACTIVITÉS SUSPECTES
// ============================================================

function detecterActiviteSuspecte(idUtilisateur) {
  // Vérifier les connexions multiples depuis différentes IPs
  const connexionsRecentes = db.prepare(`
    SELECT DISTINCT ip_address, COUNT(*) as count
    FROM JournalActivite
    WHERE id_utilisateur = ?
      AND action = 'CONNEXION'
      AND date_action > datetime('now', '-1 hour')
    GROUP BY ip_address
  `).all(idUtilisateur);

  if (connexionsRecentes.length > 3) {
    journaliserActivite(idUtilisateur, 'ALERTE_SECURITE', 'securite',
      `Connexions depuis ${connexionsRecentes.length} IPs différentes en 1h`);
    return true;
  }

  // Vérifier les actions inhabituelles (ex: tentatives multiples de suppression)
  const actionsRecentes = db.prepare(`
    SELECT action, COUNT(*) as count
    FROM JournalActivite
    WHERE id_utilisateur = ?
      AND date_action > datetime('now', '-10 minutes')
    GROUP BY action
    HAVING count > 20
  `).all(idUtilisateur);

  if (actionsRecentes.length > 0) {
    journaliserActivite(idUtilisateur, 'ALERTE_SECURITE', 'securite',
      `Activité anormalement élevée: ${JSON.stringify(actionsRecentes)}`);
    return true;
  }

  return false;
}

// ============================================================
// 7. GESTION DE LA CONFIGURATION DE SÉCURITÉ
// ============================================================

function getSecurityConfig() {
  const config = {};
  const rows = db.prepare('SELECT cle, valeur FROM ConfigurationSecurite').all();
  rows.forEach(row => {
    config[row.cle] = row.valeur;
  });
  return config;
}

function updateSecurityConfig(cle, valeur) {
  db.prepare(`
    UPDATE ConfigurationSecurite
    SET valeur = ?, date_modification = CURRENT_TIMESTAMP
    WHERE cle = ?
  `).run(valeur, cle);
}

// ============================================================
// 8. PROTECTION CSRF (pour les futures applications web)
// ============================================================

function genererTokenCSRF() {
  return crypto.randomBytes(32).toString('hex');
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  rateLimitMiddleware,
  ipWhitelistMiddleware,
  auditMiddleware,
  validerMotDePasse,
  enregistrerTentativeConnexion,
  verifierBlocageUtilisateur,
  journaliserActivite,
  detecterActiviteSuspecte,
  getSecurityConfig,
  updateSecurityConfig,
  nettoyerSessionsExpirees,
  genererTokenCSRF
};