-- ============================================================
-- SYSTÈME DE GESTION DE STOCK - VERSION REAL (DÉCIMALES)
-- Base de données SQLite avec types REAL pour les calculs décimaux
-- ============================================================

-- Nettoyage complet
PRAGMA foreign_keys = OFF;
DROP TABLE IF EXISTS AjustementStock;
DROP TABLE IF EXISTS InventaireProduit;
DROP TABLE IF EXISTS InventaireMatiere;
DROP TABLE IF EXISTS Inventaire;
DROP TABLE IF EXISTS Paiement;
DROP TABLE IF EXISTS LigneFacture;
DROP TABLE IF EXISTS LigneDevis;
DROP TABLE IF EXISTS Production;
DROP TABLE IF EXISTS RecetteProduction;
DROP TABLE IF EXISTS Facture;
DROP TABLE IF EXISTS Devis;
DROP TABLE IF EXISTS Client;
DROP TABLE IF EXISTS Produit;
DROP TABLE IF EXISTS MatierePremiere;
DROP VIEW IF EXISTS Vue_EcartInventaireProduit;
DROP VIEW IF EXISTS Vue_EcartInventaireMatiere;
DROP VIEW IF EXISTS Vue_AlerteStock;
DROP VIEW IF EXISTS Vue_CreditsClients;
DROP VIEW IF EXISTS Vue_FacturesCredit;
DROP VIEW IF EXISTS Vue_FactureTotaux;
DROP VIEW IF EXISTS Vue_DevisTotaux;
DROP TRIGGER IF EXISTS after_paiement_insert;
DROP TRIGGER IF EXISTS after_production_insert;
DROP TRIGGER IF EXISTS after_facture_validate;
DROP INDEX IF EXISTS idx_production_date;
DROP INDEX IF EXISTS idx_production_produit;
DROP INDEX IF EXISTS idx_recette_produit;
DROP INDEX IF EXISTS idx_paiement_facture;
DROP INDEX IF EXISTS idx_ligne_facture_facture;
DROP INDEX IF EXISTS idx_facture_statut;
DROP INDEX IF EXISTS idx_facture_client;
DROP INDEX IF EXISTS idx_ligne_devis_devis;
DROP INDEX IF EXISTS idx_devis_statut;
DROP INDEX IF EXISTS idx_devis_client;
PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. TABLES DE BASE
-- ============================================================

