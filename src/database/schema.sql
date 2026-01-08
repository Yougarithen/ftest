-- ============================================================
-- SCHÉMA POSTGRESQL COMPLET - Converti depuis SQLite
-- ============================================================

-- Supprimer les tables existantes si nécessaire (avec CASCADE)
DROP TABLE IF EXISTS UtilisateurPermission CASCADE;
DROP TABLE IF EXISTS RolePermission CASCADE;
DROP TABLE IF EXISTS SessionToken CASCADE;
DROP TABLE IF EXISTS TentativeConnexion CASCADE;
DROP TABLE IF EXISTS JournalActivite CASCADE;
DROP TABLE IF EXISTS ConfigurationSecurite CASCADE;
DROP TABLE IF EXISTS Permission CASCADE;
DROP TABLE IF EXISTS Utilisateur CASCADE;
DROP TABLE IF EXISTS Role CASCADE;
DROP TABLE IF EXISTS AjustementStock CASCADE;
DROP TABLE IF EXISTS InventaireMatiere CASCADE;
DROP TABLE IF EXISTS InventaireProduit CASCADE;
DROP TABLE IF EXISTS Inventaire CASCADE;
DROP TABLE IF EXISTS Paiement CASCADE;
DROP TABLE IF EXISTS LigneFacture CASCADE;
DROP TABLE IF EXISTS LigneDevis CASCADE;
DROP TABLE IF EXISTS Facture CASCADE;
DROP TABLE IF EXISTS Devis CASCADE;
DROP TABLE IF EXISTS Production CASCADE;
DROP TABLE IF EXISTS RecetteProduction CASCADE;
DROP TABLE IF EXISTS Produit CASCADE;
DROP TABLE IF EXISTS MatierePremiere CASCADE;
DROP TABLE IF EXISTS Client CASCADE;

-- ============================================================
-- TABLES PRINCIPALES
-- ============================================================

