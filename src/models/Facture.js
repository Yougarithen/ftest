// Model pour les factures - VERSION CORRIGÉE
const db = require('../database/connection');

class Facture {
  
  static getAll() {
    // ✅ CORRECTION: Calculer les montants SANS JOIN sur Paiement
    // puis récupérer la somme des paiements séparément
    const stmt = db.prepare(`
      SELECT 
        f.id_facture,
        f.numero_facture,
        f.id_client,
        c.nom as client,
        f.date_facture,
        f.date_echeance,
        f.statut,
        f.remise_globale,
        COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100)), 0) as montant_ht,
        COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100) * lf.taux_tva / 100), 0) as montant_tva,
        COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100) * (1 + lf.taux_tva / 100)), 0) as montant_ttc
      FROM Facture f
      LEFT JOIN Client c ON f.id_client = c.id_client
      LEFT JOIN LigneFacture lf ON f.id_facture = lf.id_facture
      GROUP BY f.id_facture
      ORDER BY f.date_facture DESC
    `);
    
    const factures = stmt.all();
    
    // ✅ Récupérer les montants payés pour toutes les factures en une seule requête
    const paiementsStmt = db.prepare(`
      SELECT id_facture, COALESCE(SUM(montant_paye), 0) as montant_paye
      FROM Paiement
      GROUP BY id_facture
    `);
    
    const paiements = paiementsStmt.all();
    const paiementsMap = {};
    paiements.forEach(p => {
      paiementsMap[p.id_facture] = p.montant_paye;
    });
    
    // ✅ Ajouter montant_paye et montant_restant à chaque facture
    return factures.map(f => ({
      ...f,
      montant_paye: paiementsMap[f.id_facture] || 0,
      montant_restant: f.montant_ttc - (paiementsMap[f.id_facture] || 0)
    }));
  }

  static getById(id) {
    // ✅ CORRECTION: Même logique pour getById
    const facture = db.prepare(`
      SELECT 
        f.id_facture,
        f.numero_facture,
        f.id_client,
        c.nom as client,
        f.date_facture,
        f.date_echeance,
        f.statut,
        f.remise_globale,
        f.conditions_paiement,
        f.notes,
        COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100)), 0) as montant_ht,
        COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100) * lf.taux_tva / 100), 0) as montant_tva,
        COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100) * (1 + lf.taux_tva / 100)), 0) as montant_ttc
      FROM Facture f
      LEFT JOIN Client c ON f.id_client = c.id_client
      LEFT JOIN LigneFacture lf ON f.id_facture = lf.id_facture
      WHERE f.id_facture = ?
      GROUP BY f.id_facture
    `).get(id);
    
    if (!facture) return null;

    // ✅ Récupérer le montant payé séparément
    const paiementResult = db.prepare(`
      SELECT COALESCE(SUM(montant_paye), 0) as montant_paye
      FROM Paiement
      WHERE id_facture = ?
    `).get(id);
    
    facture.montant_paye = paiementResult.montant_paye;
    facture.montant_restant = facture.montant_ttc - facture.montant_paye;

    // Récupérer les lignes avec le nom du produit
    const lignes = db.prepare(`
      SELECT 
        lf.*,
        p.nom as produit_nom
      FROM LigneFacture lf
      LEFT JOIN Produit p ON lf.id_produit = p.id_produit
      WHERE lf.id_facture = ?
    `).all(id);
    
    facture.lignes = lignes;

    return facture;
  }

  static create(data) {
    // Générer un numéro de facture automatique
    const lastFacture = db.prepare('SELECT numero_facture FROM Facture ORDER BY id_facture DESC LIMIT 1').get();
    let numeroFacture = 'FAC-001';
    
    if (lastFacture) {
      const lastNum = parseInt(lastFacture.numero_facture.split('-')[1]);
      numeroFacture = `FAC-${String(lastNum + 1).padStart(3, '0')}`;
    }

    const stmt = db.prepare(`
      INSERT INTO Facture (numero_facture, id_client, id_devis, date_facture, date_echeance, statut, type_facture, remise_globale, conditions_paiement, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      numeroFacture,
      data.id_client,
      data.id_devis || null,
      data.date_facture || new Date().toISOString().split('T')[0],
      data.date_echeance || null,
      data.statut || 'Brouillon',
      data.type_facture || 'STANDARD',
      data.remise_globale || 0,
      data.conditions_paiement || null,
      data.notes || null
    );
    
    return this.getById(result.lastInsertRowid);
  }

  static update(id, data) {
    const stmt = db.prepare(`
      UPDATE Facture 
      SET id_client = ?, date_facture = ?, date_echeance = ?, statut = ?, 
          type_facture = ?, remise_globale = ?, conditions_paiement = ?, notes = ?, date_modification = CURRENT_TIMESTAMP
      WHERE id_facture = ?
    `);
    
    stmt.run(
      data.id_client,
      data.date_facture,
      data.date_echeance,
      data.statut,
      data.type_facture,
      data.remise_globale,
      data.conditions_paiement,
      data.notes,
      id
    );
    
    return this.getById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM Facture WHERE id_facture = ?');
    return stmt.run(id);
  }

  // Ajouter une ligne à la facture
  static ajouterLigne(id_facture, data) {
    const stmt = db.prepare(`
      INSERT INTO LigneFacture (id_facture, id_produit, quantite, unite_vente, prix_unitaire_ht, taux_tva, remise_ligne, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      id_facture,
      data.id_produit,
      data.quantite,
      data.unite_vente,
      data.prix_unitaire_ht,
      data.taux_tva,
      data.remise_ligne || 0,
      data.description || null
    );
  }

  // Valider une facture (déclenche la déduction du stock via trigger)
  static valider(id) {
    const stmt = db.prepare(`
      UPDATE Facture 
      SET statut = 'Validée', date_validation = CURRENT_TIMESTAMP
      WHERE id_facture = ? AND statut = 'Brouillon'
    `);
    
    const result = stmt.run(id);
    if (result.changes === 0) {
      throw new Error('La facture ne peut pas être validée');
    }
    
    return this.getById(id);
  }

  // Récupérer les factures en crédit
  static getFacturesCredit() {
    const stmt = db.prepare('SELECT * FROM Vue_FacturesCredit');
    return stmt.all();
  }
}

module.exports = Facture;