CREATE TABLE MatierePremiere (
    id_matiere INTEGER PRIMARY KEY AUTOINCREMENT,
    nom VARCHAR(100) NOT NULL UNIQUE,
    unite VARCHAR(20) NOT NULL,
    typeM VARCHAR(20) NOT NULL,
    stock_actuel REAL NOT NULL DEFAULT 0 CHECK (stock_actuel >= 0),
    stock_minimum REAL NOT NULL DEFAULT 0 CHECK (stock_minimum >= 0),
    prix_unitaire REAL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Produit (
    id_produit INTEGER PRIMARY KEY AUTOINCREMENT,
    code_produit VARCHAR(50) UNIQUE,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    unite VARCHAR(20) NOT NULL,
    poids REAL CHECK (poids >= 0 OR poids IS NULL),
    unite_poids VARCHAR(10) DEFAULT 'kg',
    stock_actuel REAL NOT NULL DEFAULT 0 CHECK (stock_actuel >= 0),
    prix_vente_suggere REAL,
    taux_tva REAL DEFAULT 19.00 CHECK (taux_tva >= 0 AND taux_tva <= 100),
    soumis_taxe BOOLEAN DEFAULT 1,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Client (
    id_client INTEGER PRIMARY KEY AUTOINCREMENT,
    nom VARCHAR(100) NOT NULL,
    typeC VARCHAR(25) NOT NULL,
    numero_rc VARCHAR(50),
    nif VARCHAR(50),
    n_article VARCHAR(50),
    adresse TEXT,
    contact VARCHAR(100),
    telephone VARCHAR(20),
    email VARCHAR(100),
    assujetti_tva BOOLEAN DEFAULT 1,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Devis (
    id_devis INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_devis VARCHAR(50) UNIQUE NOT NULL,
    id_client INTEGER NOT NULL,
    date_devis DATE DEFAULT CURRENT_DATE,
    date_validite DATE,
    statut VARCHAR(20) DEFAULT 'Brouillon',
    remise_globale REAL DEFAULT 0 CHECK (remise_globale >= 0 AND remise_globale <= 100),
    conditions_paiement TEXT,
    notes TEXT,
    id_facture INTEGER,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP,
    FOREIGN KEY (id_client) REFERENCES Client(id_client)
);

CREATE TABLE Facture (
    id_facture INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_facture VARCHAR(50) UNIQUE NOT NULL,
    id_client INTEGER NOT NULL,
    id_devis INTEGER,
    date_facture DATE DEFAULT CURRENT_DATE,
    date_echeance DATE,
    statut VARCHAR(20) DEFAULT 'Brouillon',
    type_facture VARCHAR(20) DEFAULT 'STANDARD',
    remise_globale REAL DEFAULT 0 CHECK (remise_globale >= 0 AND remise_globale <= 100),
    montant_paye REAL DEFAULT 0 CHECK (montant_paye >= 0),
    conditions_paiement TEXT,
    notes TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP,
    date_validation TIMESTAMP,
    FOREIGN KEY (id_client) REFERENCES Client(id_client),
    FOREIGN KEY (id_devis) REFERENCES Devis(id_devis)
);

CREATE TABLE LigneDevis (
    id_ligne INTEGER PRIMARY KEY AUTOINCREMENT,
    id_devis INTEGER NOT NULL,
    id_produit INTEGER NOT NULL,
    quantite REAL NOT NULL CHECK (quantite > 0),
    unite_vente VARCHAR(20) NOT NULL,
    prix_unitaire_ht REAL NOT NULL CHECK (prix_unitaire_ht >= 0),
    taux_tva REAL NOT NULL CHECK (taux_tva >= 0 AND taux_tva <= 100),
    remise_ligne REAL DEFAULT 0 CHECK (remise_ligne >= 0 AND remise_ligne <= 100),
    description TEXT,
    FOREIGN KEY (id_devis) REFERENCES Devis(id_devis) ON DELETE CASCADE,
    FOREIGN KEY (id_produit) REFERENCES Produit(id_produit)
);

CREATE TABLE LigneFacture (
    id_ligne INTEGER PRIMARY KEY AUTOINCREMENT,
    id_facture INTEGER NOT NULL,
    id_produit INTEGER NOT NULL,
    quantite REAL NOT NULL CHECK (quantite > 0),
    unite_vente VARCHAR(20) NOT NULL,
    prix_unitaire_ht REAL NOT NULL CHECK (prix_unitaire_ht >= 0),
    taux_tva REAL NOT NULL CHECK (taux_tva >= 0 AND taux_tva <= 100),
    remise_ligne REAL DEFAULT 0 CHECK (remise_ligne >= 0 AND remise_ligne <= 100),
    description TEXT,
    FOREIGN KEY (id_facture) REFERENCES Facture(id_facture) ON DELETE CASCADE,
    FOREIGN KEY (id_produit) REFERENCES Produit(id_produit)
);

CREATE TABLE Paiement (
    id_paiement INTEGER PRIMARY KEY AUTOINCREMENT,
    id_facture INTEGER NOT NULL,
    montant_paye REAL NOT NULL CHECK (montant_paye > 0),
    date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mode_paiement VARCHAR(50),
    reference VARCHAR(100),
    responsable VARCHAR(100),
    commentaire TEXT,
    FOREIGN KEY (id_facture) REFERENCES Facture(id_facture) ON DELETE CASCADE
);

CREATE TABLE RecetteProduction (
    id_recette INTEGER PRIMARY KEY AUTOINCREMENT,
    id_produit INTEGER NOT NULL,
    id_matiere INTEGER NOT NULL,
    quantite_necessaire REAL NOT NULL CHECK (quantite_necessaire > 0),
    FOREIGN KEY (id_produit) REFERENCES Produit(id_produit) ON DELETE CASCADE,
    FOREIGN KEY (id_matiere) REFERENCES MatierePremiere(id_matiere) ON DELETE CASCADE,
    UNIQUE(id_produit, id_matiere)
);

CREATE TABLE Production (
    id_production INTEGER PRIMARY KEY AUTOINCREMENT,
    id_produit INTEGER NOT NULL,
    quantite_produite REAL NOT NULL CHECK (quantite_produite > 0),
    date_production TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    operateur VARCHAR(100),
    commentaire TEXT,
    FOREIGN KEY (id_produit) REFERENCES Produit(id_produit)
);

CREATE TABLE Inventaire (
    id_inventaire INTEGER PRIMARY KEY AUTOINCREMENT,
    date_inventaire TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responsable VARCHAR(100) NOT NULL,
    statut VARCHAR(20) DEFAULT 'En cours',
    commentaire TEXT
);

CREATE TABLE InventaireMatiere (
    id_ligne_inv INTEGER PRIMARY KEY AUTOINCREMENT,
    id_inventaire INTEGER NOT NULL,
    id_matiere INTEGER NOT NULL,
    stock_theorique REAL NOT NULL,
    stock_physique REAL NOT NULL CHECK (stock_physique >= 0),
    FOREIGN KEY (id_inventaire) REFERENCES Inventaire(id_inventaire) ON DELETE CASCADE,
    FOREIGN KEY (id_matiere) REFERENCES MatierePremiere(id_matiere)
);

CREATE TABLE InventaireProduit (
    id_ligne_inv INTEGER PRIMARY KEY AUTOINCREMENT,
    id_inventaire INTEGER NOT NULL,
    id_produit INTEGER NOT NULL,
    stock_theorique REAL NOT NULL,
    stock_physique REAL NOT NULL CHECK (stock_physique >= 0),
    FOREIGN KEY (id_inventaire) REFERENCES Inventaire(id_inventaire) ON DELETE CASCADE,
    FOREIGN KEY (id_produit) REFERENCES Produit(id_produit)
);

CREATE TABLE AjustementStock (
    id_ajustement INTEGER PRIMARY KEY AUTOINCREMENT,
    type_article VARCHAR(20) NOT NULL CHECK (type_article IN ('MATIERE', 'PRODUIT')),
    id_article INTEGER NOT NULL,
    type_ajustement VARCHAR(50) NOT NULL,
    quantite_avant REAL NOT NULL,
    quantite_ajustee REAL NOT NULL,
    quantite_apres REAL NOT NULL CHECK (quantite_apres >= 0),
    date_ajustement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responsable VARCHAR(100) NOT NULL,
    motif TEXT NOT NULL,
    id_inventaire INTEGER,
    FOREIGN KEY (id_inventaire) REFERENCES Inventaire(id_inventaire)
);

-- ============================================================
-- 2. TRIGGERS
-- ============================================================

CREATE TRIGGER after_facture_validate
AFTER UPDATE OF statut ON Facture
WHEN NEW.statut = 'Validée' AND OLD.statut != 'Validée'
BEGIN
    UPDATE Produit
    SET stock_actuel = stock_actuel - (
        SELECT SUM(lf.quantite)
        FROM LigneFacture lf
        WHERE lf.id_facture = NEW.id_facture AND lf.id_produit = Produit.id_produit
    )
    WHERE id_produit IN (
        SELECT id_produit FROM LigneFacture WHERE id_facture = NEW.id_facture
    );
END;

CREATE TRIGGER after_production_insert 
AFTER INSERT ON Production 
BEGIN
    UPDATE MatierePremiere 
    SET stock_actuel = stock_actuel - (
        SELECT (r.quantite_necessaire + 0.0) * (NEW.quantite_produite + 0.0)
        FROM RecetteProduction r 
        WHERE r.id_matiere = MatierePremiere.id_matiere 
        AND r.id_produit = NEW.id_produit
    )
    WHERE EXISTS (
        SELECT 1 
        FROM RecetteProduction r 
        WHERE r.id_matiere = MatierePremiere.id_matiere 
        AND r.id_produit = NEW.id_produit
    );
    
    UPDATE Produit 
    SET stock_actuel = stock_actuel + (NEW.quantite_produite + 0.0)
    WHERE id_produit = NEW.id_produit;
END;

CREATE TRIGGER after_paiement_insert
AFTER INSERT ON Paiement
BEGIN
    UPDATE Facture
    SET 
        montant_paye = montant_paye + NEW.montant_paye,
        statut = CASE
            WHEN montant_paye + NEW.montant_paye >= (
                SELECT SUM((quantite * prix_unitaire_ht * (1 - remise_ligne/100)) * (1 + taux_tva/100))
                FROM LigneFacture WHERE id_facture = NEW.id_facture
            ) THEN 'Payée'
            ELSE 'Partiellement payée'
        END
    WHERE id_facture = NEW.id_facture;
END;

-- ============================================================
-- 3. VUES
-- ============================================================

CREATE VIEW Vue_DevisTotaux AS
SELECT 
    d.id_devis,
    d.numero_devis,
    c.nom AS client,
    d.date_devis,
    d.date_validite,
    d.statut,
    ROUND(SUM(ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100)), 2) AS montant_ht,
    ROUND(SUM(ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100) * ld.taux_tva/100), 2) AS montant_tva,
    ROUND(SUM(ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100) * (1 + ld.taux_tva/100)), 2) AS montant_ttc,
    d.remise_globale