-- Table Client
CREATE TABLE Client (
    id_client SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    typeC VARCHAR(25) NOT NULL,
    numero_rc VARCHAR(50),
    nif VARCHAR(50),
    n_article VARCHAR(50),
    adresse TEXT,
    contact VARCHAR(100),
    telephone VARCHAR(20),
    email VARCHAR(100),
    assujetti_tva BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table MatierePremiere
CREATE TABLE MatierePremiere (
    id_matiere SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    unite VARCHAR(20) NOT NULL,
    typeM VARCHAR(20) NOT NULL,
    stock_actuel NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (stock_actuel >= 0),
    stock_minimum NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (stock_minimum >= 0),
    prix_unitaire NUMERIC(10,2),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Produit
CREATE TABLE Produit (
    id_produit SERIAL PRIMARY KEY,
    code_produit VARCHAR(50) UNIQUE,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    unite VARCHAR(20) NOT NULL,
    poids NUMERIC(10,2) CHECK (poids >= 0 OR poids IS NULL),
    unite_poids VARCHAR(10) DEFAULT 'kg',
    stock_actuel NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (stock_actuel >= 0),
    prix_vente_suggere NUMERIC(10,2),
    taux_tva NUMERIC(5,2) DEFAULT 19.00 CHECK (taux_tva >= 0 AND taux_tva <= 100),
    soumis_taxe BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table RecetteProduction
CREATE TABLE RecetteProduction (
    id_recette SERIAL PRIMARY KEY,
    id_produit INTEGER NOT NULL,
    id_matiere INTEGER NOT NULL,
    quantite_necessaire NUMERIC(10,2) NOT NULL CHECK (quantite_necessaire > 0),
    FOREIGN KEY (id_produit) REFERENCES Produit(id_produit) ON DELETE CASCADE,
    FOREIGN KEY (id_matiere) REFERENCES MatierePremiere(id_matiere) ON DELETE CASCADE,
    UNIQUE(id_produit, id_matiere)
);

-- Table Production
CREATE TABLE Production (
    id_production SERIAL PRIMARY KEY,
    id_produit INTEGER NOT NULL,
    quantite_produite NUMERIC(10,2) NOT NULL CHECK (quantite_produite > 0),
    date_production TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    operateur VARCHAR(100),
    commentaire TEXT,
    FOREIGN KEY (id_produit) REFERENCES Produit(id_produit)
);

-- Table Devis
CREATE TABLE Devis (
    id_devis SERIAL PRIMARY KEY,
    numero_devis VARCHAR(50) UNIQUE NOT NULL,
    id_client INTEGER NOT NULL,
    date_devis DATE DEFAULT CURRENT_DATE,
    date_validite DATE,
    statut VARCHAR(20) DEFAULT 'Brouillon',
    remise_globale NUMERIC(5,2) DEFAULT 0 CHECK (remise_globale >= 0 AND remise_globale <= 100),
    conditions_paiement TEXT,
    notes TEXT,
    id_facture INTEGER,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP,
    FOREIGN KEY (id_client) REFERENCES Client(id_client)
);

-- Table Facture
CREATE TABLE Facture (
    id_facture SERIAL PRIMARY KEY,
    numero_facture VARCHAR(50) UNIQUE NOT NULL,
    id_client INTEGER NOT NULL,
    id_devis INTEGER,
    date_facture DATE DEFAULT CURRENT_DATE,
    date_echeance DATE,
    statut VARCHAR(20) DEFAULT 'Brouillon',
    type_facture VARCHAR(20) DEFAULT 'STANDARD',
    remise_globale NUMERIC(5,2) DEFAULT 0 CHECK (remise_globale >= 0 AND remise_globale <= 100),
    montant_paye NUMERIC(10,2) DEFAULT 0 CHECK (montant_paye >= 0),
    conditions_paiement TEXT,
    notes TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP,
    date_validation TIMESTAMP,
    FOREIGN KEY (id_client) REFERENCES Client(id_client),
    FOREIGN KEY (id_devis) REFERENCES Devis(id_devis)
);

-- Table LigneDevis
CREATE TABLE LigneDevis (
    id_ligne SERIAL PRIMARY KEY,
    id_devis INTEGER NOT NULL,
    id_produit INTEGER NOT NULL,
    quantite NUMERIC(10,2) NOT NULL CHECK (quantite > 0),
    unite_vente VARCHAR(20) NOT NULL,
    prix_unitaire_ht NUMERIC(10,2) NOT NULL CHECK (prix_unitaire_ht >= 0),
    taux_tva NUMERIC(5,2) NOT NULL CHECK (taux_tva >= 0 AND taux_tva <= 100),
    remise_ligne NUMERIC(5,2) DEFAULT 0 CHECK (remise_ligne >= 0 AND remise_ligne <= 100),
    description TEXT,
    FOREIGN KEY (id_devis) REFERENCES Devis(id_devis) ON DELETE CASCADE,
    FOREIGN KEY (id_produit) REFERENCES Produit(id_produit)
);

-- Table LigneFacture
CREATE TABLE LigneFacture (
    id_ligne SERIAL PRIMARY KEY,
    id_facture INTEGER NOT NULL,
    id_produit INTEGER NOT NULL,
    quantite NUMERIC(10,2) NOT NULL CHECK (quantite > 0),
    unite_vente VARCHAR(20) NOT NULL,
    prix_unitaire_ht NUMERIC(10,2) NOT NULL CHECK (prix_unitaire_ht >= 0),
    taux_tva NUMERIC(5,2) NOT NULL CHECK (taux_tva >= 0 AND taux_tva <= 100),
    remise_ligne NUMERIC(5,2) DEFAULT 0 CHECK (remise_ligne >= 0 AND remise_ligne <= 100),
    description TEXT,
    FOREIGN KEY (id_facture) REFERENCES Facture(id_facture) ON DELETE CASCADE,
    FOREIGN KEY (id_produit) REFERENCES Produit(id_produit)
);

-- Table Paiement
CREATE TABLE Paiement (
    id_paiement SERIAL PRIMARY KEY,
    id_facture INTEGER NOT NULL,
    montant_paye NUMERIC(10,2) NOT NULL CHECK (montant_paye > 0),
    date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mode_paiement VARCHAR(50),
    reference VARCHAR(100),
    responsable VARCHAR(100),
    commentaire TEXT,
    FOREIGN KEY (id_facture) REFERENCES Facture(id_facture) ON DELETE CASCADE
);

-- Table Inventaire
CREATE TABLE Inventaire (
    id_inventaire SERIAL PRIMARY KEY,
    date_inventaire TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responsable VARCHAR(100) NOT NULL,
    statut VARCHAR(20) DEFAULT 'En cours',
    commentaire TEXT
);

-- Table InventaireMatiere
CREATE TABLE InventaireMatiere (
    id_ligne_inv SERIAL PRIMARY KEY,
    id_inventaire INTEGER NOT NULL,
    id_matiere INTEGER NOT NULL,
    stock_theorique NUMERIC(10,2) NOT NULL,
    stock_physique NUMERIC(10,2) NOT NULL CHECK (stock_physique >= 0),
    FOREIGN KEY (id_inventaire) REFERENCES Inventaire(id_inventaire) ON DELETE CASCADE,
    FOREIGN KEY (id_matiere) REFERENCES MatierePremiere(id_matiere)
);

-- Table InventaireProduit
CREATE TABLE InventaireProduit (
    id_ligne_inv SERIAL PRIMARY KEY,
    id_inventaire INTEGER NOT NULL,
    id_produit INTEGER NOT NULL,
    stock_theorique NUMERIC(10,2) NOT NULL,
    stock_physique NUMERIC(10,2) NOT NULL CHECK (stock_physique >= 0),
    FOREIGN KEY (id_inventaire) REFERENCES Inventaire(id_inventaire) ON DELETE CASCADE,
    FOREIGN KEY (id_produit) REFERENCES Produit(id_produit)
);

-- Table AjustementStock
CREATE TABLE AjustementStock (
    id_ajustement SERIAL PRIMARY KEY,
    type_article VARCHAR(20) NOT NULL CHECK (type_article IN ('MATIERE', 'PRODUIT')),
    id_article INTEGER NOT NULL,
    type_ajustement VARCHAR(50) NOT NULL,
    quantite_avant NUMERIC(10,2) NOT NULL,
    quantite_ajustee NUMERIC(10,2) NOT NULL,
    quantite_apres NUMERIC(10,2) NOT NULL CHECK (quantite_apres >= 0),
    date_ajustement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responsable VARCHAR(100) NOT NULL,
    motif TEXT NOT NULL,
    id_inventaire INTEGER,
    FOREIGN KEY (id_inventaire) REFERENCES Inventaire(id_inventaire)
);

-- ============================================================
-- TABLES AUTHENTIFICATION ET SÉCURITÉ
-- ============================================================

-- Table Role
CREATE TABLE Role (
    id_role SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Permission
CREATE TABLE Permission (
    id_permission SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Utilisateur
CREATE TABLE Utilisateur (
    id_utilisateur SERIAL PRIMARY KEY,
    nom_utilisateur VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    nom_complet VARCHAR(100) NOT NULL,
    id_role INTEGER NOT NULL,
    actif BOOLEAN DEFAULT TRUE,
    derniere_connexion TIMESTAMP,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP,
    FOREIGN KEY (id_role) REFERENCES Role(id_role)
);

-- Table RolePermission
CREATE TABLE RolePermission (
    id_role INTEGER NOT NULL,
    id_permission INTEGER NOT NULL,
    date_attribution TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_role, id_permission),
    FOREIGN KEY (id_role) REFERENCES Role(id_role) ON DELETE CASCADE,
    FOREIGN KEY (id_permission) REFERENCES Permission(id_permission) ON DELETE CASCADE
);

-- Table UtilisateurPermission
CREATE TABLE UtilisateurPermission (
    id_utilisateur INTEGER NOT NULL,
    id_permission INTEGER NOT NULL,
    date_attribution TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_utilisateur, id_permission),
    FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE,
    FOREIGN KEY (id_permission) REFERENCES Permission(id_permission) ON DELETE CASCADE
);

-- Table SessionToken
CREATE TABLE SessionToken (
    id_session SERIAL PRIMARY KEY,
    id_utilisateur INTEGER NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_expiration TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    actif BOOLEAN DEFAULT TRUE,
    date_derniere_activite TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE
);

-- Table TentativeConnexion
CREATE TABLE TentativeConnexion (
    id_tentative SERIAL PRIMARY KEY,
    identifiant VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    succes BOOLEAN DEFAULT FALSE,
    date_tentative TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raison TEXT,
    id_utilisateur INTEGER
);

-- Table JournalActivite
CREATE TABLE JournalActivite (
    id_journal SERIAL PRIMARY KEY,
    id_utilisateur INTEGER,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
);

-- Table ConfigurationSecurite
CREATE TABLE ConfigurationSecurite (
    id_config SERIAL PRIMARY KEY,
    cle VARCHAR(50) UNIQUE NOT NULL,
    valeur TEXT NOT NULL,
    description TEXT,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEX
-- ============================================================

CREATE INDEX idx_devis_client ON Devis(id_client);
CREATE INDEX idx_devis_statut ON Devis(statut);
CREATE INDEX idx_facture_client ON Facture(id_client);
CREATE INDEX idx_facture_statut ON Facture(statut);
CREATE INDEX idx_ligne_devis_devis ON LigneDevis(id_devis);
CREATE INDEX idx_ligne_facture_facture ON LigneFacture(id_facture);
CREATE INDEX idx_paiement_facture ON Paiement(id_facture);
CREATE INDEX idx_production_date ON Production(date_production);
CREATE INDEX idx_production_produit ON Production(id_produit);
CREATE INDEX idx_recette_produit ON RecetteProduction(id_produit);
CREATE INDEX idx_utilisateur_email ON Utilisateur(email);
CREATE INDEX idx_utilisateur_nom ON Utilisateur(nom_utilisateur);
CREATE INDEX idx_utilisateur_role ON Utilisateur(id_role);
CREATE INDEX idx_session_utilisateur ON SessionToken(id_utilisateur);
CREATE INDEX idx_session_token ON SessionToken(token_hash);
CREATE INDEX idx_session_expiration ON SessionToken(date_expiration);
CREATE INDEX idx_tentative_ip ON TentativeConnexion(ip_address);
CREATE INDEX idx_tentative_date ON TentativeConnexion(date_tentative);
CREATE INDEX idx_journal_utilisateur ON JournalActivite(id_utilisateur);
CREATE INDEX idx_journal_date ON JournalActivite(date_action);

-- ============================================================
-- VUES
-- ============================================================

-- Vue_AlerteStock
CREATE OR REPLACE VIEW Vue_AlerteStock AS
SELECT 
    id_matiere,
    nom,
    unite,
    stock_actuel,
    stock_minimum,
    ROUND((stock_actuel - stock_minimum)::numeric, 2) AS difference,
    CASE 
        WHEN stock_actuel < stock_minimum THEN '🔴 ALERTE'
        WHEN stock_actuel < (stock_minimum * 1.2) THEN '🟠 ATTENTION'
        ELSE '✅ OK'
    END AS statut_stock
FROM MatierePremiere
WHERE stock_minimum > 0
ORDER BY (stock_actuel / NULLIF(stock_minimum, 1));

-- Vue_DevisTotaux
CREATE OR REPLACE VIEW Vue_DevisTotaux AS
SELECT 
    d.id_devis,
    d.numero_devis,
    c.nom AS client,
    d.date_devis,
    d.date_validite,
    d.statut,
    ROUND(SUM(ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100))::numeric, 2) AS montant_ht,
    ROUND(SUM(ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100) * ld.taux_tva/100)::numeric, 2) AS montant_tva,
    ROUND(SUM(ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100) * (1 + ld.taux_tva/100))::numeric, 2) AS montant_ttc,
    d.remise_globale
FROM Devis d
JOIN Client c ON d.id_client = c.id_client
LEFT JOIN LigneDevis ld ON d.id_devis = ld.id_devis
GROUP BY d.id_devis, c.nom;

-- Vue_FactureTotaux
CREATE OR REPLACE VIEW Vue_FactureTotaux AS
SELECT 
    f.id_facture,
    f.numero_facture,
    c.nom AS client,
    f.date_facture,
    f.date_echeance,
    f.statut,
    ROUND(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100))::numeric, 2) AS montant_ht,
    ROUND(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100) * lf.taux_tva/100)::numeric, 2) AS montant_tva,
    ROUND(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100) * (1 + lf.taux_tva/100))::numeric, 2) AS montant_ttc,
    f.montant_paye,
    ROUND((SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100) * (1 + lf.taux_tva/100)) - f.montant_paye)::numeric, 2) AS montant_restant
