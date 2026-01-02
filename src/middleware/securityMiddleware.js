// src/middlewares/securityMiddleware.js - PostgreSQL
const crypto = require('crypto');
const pool = require('../database/connection');

// Table pour tracer les tentatives de connexion
async function initSecurityTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS TentativeConnexion (
      id_tentative SERIAL PRIMARY KEY,
      identifiant VARCHAR(100) NOT NULL,
      ip_address VARCHAR(45) NOT NULL,
      user_agent TEXT,
      succes BOOLEAN DEFAULT FALSE,
      date_tentative TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      raison_echec TEXT,
      id_utilisateur INTEGER
    );

    CREATE TABLE IF NOT EXISTS JournalActivite (
      id_journal SERIAL PRIMARY KEY,
      id_utilisateur INTEGER,
      action VARCHAR(100) NOT NULL,
      module VARCHAR(50) NOT NULL,
      details TEXT,
      ip_address VARCHAR(45),
      date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
    );

    CREATE TABLE IF NOT EXISTS ConfigurationSecurite (
      id_config SERIAL PRIMARY KEY,
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

  for (const [cle, valeur, description] of defaultConfig) {
    await pool.query(`
      INSERT INTO ConfigurationSecurite (cle, valeur, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (cle) DO NOTHING
    `, [cle, valeur, description]);
  }
}

// Initialiser les tables au chargement
initSecurityTables().catch(err => {
  console.error('Erreur initialisation tables sécurité:', err);
});

// ============================================================
// 1. LIMITATION DES TENTATIVES DE CONNEXION (Brute Force Protection)
// ============================================================

async function enregistrerTentativeConnexion(identifiant, ip, userAgent, succes, raisonEchec = null, idUtilisateur = null) {
  await pool.query(`
    INSERT INTO TentativeConnexion (identifiant, ip_address, user_agent, succes, raison_echec, id_utilisateur)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [identifiant, ip, userAgent, succes, raisonEchec, idUtilisateur]);
}

async function verifierBlocageIP(ip) {
  const config = await getSecurityConfig();
  const maxTentatives = parseInt(config.max_tentatives_connexion);
  const dureeBlocage = parseInt(config.duree_blocage_minutes);

  const result = await pool.query(`
    SELECT COUNT(*) as count
    FROM TentativeConnexion
    WHERE ip_address = $1
      AND succes = FALSE
      AND date_tentative > NOW() - INTERVAL '${dureeBlocage} minutes'
  `, [ip]);

  return parseInt(result.rows[0].count) >= maxTentatives;
}

async function verifierBlocageUtilisateur(identifiant) {
  const config = await getSecurityConfig();
  const maxTentatives = parseInt(config.max_tentatives_connexion);
  const dureeBlocage = parseInt(config.duree_blocage_minutes);

  const result = await pool.query(`
    SELECT COUNT(*) as count
    FROM TentativeConnexion
    WHERE identifiant = $1
      AND succes = FALSE
      AND date_tentative > NOW() - INTERVAL '${dureeBlocage} minutes'
  `, [identifiant]);

  return parseInt(result.rows[0].count) >= maxTentatives;
}

const rateLimitMiddleware = async (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  if (await verifierBlocageIP(ip)) {
    const config = await getSecurityConfig();
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

async function validerMotDePasse(password) {
  const config = await getSecurityConfig();
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

const ipWhitelistMiddleware = async (req, res, next) => {
  const config = await getSecurityConfig();
  const ipAutorisees = config.ip_autorisees;

  // Si pas de restriction IP, on continue
  if (!ipAutorisees || ipAutorisees.trim() === '') {
    return next();
  }

  const ip = req.ip || req.connection.remoteAddress;
  const listeIPs = ipAutorisees.split(',').map(ip => ip.trim());

  if (!listeIPs.includes(ip)) {
    await journaliserActivite(null, 'ACCES_REFUSE_IP', 'securite', 
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

async function nettoyerSessionsExpirees() {
  const config = await getSecurityConfig();
  const dureeSession = parseInt(config.duree_session_heures);

  await pool.query(`
    UPDATE SessionToken
    SET actif = 0
    WHERE date_creation < NOW() - INTERVAL '${dureeSession} hours'
      AND actif = 1
  `);
}

// Nettoyer toutes les 30 minutes
setInterval(nettoyerSessionsExpirees, 30 * 60 * 1000);

// ============================================================
// 5. JOURNALISATION DES ACTIVITÉS CRITIQUES
// ============================================================

async function journaliserActivite(idUtilisateur, action, module, details, ip) {
  await pool.query(`
    INSERT INTO JournalActivite (id_utilisateur, action, module, details, ip_address)
    VALUES ($1, $2, $3, $4, $5)
  `, [idUtilisateur, action, module, details || null, ip || null]);
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
        ).catch(err => console.error('Erreur journalisation:', err));
      }
    });

    next();
  };
};

// ============================================================
// 6. DÉTECTION D'ACTIVITÉS SUSPECTES
// ============================================================

async function detecterActiviteSuspecte(idUtilisateur) {
  // Vérifier les connexions multiples depuis différentes IPs
  const connexionsRecentes = await pool.query(`
    SELECT DISTINCT ip_address, COUNT(*) as count
    FROM JournalActivite
    WHERE id_utilisateur = $1
      AND action = 'CONNEXION'
      AND date_action > NOW() - INTERVAL '1 hour'
    GROUP BY ip_address
  `, [idUtilisateur]);

  if (connexionsRecentes.rows.length > 3) {
    await journaliserActivite(idUtilisateur, 'ALERTE_SECURITE', 'securite',
      `Connexions depuis ${connexionsRecentes.rows.length} IPs différentes en 1h`);
    return true;
  }

  // Vérifier les actions inhabituelles
  const actionsRecentes = await pool.query(`
    SELECT action, COUNT(*) as count
    FROM JournalActivite
    WHERE id_utilisateur = $1
      AND date_action > NOW() - INTERVAL '10 minutes'
    GROUP BY action
    HAVING COUNT(*) > 20
  `, [idUtilisateur]);

  if (actionsRecentes.rows.length > 0) {
    await journaliserActivite(idUtilisateur, 'ALERTE_SECURITE', 'securite',
      `Activité anormalement élevée: ${JSON.stringify(actionsRecentes.rows)}`);
    return true;
  }

  return false;
}

// ============================================================
// 7. GESTION DE LA CONFIGURATION DE SÉCURITÉ
// ============================================================

async function getSecurityConfig() {
  const config = {};
  const result = await pool.query('SELECT cle, valeur FROM ConfigurationSecurite');
  result.rows.forEach(row => {
    config[row.cle] = row.valeur;
  });
  return config;
}

async function updateSecurityConfig(cle, valeur) {
  await pool.query(`
    UPDATE ConfigurationSecurite
    SET valeur = $1, date_modification = CURRENT_TIMESTAMP
    WHERE cle = $2
  `, [valeur, cle]);
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