FROM Devis d
JOIN Client c ON d.id_client = c.id_client
LEFT JOIN LigneDevis ld ON d.id_devis = ld.id_devis
GROUP BY d.id_devis;

CREATE VIEW Vue_FactureTotaux AS
SELECT 
    f.id_facture,
    f.numero_facture,
    c.nom AS client,
    f.date_facture,
    f.date_echeance,
    f.statut,
    ROUND(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100)), 2) AS montant_ht,
    ROUND(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100) * lf.taux_tva/100), 2) AS montant_tva,
    ROUND(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100) * (1 + lf.taux_tva/100)), 2) AS montant_ttc,
    f.montant_paye,
    ROUND(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100) * (1 + lf.taux_tva/100)) - f.montant_paye, 2) AS montant_restant
FROM Facture f
JOIN Client c ON f.id_client = c.id_client
LEFT JOIN LigneFacture lf ON f.id_facture = lf.id_facture
GROUP BY f.id_facture;

CREATE VIEW Vue_FacturesCredit AS
SELECT 
    vf.*,
    c.telephone,
    CASE 
        WHEN vf.date_echeance IS NULL THEN 'Pas de date limite'
        WHEN vf.date_echeance < DATE('now') AND vf.montant_restant > 0 THEN '🔴 EN RETARD'
        WHEN vf.date_echeance <= DATE('now', '+7 days') AND vf.montant_restant > 0 THEN '🟠 URGENT'
        WHEN vf.montant_restant > 0 THEN '🟡 EN COURS'
        ELSE '✅ PAYÉE'
    END AS statut_paiement,
    CAST((julianday('now') - julianday(vf.date_echeance)) AS INTEGER) AS jours_retard