FROM Facture f
JOIN Client c ON f.id_client = c.id_client
LEFT JOIN LigneFacture lf ON f.id_facture = lf.id_facture
GROUP BY f.id_facture, c.nom;

-- Vue_FacturesCredit
CREATE OR REPLACE VIEW Vue_FacturesCredit AS
SELECT 
    vf.*,
    c.telephone,
    CASE 
        WHEN vf.date_echeance IS NULL THEN 'Pas de date limite'
        WHEN vf.date_echeance < CURRENT_DATE AND vf.montant_restant > 0 THEN '🔴 EN RETARD'
        WHEN vf.date_echeance <= CURRENT_DATE + INTERVAL '7 days' AND vf.montant_restant > 0 THEN '🟠 URGENT'
        WHEN vf.montant_restant > 0 THEN '🟡 EN COURS'
        ELSE '✅ PAYÉE'
    END AS statut_paiement,
    EXTRACT(DAY FROM CURRENT_DATE - vf.date_echeance)::INTEGER AS jours_retard
FROM Vue_FactureTotaux vf
JOIN Client c ON vf.client = c.nom
WHERE vf.montant_restant > 0
ORDER BY vf.date_echeance ASC;

-- Vue_CreditsClients
CREATE OR REPLACE VIEW Vue_CreditsClients AS
SELECT 
    c.id_client,
    c.nom AS client,
    c.telephone,
    COUNT(vf.id_facture) AS nb_factures_credit,
    ROUND(SUM(vf.montant_ttc)::numeric, 2) AS total_achats,
    ROUND(SUM(vf.montant_paye)::numeric, 2) AS total_paye,
    ROUND(SUM(vf.montant_restant)::numeric, 2) AS credit_restant,
    MIN(vf.date_echeance) AS prochaine_echeance
