// ========== models/LigneFacture.js ==========
const db = require('../database/connection');

class LigneFacture {
  
  static getAll() {
    const stmt = db.prepare(`
      SELECT lf.*, 
             f.numero_facture,
             p.nom as produit_nom,
             (lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100)) as montant_ht,
             (lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100) * lf.taux_tva/100) as montant_tva,
             (lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100) * (1 + lf.taux_tva/100)) as montant_ttc
      FROM LigneFacture lf
      JOIN Facture f ON lf.id_facture = f.id_facture
      JOIN Produit p ON lf.id_produit = p.id_produit
      ORDER BY f.date_facture DESC, lf.id_ligne
    `);
    return stmt.all();
  }

  static getById(id) {
    const stmt = db.prepare(`
      SELECT lf.*, 
             f.numero_facture, f.statut as facture_statut,
             p.nom as produit_nom, p.code_produit,
             (lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100)) as montant_ht,
             (lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100) * lf.taux_tva/100) as montant_tva,
             (lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100) * (1 + lf.taux_tva/100)) as montant_ttc
      FROM LigneFacture lf
      JOIN Facture f ON lf.id_facture = f.id_facture
      JOIN Produit p ON lf.id_produit = p.id_produit
      WHERE lf.id_ligne = ?
    `);
    return stmt.get(id);
  }

  static getByFacture(id_facture) {
    const stmt = db.prepare(`
      SELECT lf.*, 
             p.nom as produit_nom, p.code_produit, p.stock_actuel,
             (lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100)) as montant_ht,
             (lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100) * lf.taux_tva/100) as montant_tva,
             (lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100) * (1 + lf.taux_tva/100)) as montant_ttc
      FROM LigneFacture lf
      JOIN Produit p ON lf.id_produit = p.id_produit
      WHERE lf.id_facture = ?
      ORDER BY lf.id_ligne
    `);
    return stmt.all(id_facture);
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO LigneFacture (id_facture, id_produit, quantite, unite_vente, prix_unitaire_ht, taux_tva, remise_ligne, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.id_facture,
      data.id_produit,
      data.quantite,
      data.unite_vente,
      data.prix_unitaire_ht,
      data.taux_tva,
      data.remise_ligne || 0,
      data.description || null
    );
    
    return this.getById(result.lastInsertRowid);
  }

  static update(id, data) {
    const stmt = db.prepare(`
      UPDATE LigneFacture 
      SET id_produit = ?, quantite = ?, unite_vente = ?, prix_unitaire_ht = ?, 
          taux_tva = ?, remise_ligne = ?, description = ?
      WHERE id_ligne = ?
    `);
    
    stmt.run(
      data.id_produit,
      data.quantite,
      data.unite_vente,
      data.prix_unitaire_ht,
      data.taux_tva,
      data.remise_ligne,
      data.description,
      id
    );
    
    return this.getById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM LigneFacture WHERE id_ligne = ?');
    return stmt.run(id);
  }

  // Calculer les totaux d'une ligne
  static calculerTotaux(id) {
    const ligne = this.getById(id);
    if (!ligne) return null;

    return {
      montant_ht: ligne.montant_ht,
      montant_tva: ligne.montant_tva,
      montant_ttc: ligne.montant_ttc
    };
  }

  // Vérifier la disponibilité du stock avant ajout
  static verifierStock(id_produit, quantite) {
    const produit = db.prepare('SELECT stock_actuel, nom FROM Produit WHERE id_produit = ?').get(id_produit);
    
    if (!produit) {
      throw new Error('Produit introuvable');
    }

    if (produit.stock_actuel < quantite) {
      return {
        disponible: false,
        message: `Stock insuffisant pour ${produit.nom}. Disponible: ${produit.stock_actuel}, Demandé: ${quantite}`
      };
    }

    return {
      disponible: true,
      stock_actuel: produit.stock_actuel
    };
  }
}

module.exports = LigneFacture;