FROM Vue_FactureTotaux vf
JOIN Client c ON vf.client = c.nom
WHERE vf.montant_restant > 0
ORDER BY vf.date_echeance ASC;

CREATE VIEW Vue_CreditsClients AS
SELECT 
    c.id_client,
    c.nom AS client,
    c.telephone,
    COUNT(vf.id_facture) AS nb_factures_credit,
    ROUND(SUM(vf.montant_ttc), 2) AS total_achats,
    ROUND(SUM(vf.montant_paye), 2) AS total_paye,
    ROUND(SUM(vf.montant_restant), 2) AS credit_restant,
    MIN(vf.date_echeance) AS prochaine_echeance
FROM Client c
JOIN Vue_FactureTotaux vf ON c.nom = vf.client
WHERE vf.montant_restant > 0
GROUP BY c.id_client
ORDER BY credit_restant DESC;

CREATE VIEW Vue_AlerteStock AS
SELECT 
    id_matiere,
    nom,
    unite,
    stock_actuel,
    stock_minimum,
    ROUND((stock_actuel - stock_minimum), 2) AS difference,
    CASE 
        WHEN stock_actuel < stock_minimum THEN '🔴 ALERTE'
        WHEN stock_actuel < (stock_minimum * 1.2) THEN '🟠 ATTENTION'
        ELSE '✅ OK'
    END AS statut_stock