FROM Client c
JOIN Vue_FactureTotaux vf ON c.nom = vf.client
WHERE vf.montant_restant > 0
GROUP BY c.id_client
ORDER BY credit_restant DESC;

-- Vue_EcartInventaireMatiere
CREATE OR REPLACE VIEW Vue_EcartInventaireMatiere AS
SELECT 
    im.id_ligne_inv,
    i.id_inventaire,
    i.date_inventaire,
    i.responsable,
    m.nom AS matiere,
    m.unite,
    im.stock_theorique,
    im.stock_physique,
    ROUND((im.stock_physique - im.stock_theorique)::numeric, 2) AS ecart,
    CASE 
        WHEN im.stock_theorique = 0 THEN 0
        ELSE ROUND((((im.stock_physique - im.stock_theorique) * 100.0 / im.stock_theorique))::numeric, 2)
    END AS ecart_pourcent
FROM InventaireMatiere im
JOIN Inventaire i ON im.id_inventaire = i.id_inventaire
JOIN MatierePremiere m ON im.id_matiere = m.id_matiere;

-- Vue_EcartInventaireProduit
CREATE OR REPLACE VIEW Vue_EcartInventaireProduit AS
SELECT 
    ip.id_ligne_inv,
    i.id_inventaire,
    i.date_inventaire,
    i.responsable,
    p.nom AS produit,
    p.unite,
    ip.stock_theorique,
    ip.stock_physique,
    ROUND((ip.stock_physique - ip.stock_theorique)::numeric, 2) AS ecart,
    CASE 
        WHEN ip.stock_theorique = 0 THEN 0
        ELSE ROUND((((ip.stock_physique - ip.stock_theorique) * 100.0 / ip.stock_theorique))::numeric, 2)
    END AS ecart_pourcent
FROM InventaireProduit ip
JOIN Inventaire i ON ip.id_inventaire = i.id_inventaire
JOIN Produit p ON ip.id_produit = p.id_produit;

-- Vue_UtilisateursComplet
CREATE OR REPLACE VIEW Vue_UtilisateursComplet AS
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
    STRING_AGG(DISTINCT p.nom, ', ') AS permissions
FROM Utilisateur u
JOIN Role r ON u.id_role = r.id_role
LEFT JOIN RolePermission rp ON r.id_role = rp.id_role
LEFT JOIN Permission p ON rp.id_permission = p.id_permission
GROUP BY u.id_utilisateur, r.nom, r.description;

-- ============================================================
-- TRIGGERS POSTGRESQL
-- ============================================================

-- Trigger: Déduction stock après validation facture
CREATE OR REPLACE FUNCTION after_facture_validate()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut = 'Validée' AND OLD.statut != 'Validée' THEN
        UPDATE Produit
        SET stock_actuel = stock_actuel - COALESCE((
            SELECT SUM(lf.quantite)
            FROM LigneFacture lf
            WHERE lf.id_facture = NEW.id_facture AND lf.id_produit = Produit.id_produit
        ), 0)
        WHERE id_produit IN (
            SELECT id_produit FROM LigneFacture WHERE id_facture = NEW.id_facture
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_facture_validate
AFTER UPDATE OF statut ON Facture
FOR EACH ROW
EXECUTE FUNCTION after_facture_validate();

-- Trigger: Mise à jour montant payé après paiement
CREATE OR REPLACE FUNCTION after_paiement_insert()
RETURNS TRIGGER AS $$
DECLARE
    montant_total NUMERIC(10,2);
BEGIN
    -- Calculer le montant total de la facture
    SELECT COALESCE(SUM((quantite * prix_unitaire_ht * (1 - remise_ligne/100)) * (1 + taux_tva/100)), 0)
    INTO montant_total
    FROM LigneFacture
    WHERE id_facture = NEW.id_facture;
    
    -- Mettre à jour la facture
    UPDATE Facture
    SET 
        montant_paye = montant_paye + NEW.montant_paye,
        statut = CASE
            WHEN montant_paye + NEW.montant_paye >= montant_total THEN 'Payée'
            ELSE 'Partiellement payée'
        END
    WHERE id_facture = NEW.id_facture;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_paiement_insert
AFTER INSERT ON Paiement
FOR EACH ROW
EXECUTE FUNCTION after_paiement_insert();

-- Trigger: Gestion stock après production
CREATE OR REPLACE FUNCTION after_production_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Déduire les matières premières
    UPDATE MatierePremiere 
    SET stock_actuel = stock_actuel - (
        SELECT r.quantite_necessaire * NEW.quantite_produite
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
    
    -- Augmenter le stock du produit fini
    UPDATE Produit 
    SET stock_actuel = stock_actuel + NEW.quantite_produite
    WHERE id_produit = NEW.id_produit;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_production_insert
AFTER INSERT ON Production
FOR EACH ROW
EXECUTE FUNCTION after_production_insert();

-- ============================================================
-- FIN DU SCHÉMA
-- ============================================================

"CREATE TABLE ajustementstock (
  id_ajustement INTEGER NOT NULL DEFAULT nextval('ajustementstock_id_ajustement_seq'::regclass),
  type_article VARCHAR(20) NOT NULL,
  id_article INTEGER NOT NULL,
  type_ajustement VARCHAR(50) NOT NULL,
  quantite_avant NUMERIC(10,2) NOT NULL,
  quantite_ajustee NUMERIC(10,2) NOT NULL,
  quantite_apres NUMERIC(10,2) NOT NULL,
  date_ajustement TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  responsable VARCHAR(100) NOT NULL,
  motif TEXT NOT NULL,
  id_inventaire INTEGER
);
"
"CREATE TABLE bonlivraisonfacture (
  id_liaison INTEGER NOT NULL DEFAULT nextval('bonlivraisonfacture_id_liaison_seq'::regclass),
  id_bon_livraison INTEGER NOT NULL,
  id_facture INTEGER NOT NULL,
  date_liaison TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"
"CREATE TABLE client (
  id_client INTEGER NOT NULL DEFAULT nextval('client_id_client_seq'::regclass),
  nom VARCHAR(100) NOT NULL,
  typec VARCHAR(25) NOT NULL,
  numero_rc VARCHAR(50),
  nif VARCHAR(50),
  n_article VARCHAR(50),
  adresse TEXT,
  contact VARCHAR(100),
  telephone VARCHAR(20),
  email VARCHAR(100),
  assujetti_tva BOOLEAN DEFAULT true,
  date_creation TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"
"CREATE TABLE configurationsecurite (
  id_config INTEGER NOT NULL DEFAULT nextval('configurationsecurite_id_config_seq'::regclass),
  cle VARCHAR(50) NOT NULL,
  valeur TEXT NOT NULL,
  description TEXT,
  date_modification TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"
"CREATE TABLE devis (
  id_devis INTEGER NOT NULL DEFAULT nextval('devis_id_devis_seq'::regclass),
  numero_devis VARCHAR(50) NOT NULL,
  id_client INTEGER NOT NULL,
  date_devis DATE DEFAULT CURRENT_DATE,
  date_validite DATE,
  statut VARCHAR(20) DEFAULT 'Brouillon'::character varying,
  remise_globale NUMERIC(5,2) DEFAULT 0,
  conditions_paiement TEXT,
  notes TEXT,
  id_facture INTEGER,
  date_creation TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP WITHOUT TIME ZONE
);
"
"CREATE TABLE facture (
  id_facture INTEGER NOT NULL DEFAULT nextval('facture_id_facture_seq'::regclass),
  numero_facture VARCHAR(50) NOT NULL,
  id_client INTEGER NOT NULL,
  id_devis INTEGER,
  date_facture DATE DEFAULT CURRENT_DATE,
  date_echeance DATE,
  statut VARCHAR(20) DEFAULT 'Brouillon'::character varying,
  type_facture VARCHAR(20) DEFAULT 'STANDARD'::character varying,
  remise_globale NUMERIC(5,2) DEFAULT 0,
  montant_paye NUMERIC(10,2) DEFAULT 0,
  conditions_paiement TEXT,
  notes TEXT,
  date_creation TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP WITHOUT TIME ZONE,
  date_validation TIMESTAMP WITHOUT TIME ZONE
);
"
"CREATE TABLE inventaire (
  id_inventaire INTEGER NOT NULL DEFAULT nextval('inventaire_id_inventaire_seq'::regclass),
  date_inventaire TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  responsable VARCHAR(100) NOT NULL,
  statut VARCHAR(20) DEFAULT 'En cours'::character varying,
  commentaire TEXT
);
"
"CREATE TABLE inventairematiere (
  id_ligne_inv INTEGER NOT NULL DEFAULT nextval('inventairematiere_id_ligne_inv_seq'::regclass),
  id_inventaire INTEGER NOT NULL,
  id_matiere INTEGER NOT NULL,
  stock_theorique NUMERIC(10,2) NOT NULL,
  stock_physique NUMERIC(10,2) NOT NULL
);
"
"CREATE TABLE inventaireproduit (
  id_ligne_inv INTEGER NOT NULL DEFAULT nextval('inventaireproduit_id_ligne_inv_seq'::regclass),
  id_inventaire INTEGER NOT NULL,
  id_produit INTEGER NOT NULL,
  stock_theorique NUMERIC(10,2) NOT NULL,
  stock_physique NUMERIC(10,2) NOT NULL
);
"
"CREATE TABLE journalactivite (
  id_journal INTEGER NOT NULL DEFAULT nextval('journalactivite_id_journal_seq'::regclass),
  id_utilisateur INTEGER,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  date_action TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"
"CREATE TABLE lignedevis (
  id_ligne INTEGER NOT NULL DEFAULT nextval('lignedevis_id_ligne_seq'::regclass),
  id_devis INTEGER NOT NULL,
  id_produit INTEGER NOT NULL,
  quantite NUMERIC(10,2) NOT NULL,
  unite_vente VARCHAR(20) NOT NULL,
  prix_unitaire_ht NUMERIC(10,2) NOT NULL,
  taux_tva NUMERIC(5,2) NOT NULL,
  remise_ligne NUMERIC(5,2) DEFAULT 0,
  description TEXT
);
"
"CREATE TABLE lignefacture (
  id_ligne INTEGER NOT NULL DEFAULT nextval('lignefacture_id_ligne_seq'::regclass),
  id_facture INTEGER NOT NULL,
  id_produit INTEGER NOT NULL,
  quantite NUMERIC(10,2) NOT NULL,
  unite_vente VARCHAR(20) NOT NULL,
  prix_unitaire_ht NUMERIC(10,2) NOT NULL,
  taux_tva NUMERIC(5,2) NOT NULL,
  remise_ligne NUMERIC(5,2) DEFAULT 0,
  description TEXT
);
"
"CREATE TABLE matierepremiere (
  id_matiere INTEGER NOT NULL DEFAULT nextval('matierepremiere_id_matiere_seq'::regclass),
  nom VARCHAR(100) NOT NULL,
  unite VARCHAR(20) NOT NULL,
  typem VARCHAR(20) NOT NULL,
  stock_actuel NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_minimum NUMERIC(10,2) NOT NULL DEFAULT 0,
  prix_unitaire NUMERIC(10,2),
  date_creation TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"
"CREATE TABLE paiement (
  id_paiement INTEGER NOT NULL DEFAULT nextval('paiement_id_paiement_seq'::regclass),
  id_facture INTEGER NOT NULL,
  montant_paye NUMERIC(10,2) NOT NULL,
  date_paiement TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  mode_paiement VARCHAR(50),
  reference VARCHAR(100),
  responsable VARCHAR(100),
  commentaire TEXT
);
"
"CREATE TABLE permission (
  id_permission INTEGER NOT NULL DEFAULT nextval('permission_id_permission_seq'::regclass),
  nom VARCHAR(100) NOT NULL,
  description TEXT,
  module VARCHAR(50) NOT NULL,
  date_creation TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"