FROM MatierePremiere
WHERE stock_minimum > 0
ORDER BY (stock_actuel / NULLIF(stock_minimum, 1));

CREATE VIEW Vue_EcartInventaireMatiere AS
SELECT 
    im.id_ligne_inv,
    i.id_inventaire,
    i.date_inventaire,
    i.responsable,
    m.nom AS matiere,
    m.unite,
    im.stock_theorique,
    im.stock_physique,
    ROUND(im.stock_physique - im.stock_theorique, 2) AS ecart,
    CASE 
        WHEN im.stock_theorique = 0 THEN 0
        ELSE ROUND(((im.stock_physique - im.stock_theorique) * 100.0 / im.stock_theorique), 2)
    END AS ecart_pourcent
FROM InventaireMatiere im
JOIN Inventaire i ON im.id_inventaire = i.id_inventaire
JOIN MatierePremiere m ON im.id_matiere = m.id_matiere;

CREATE VIEW Vue_EcartInventaireProduit AS
SELECT 
    ip.id_ligne_inv,
    i.id_inventaire,
    i.date_inventaire,
    i.responsable,
    p.nom AS produit,
    p.unite,
    ip.stock_theorique,
    ip.stock_physique,
    ROUND(ip.stock_physique - ip.stock_theorique, 2) AS ecart,
    CASE 
        WHEN ip.stock_theorique = 0 THEN 0
        ELSE ROUND(((ip.stock_physique - ip.stock_theorique) * 100.0 / ip.stock_theorique), 2)
    END AS ecart_pourcent
FROM InventaireProduit ip
JOIN Inventaire i ON ip.id_inventaire = i.id_inventaire
JOIN Produit p ON ip.id_produit = p.id_produit;

-- ============================================================
-- 4. INDEX
-- ============================================================

CREATE INDEX idx_devis_client ON Devis(id_client);
CREATE INDEX idx_devis_statut ON Devis(statut);
CREATE INDEX idx_ligne_devis_devis ON LigneDevis(id_devis);
CREATE INDEX idx_facture_client ON Facture(id_client);
CREATE INDEX idx_facture_statut ON Facture(statut);
CREATE INDEX idx_ligne_facture_facture ON LigneFacture(id_facture);
CREATE INDEX idx_paiement_facture ON Paiement(id_facture);
CREATE INDEX idx_recette_produit ON RecetteProduction(id_produit);
CREATE INDEX idx_production_produit ON Production(id_produit);
CREATE INDEX idx_production_date ON Production(date_production);

-- ============================================================
-- SYSTÈME D'AUTHENTIFICATION ET GESTION DES RÔLES
-- À ajouter au début de votre schema.sql existant
-- ============================================================

-- Nettoyage des tables d'authentification
DROP TABLE IF EXISTS UtilisateurPermission;
DROP TABLE IF EXISTS RolePermission;
DROP TABLE IF EXISTS Utilisateur;
DROP TABLE IF EXISTS Role;
DROP TABLE IF EXISTS Permission;
DROP TABLE IF EXISTS SessionToken;

-- ============================================================
-- TABLES D'AUTHENTIFICATION
-- ============================================================