"CREATE TABLE production (
  id_production INTEGER NOT NULL DEFAULT nextval('production_id_production_seq'::regclass),
  id_produit INTEGER NOT NULL,
  quantite_produite NUMERIC(10,2) NOT NULL,
  date_production TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  operateur VARCHAR(100),
  commentaire TEXT
);
"
"CREATE TABLE produit (
  id_produit INTEGER NOT NULL DEFAULT nextval('produit_id_produit_seq'::regclass),
  code_produit VARCHAR(50),
  nom VARCHAR(100) NOT NULL,
  description TEXT,
  unite VARCHAR(20) NOT NULL,
  poids NUMERIC(10,2),
  unite_poids VARCHAR(10) DEFAULT 'kg'::character varying,
  stock_actuel NUMERIC(10,2) NOT NULL DEFAULT 0,
  prix_vente_suggere NUMERIC(10,2),
  taux_tva NUMERIC(5,2) DEFAULT 19.00,
  soumis_taxe BOOLEAN DEFAULT true,
  date_creation TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"
"CREATE TABLE ravitaillement (
  id_ravitaillement INTEGER NOT NULL DEFAULT nextval('ravitaillement_id_ravitaillement_seq'::regclass),
  id_matiere INTEGER NOT NULL,
  quantite NUMERIC(10,2) NOT NULL,
  prix_achat NUMERIC(10,2),
  fournisseur VARCHAR(100),
  numero_bon_livraison VARCHAR(50),
  commentaire TEXT,
  responsable VARCHAR(100) NOT NULL,
  date_ravitaillement TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"
"CREATE TABLE recetteproduction (
  id_recette INTEGER NOT NULL DEFAULT nextval('recetteproduction_id_recette_seq'::regclass),
  id_produit INTEGER NOT NULL,
  id_matiere INTEGER NOT NULL,
  quantite_necessaire NUMERIC(10,6) NOT NULL
);
"
"CREATE TABLE role (
  id_role INTEGER NOT NULL DEFAULT nextval('role_id_role_seq'::regclass),
  nom VARCHAR(50) NOT NULL,
  description TEXT,
  date_creation TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"
"CREATE TABLE rolepermission (
  id_role INTEGER NOT NULL,
  id_permission INTEGER NOT NULL,
  date_attribution TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"
"CREATE TABLE sessiontoken (
  id_session INTEGER NOT NULL DEFAULT nextval('sessiontoken_id_session_seq'::regclass),
  id_utilisateur INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  date_creation TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  date_expiration TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  actif BOOLEAN DEFAULT true,
  date_derniere_activite TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"
"CREATE TABLE tentativeconnexion (
  id_tentative INTEGER NOT NULL DEFAULT nextval('tentativeconnexion_id_tentative_seq'::regclass),
  identifiant VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  succes BOOLEAN DEFAULT false,
  date_tentative TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  raison TEXT,
  id_utilisateur INTEGER
);
"
"CREATE TABLE utilisateur (
  id_utilisateur INTEGER NOT NULL DEFAULT nextval('utilisateur_id_utilisateur_seq'::regclass),
  nom_utilisateur VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  mot_de_passe_hash VARCHAR(255) NOT NULL,
  nom_complet VARCHAR(100) NOT NULL,
  id_role INTEGER NOT NULL,
  actif BOOLEAN DEFAULT true,
  derniere_connexion TIMESTAMP WITHOUT TIME ZONE,
  date_creation TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP WITHOUT TIME ZONE
);
"
"CREATE TABLE utilisateurpermission (
  id_utilisateur INTEGER NOT NULL,
  id_permission INTEGER NOT NULL,
  date_attribution TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"
"CREATE TABLE vue_alertestock (
  id_matiere INTEGER,
  nom VARCHAR(100),
  unite VARCHAR(20),
  stock_actuel NUMERIC(10,2),
  stock_minimum NUMERIC(10,2),
  statut_stock TEXT
);
"
"CREATE TABLE vue_creditsclients (
  id_client INTEGER,
  client VARCHAR(100),
  telephone VARCHAR(20),
  nb_factures_credit BIGINT,
  prochaine_echeance DATE
);
"
"CREATE TABLE vue_devistotaux (
  id_devis INTEGER,
  numero_devis VARCHAR(50),
  client VARCHAR(100),
  date_devis DATE,
  date_validite DATE,
  statut VARCHAR(20),
  remise_globale NUMERIC(5,2)
);
"
"CREATE TABLE vue_ecartinventairematiere (
  id_ligne_inv INTEGER,
  id_inventaire INTEGER,
  date_inventaire TIMESTAMP WITHOUT TIME ZONE,
  responsable VARCHAR(100),
  matiere VARCHAR(100),
  unite VARCHAR(20),
  stock_theorique NUMERIC(10,2),
  stock_physique NUMERIC(10,2)
);
"
"CREATE TABLE vue_ecartinventaireproduit (
  id_ligne_inv INTEGER,
  id_inventaire INTEGER,
  date_inventaire TIMESTAMP WITHOUT TIME ZONE,
  responsable VARCHAR(100),
  produit VARCHAR(100),
  unite VARCHAR(20),
  stock_theorique NUMERIC(10,2),
  stock_physique NUMERIC(10,2)
);
"
"CREATE TABLE vue_facturetotaux (
  id_facture INTEGER,
  numero_facture VARCHAR(50),
  client VARCHAR(100),
  date_facture DATE,
  date_echeance DATE,
  statut VARCHAR(20),
  montant_paye NUMERIC(10,2)
);
"
"CREATE TABLE vue_historique_ravitaillement (
  id_ravitaillement INTEGER,
  id_matiere INTEGER,
  nom_matiere VARCHAR(100),
  unite VARCHAR(20),
  quantite NUMERIC(10,2),
  prix_achat NUMERIC(10,2),
  fournisseur VARCHAR(100),
  numero_bon_livraison VARCHAR(50),
  commentaire TEXT,
  responsable VARCHAR(100),
  date_ravitaillement TIMESTAMP WITHOUT TIME ZONE
);
"
"CREATE TABLE vue_historiqueajustements (
  id_ajustement INTEGER,
  type_article VARCHAR(20),
  id_article INTEGER,
  type_ajustement VARCHAR(50),
  quantite_avant NUMERIC(10,2),
  quantite_ajustee NUMERIC(10,2),
  quantite_apres NUMERIC(10,2),
  responsable VARCHAR(100),
  motif TEXT,
  date_ajustement TIMESTAMP WITHOUT TIME ZONE
);
"
"CREATE TABLE vue_utilisateurscomplet (
  id_utilisateur INTEGER,
  nom_utilisateur VARCHAR(50),
  email VARCHAR(100),
  nom_complet VARCHAR(100),
  role VARCHAR(50),
  role_description TEXT,
  actif BOOLEAN,
  derniere_connexion TIMESTAMP WITHOUT TIME ZONE,
  date_creation TIMESTAMP WITHOUT TIME ZONE,
  permissions TEXT
);
"
"
ALTER TABLE ajustementstock ADD CONSTRAINT ajustementstock_pkey PRIMARY KEY (id_ajustement);
"
"
ALTER TABLE bonlivraisonfacture ADD CONSTRAINT bonlivraisonfacture_pkey PRIMARY KEY (id_liaison);
"
"
ALTER TABLE client ADD CONSTRAINT client_pkey PRIMARY KEY (id_client);
"
"
ALTER TABLE configurationsecurite ADD CONSTRAINT configurationsecurite_pkey PRIMARY KEY (id_config);
"
"
ALTER TABLE devis ADD CONSTRAINT devis_pkey PRIMARY KEY (id_devis);
"
"
ALTER TABLE facture ADD CONSTRAINT facture_pkey PRIMARY KEY (id_facture);
"
"
ALTER TABLE inventaire ADD CONSTRAINT inventaire_pkey PRIMARY KEY (id_inventaire);
"
"
ALTER TABLE inventairematiere ADD CONSTRAINT inventairematiere_pkey PRIMARY KEY (id_ligne_inv);
"
"
ALTER TABLE inventaireproduit ADD CONSTRAINT inventaireproduit_pkey PRIMARY KEY (id_ligne_inv);
"
"
ALTER TABLE journalactivite ADD CONSTRAINT journalactivite_pkey PRIMARY KEY (id_journal);
"
"
ALTER TABLE lignedevis ADD CONSTRAINT lignedevis_pkey PRIMARY KEY (id_ligne);
"
"
ALTER TABLE lignefacture ADD CONSTRAINT lignefacture_pkey PRIMARY KEY (id_ligne);
"
"
ALTER TABLE matierepremiere ADD CONSTRAINT matierepremiere_pkey PRIMARY KEY (id_matiere);
"
"
ALTER TABLE paiement ADD CONSTRAINT paiement_pkey PRIMARY KEY (id_paiement);
"
"
ALTER TABLE permission ADD CONSTRAINT permission_pkey PRIMARY KEY (id_permission);
"
"
ALTER TABLE production ADD CONSTRAINT production_pkey PRIMARY KEY (id_production);
"
"
ALTER TABLE produit ADD CONSTRAINT produit_pkey PRIMARY KEY (id_produit);
"
"
ALTER TABLE ravitaillement ADD CONSTRAINT ravitaillement_pkey PRIMARY KEY (id_ravitaillement);
"
"
ALTER TABLE recetteproduction ADD CONSTRAINT recetteproduction_pkey PRIMARY KEY (id_recette);
"
"
ALTER TABLE role ADD CONSTRAINT role_pkey PRIMARY KEY (id_role);
"
"
ALTER TABLE rolepermission ADD CONSTRAINT rolepermission_pkey PRIMARY KEY (id_role, id_permission);
"
"
ALTER TABLE sessiontoken ADD CONSTRAINT sessiontoken_pkey PRIMARY KEY (id_session);
"
"
ALTER TABLE tentativeconnexion ADD CONSTRAINT tentativeconnexion_pkey PRIMARY KEY (id_tentative);
"
"
ALTER TABLE utilisateur ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id_utilisateur);
"
"
ALTER TABLE utilisateurpermission ADD CONSTRAINT utilisateurpermission_pkey PRIMARY KEY (id_permission, id_utilisateur);
"
"
ALTER TABLE recetteproduction ADD CONSTRAINT recetteproduction_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES produit(id_produit);
"
"
ALTER TABLE recetteproduction ADD CONSTRAINT recetteproduction_id_matiere_fkey FOREIGN KEY (id_matiere) REFERENCES matierepremiere(id_matiere);
"
"
ALTER TABLE production ADD CONSTRAINT production_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES produit(id_produit);
"
"
ALTER TABLE devis ADD CONSTRAINT devis_id_client_fkey FOREIGN KEY (id_client) REFERENCES client(id_client);
"
"
ALTER TABLE facture ADD CONSTRAINT facture_id_client_fkey FOREIGN KEY (id_client) REFERENCES client(id_client);
"
"
ALTER TABLE facture ADD CONSTRAINT facture_id_devis_fkey FOREIGN KEY (id_devis) REFERENCES devis(id_devis);
"
"
ALTER TABLE inventairematiere ADD CONSTRAINT inventairematiere_id_inventaire_fkey FOREIGN KEY (id_inventaire) REFERENCES inventaire(id_inventaire);
"
"
ALTER TABLE lignedevis ADD CONSTRAINT lignedevis_id_devis_fkey FOREIGN KEY (id_devis) REFERENCES devis(id_devis);
"
"
ALTER TABLE lignedevis ADD CONSTRAINT lignedevis_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES produit(id_produit);
"
"
ALTER TABLE lignefacture ADD CONSTRAINT lignefacture_id_facture_fkey FOREIGN KEY (id_facture) REFERENCES facture(id_facture);
"
"
ALTER TABLE lignefacture ADD CONSTRAINT lignefacture_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES produit(id_produit);
"
"
ALTER TABLE paiement ADD CONSTRAINT paiement_id_facture_fkey FOREIGN KEY (id_facture) REFERENCES facture(id_facture);
"
"
ALTER TABLE inventairematiere ADD CONSTRAINT inventairematiere_id_matiere_fkey FOREIGN KEY (id_matiere) REFERENCES matierepremiere(id_matiere);
"
"
ALTER TABLE inventaireproduit ADD CONSTRAINT inventaireproduit_id_inventaire_fkey FOREIGN KEY (id_inventaire) REFERENCES inventaire(id_inventaire);
"
"
ALTER TABLE inventaireproduit ADD CONSTRAINT inventaireproduit_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES produit(id_produit);
"
"
ALTER TABLE ajustementstock ADD CONSTRAINT ajustementstock_id_inventaire_fkey FOREIGN KEY (id_inventaire) REFERENCES inventaire(id_inventaire);
"
"
ALTER TABLE utilisateur ADD CONSTRAINT utilisateur_id_role_fkey FOREIGN KEY (id_role) REFERENCES role(id_role);
"
"
ALTER TABLE rolepermission ADD CONSTRAINT rolepermission_id_role_fkey FOREIGN KEY (id_role) REFERENCES role(id_role);
"
"
ALTER TABLE rolepermission ADD CONSTRAINT rolepermission_id_permission_fkey FOREIGN KEY (id_permission) REFERENCES permission(id_permission);
"
"
ALTER TABLE utilisateurpermission ADD CONSTRAINT utilisateurpermission_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur);
"
"
ALTER TABLE utilisateurpermission ADD CONSTRAINT utilisateurpermission_id_permission_fkey FOREIGN KEY (id_permission) REFERENCES permission(id_permission);
"
"
ALTER TABLE sessiontoken ADD CONSTRAINT sessiontoken_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur);
"
"
ALTER TABLE journalactivite ADD CONSTRAINT journalactivite_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur);
"
"
ALTER TABLE ravitaillement ADD CONSTRAINT ravitaillement_id_matiere_fkey FOREIGN KEY (id_matiere) REFERENCES matierepremiere(id_matiere);
"
"
ALTER TABLE ravitaillement ADD CONSTRAINT fk_ravitaillement_matiere FOREIGN KEY (id_matiere) REFERENCES matierepremiere(id_matiere);
"
"
ALTER TABLE bonlivraisonfacture ADD CONSTRAINT bonlivraisonfacture_id_bon_livraison_fkey FOREIGN KEY (id_bon_livraison) REFERENCES facture(id_facture);
"
"
ALTER TABLE bonlivraisonfacture ADD CONSTRAINT bonlivraisonfacture_id_facture_fkey FOREIGN KEY (id_facture) REFERENCES facture(id_facture);
"
"
CREATE UNIQUE INDEX matierepremiere_nom_key ON public.matierepremiere USING btree (nom);
"
"
CREATE UNIQUE INDEX produit_code_produit_key ON public.produit USING btree (code_produit);
"
"
CREATE UNIQUE INDEX produit_nom_key ON public.produit USING btree (nom);
"
"
CREATE UNIQUE INDEX recetteproduction_id_produit_id_matiere_key ON public.recetteproduction USING btree (id_produit, id_matiere);
"
"
CREATE UNIQUE INDEX devis_numero_devis_key ON public.devis USING btree (numero_devis);
"
"
CREATE UNIQUE INDEX facture_numero_facture_key ON public.facture USING btree (numero_facture);
"
"
CREATE UNIQUE INDEX role_nom_key ON public.role USING btree (nom);
"
"
CREATE UNIQUE INDEX permission_nom_key ON public.permission USING btree (nom);
"
"
CREATE UNIQUE INDEX utilisateur_nom_utilisateur_key ON public.utilisateur USING btree (nom_utilisateur);
"
"
CREATE UNIQUE INDEX utilisateur_email_key ON public.utilisateur USING btree (email);
"
"
CREATE UNIQUE INDEX configurationsecurite_cle_key ON public.configurationsecurite USING btree (cle);
"
"
CREATE INDEX idx_devis_client ON public.devis USING btree (id_client);
"
"
CREATE INDEX idx_devis_statut ON public.devis USING btree (statut);
"
"
CREATE INDEX idx_facture_client ON public.facture USING btree (id_client);
"
"
CREATE INDEX idx_facture_statut ON public.facture USING btree (statut);
"
"
CREATE INDEX idx_ligne_devis_devis ON public.lignedevis USING btree (id_devis);
"
"
CREATE INDEX idx_ligne_facture_facture ON public.lignefacture USING btree (id_facture);
"
"
CREATE INDEX idx_paiement_facture ON public.paiement USING btree (id_facture);
"
"
CREATE INDEX idx_production_date ON public.production USING btree (date_production);
"
"
CREATE INDEX idx_production_produit ON public.production USING btree (id_produit);
"
"
CREATE INDEX idx_recette_produit ON public.recetteproduction USING btree (id_produit);
"
"
CREATE INDEX idx_utilisateur_email ON public.utilisateur USING btree (email);
"
"
CREATE INDEX idx_utilisateur_nom ON public.utilisateur USING btree (nom_utilisateur);
"
"
CREATE INDEX idx_utilisateur_role ON public.utilisateur USING btree (id_role);
"
"
CREATE INDEX idx_session_utilisateur ON public.sessiontoken USING btree (id_utilisateur);
"
"
CREATE INDEX idx_session_expiration ON public.sessiontoken USING btree (date_expiration);
"
"
CREATE INDEX idx_tentative_ip ON public.tentativeconnexion USING btree (ip_address);
"
"
CREATE INDEX idx_tentative_date ON public.tentativeconnexion USING btree (date_tentative);
"
"
CREATE INDEX idx_journal_utilisateur ON public.journalactivite USING btree (id_utilisateur);
"
"
CREATE INDEX idx_journal_date ON public.journalactivite USING btree (date_action);
"
"
CREATE UNIQUE INDEX sessiontoken_token_hash_key ON public.sessiontoken USING btree (token_hash);
"
"
CREATE INDEX idx_session_token ON public.sessiontoken USING btree (token_hash);
"
"
CREATE INDEX idx_ravitaillement_matiere ON public.ravitaillement USING btree (id_matiere);
"
"
CREATE INDEX idx_ravitaillement_date ON public.ravitaillement USING btree (date_ravitaillement DESC);
"
"
CREATE UNIQUE INDEX bonlivraisonfacture_id_bon_livraison_id_facture_key ON public.bonlivraisonfacture USING btree (id_bon_livraison, id_facture);
"
"
CREATE INDEX idx_bonlivraison_facture_bon ON public.bonlivraisonfacture USING btree (id_bon_livraison);
"
"
CREATE INDEX idx_bonlivraison_facture_facture ON public.bonlivraisonfacture USING btree (id_facture);
"
"
CREATE INDEX idx_ajustement_type_article ON public.ajustementstock USING btree (type_article, id_article);
"
"
CREATE INDEX idx_ajustement_date ON public.ajustementstock USING btree (date_ajustement);
"