-- Table des rôles
CREATE TABLE Role (
    id_role INTEGER PRIMARY KEY AUTOINCREMENT,
    nom VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des permissions
CREATE TABLE Permission (
    id_permission INTEGER PRIMARY KEY AUTOINCREMENT,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE Utilisateur (
    id_utilisateur INTEGER PRIMARY KEY AUTOINCREMENT,
    nom_utilisateur VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    nom_complet VARCHAR(100) NOT NULL,
    id_role INTEGER NOT NULL,
    actif BOOLEAN DEFAULT 1,
    derniere_connexion TIMESTAMP,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP,
    FOREIGN KEY (id_role) REFERENCES Role(id_role)
);

-- Table de liaison Role-Permission
CREATE TABLE RolePermission (
    id_role INTEGER NOT NULL,
    id_permission INTEGER NOT NULL,
    date_attribution TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_role, id_permission),
    FOREIGN KEY (id_role) REFERENCES Role(id_role) ON DELETE CASCADE,
    FOREIGN KEY (id_permission) REFERENCES Permission(id_permission) ON DELETE CASCADE
);

-- Table de liaison Utilisateur-Permission (permissions individuelles)
CREATE TABLE UtilisateurPermission (
    id_utilisateur INTEGER NOT NULL,
    id_permission INTEGER NOT NULL,
    date_attribution TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_utilisateur, id_permission),
    FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE,
    FOREIGN KEY (id_permission) REFERENCES Permission(id_permission) ON DELETE CASCADE
);

-- Table pour gérer les tokens de session (optionnel, pour invalidation)
CREATE TABLE SessionToken (
    id_session INTEGER PRIMARY KEY AUTOINCREMENT,
    id_utilisateur INTEGER NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_expiration TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    actif BOOLEAN DEFAULT 1,
    FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE
);

-- ============================================================
-- INDEX POUR PERFORMANCES
-- ============================================================

CREATE INDEX idx_utilisateur_email ON Utilisateur(email);
CREATE INDEX idx_utilisateur_nom ON Utilisateur(nom_utilisateur);
CREATE INDEX idx_utilisateur_role ON Utilisateur(id_role);
CREATE INDEX idx_session_token ON SessionToken(token_hash);
CREATE INDEX idx_session_utilisateur ON SessionToken(id_utilisateur);
CREATE INDEX idx_session_expiration ON SessionToken(date_expiration);

-- ============================================================
-- VUE POUR FACILITER LES REQUÊTES
-- ============================================================

CREATE VIEW Vue_UtilisateursComplet AS
SELECT 
    u.id_utilisateur,
    u.nom_utilisateur,
    u.email,
    u.nom_complet,
    r.nom AS role,
    r.description AS role_description,
    u.actif,
    u.derniere_connexion,
    u.date_creation,
    GROUP_CONCAT(DISTINCT p.nom) AS permissions
FROM Utilisateur u
JOIN Role r ON u.id_role = r.id_role
LEFT JOIN RolePermission rp ON r.id_role = rp.id_role
LEFT JOIN Permission p ON rp.id_permission = p.id_permission
GROUP BY u.id_utilisateur;

-- ============================================================
-- DONNÉES INITIALES
-- ============================================================

-- Insertion des rôles par défaut
INSERT INTO Role (nom, description) VALUES
    ('ADMIN', 'Administrateur système avec tous les droits'),
    ('GESTIONNAIRE', 'Gestionnaire avec droits étendus'),
    ('VENDEUR', 'Vendeur avec accès limité aux ventes'),
    ('MAGASINIER', 'Responsable du stock et de la production'),
    ('LECTEUR', 'Accès en lecture seule');

-- Insertion des permissions par module
INSERT INTO Permission (nom, description, module) VALUES
    -- Gestion des utilisateurs
    ('users.read', 'Voir les utilisateurs', 'utilisateurs'),
    ('users.create', 'Créer des utilisateurs', 'utilisateurs'),
    ('users.update', 'Modifier des utilisateurs', 'utilisateurs'),
    ('users.delete', 'Supprimer des utilisateurs', 'utilisateurs'),
    
    -- Gestion des clients
    ('clients.read', 'Voir les clients', 'clients'),
    ('clients.create', 'Créer des clients', 'clients'),
    ('clients.update', 'Modifier des clients', 'clients'),
    ('clients.delete', 'Supprimer des clients', 'clients'),
    
    -- Gestion des produits
    ('produits.read', 'Voir les produits', 'produits'),
    ('produits.create', 'Créer des produits', 'produits'),
    ('produits.update', 'Modifier des produits', 'produits'),
    ('produits.delete', 'Supprimer des produits', 'produits'),
    
    -- Gestion des matières premières
    ('matieres.read', 'Voir les matières premières', 'matieres'),
    ('matieres.create', 'Créer des matières premières', 'matieres'),
    ('matieres.update', 'Modifier des matières premières', 'matieres'),
    ('matieres.delete', 'Supprimer des matières premières', 'matieres'),
    
    -- Gestion des devis
    ('devis.read', 'Voir les devis', 'devis'),
    ('devis.create', 'Créer des devis', 'devis'),
    ('devis.update', 'Modifier des devis', 'devis'),
    ('devis.delete', 'Supprimer des devis', 'devis'),
    ('devis.validate', 'Valider des devis', 'devis'),
    
    -- Gestion des factures
    ('factures.read', 'Voir les factures', 'factures'),
    ('factures.create', 'Créer des factures', 'factures'),
    ('factures.update', 'Modifier des factures', 'factures'),
    ('factures.delete', 'Supprimer des factures', 'factures'),
    ('factures.validate', 'Valider des factures', 'factures'),
    
    -- Gestion des paiements
    ('paiements.read', 'Voir les paiements', 'paiements'),
    ('paiements.create', 'Enregistrer des paiements', 'paiements'),
    ('paiements.delete', 'Supprimer des paiements', 'paiements'),
    
    -- Gestion de la production
    ('production.read', 'Voir la production', 'production'),
    ('production.create', 'Créer des productions', 'production'),
    ('production.update', 'Modifier des productions', 'production'),
    ('production.delete', 'Supprimer des productions', 'production'),
    
    -- Gestion des inventaires
    ('inventaires.read', 'Voir les inventaires', 'inventaires'),
    ('inventaires.create', 'Créer des inventaires', 'inventaires'),
    ('inventaires.update', 'Modifier des inventaires', 'inventaires'),
    ('inventaires.validate', 'Valider des inventaires', 'inventaires'),
    
    -- Rapports et statistiques
    ('rapports.view', 'Voir les rapports', 'rapports'),
    ('rapports.export', 'Exporter les rapports', 'rapports'),
    
    -- Paramètres système
    ('settings.read', 'Voir les paramètres', 'parametres'),
    ('settings.update', 'Modifier les paramètres', 'parametres');

-- Attribution des permissions au rôle ADMIN (toutes les permissions)
INSERT INTO RolePermission (id_role, id_permission)
SELECT 1, id_permission FROM Permission;

-- Attribution des permissions au rôle GESTIONNAIRE
INSERT INTO RolePermission (id_role, id_permission)
SELECT 2, id_permission FROM Permission
WHERE nom NOT LIKE 'users.%' AND nom NOT LIKE 'settings.%';

-- Attribution des permissions au rôle VENDEUR
INSERT INTO RolePermission (id_role, id_permission)
SELECT 3, id_permission FROM Permission
WHERE nom IN (
    'clients.read', 'clients.create', 'clients.update',
    'produits.read',
    'devis.read', 'devis.create', 'devis.update',
    'factures.read', 'factures.create',
    'paiements.read', 'paiements.create',
    'rapports.view'
);

-- Attribution des permissions au rôle MAGASINIER
INSERT INTO RolePermission (id_role, id_permission)
SELECT 4, id_permission FROM Permission
WHERE nom IN (
    'produits.read', 'produits.update',
    'matieres.read', 'matieres.create', 'matieres.update',
    'production.read', 'production.create',
    'inventaires.read', 'inventaires.create', 'inventaires.update', 'inventaires.validate',
    'rapports.view'
);

-- Attribution des permissions au rôle LECTEUR
INSERT INTO RolePermission (id_role, id_permission)
SELECT 5, id_permission FROM Permission
WHERE nom LIKE '%.read' OR nom = 'rapports.view';