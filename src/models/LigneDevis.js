// ========== models/LigneDevis.js ==========
const db = require('../database/connection');

class LigneDevis {
  
  static getAll() {
    const stmt = db.prepare(`
      SELECT ld.*, 
             d.numero_devis,
             p.nom as produit_nom,
             (ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100)) as montant_ht,
             (ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100) * ld.taux_tva/100) as montant_tva,
             (ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100) * (1 + ld.taux_tva/100)) as montant_ttc
      FROM LigneDevis ld
      JOIN Devis d ON ld.id_devis = d.id_devis
      JOIN Produit p ON ld.id_produit = p.id_produit
      ORDER BY d.date_devis DESC, ld.id_ligne
    `);
    return stmt.all();
  }

  static getById(id) {
    const stmt = db.prepare(`
      SELECT ld.*, 
             d.numero_devis,
             p.nom as produit_nom, p.code_produit,
             (ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100)) as montant_ht,
             (ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100) * ld.taux_tva/100) as montant_tva,
             (ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100) * (1 + ld.taux_tva/100)) as montant_ttc
      FROM LigneDevis ld
      JOIN Devis d ON ld.id_devis = d.id_devis
      JOIN Produit p ON ld.id_produit = p.id_produit
      WHERE ld.id_ligne = ?
    `);
    return stmt.get(id);
  }

  static getByDevis(id_devis) {
    const stmt = db.prepare(`
      SELECT ld.*, 
             p.nom as produit_nom, p.code_produit,
             (ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100)) as montant_ht,
             (ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100) * ld.taux_tva/100) as montant_tva,
             (ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100) * (1 + ld.taux_tva/100)) as montant_ttc
      FROM LigneDevis ld
      JOIN Produit p ON ld.id_produit = p.id_produit
      WHERE ld.id_devis = ?
      ORDER BY ld.id_ligne
    `);
    return stmt.all(id_devis);
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO LigneDevis (id_devis, id_produit, quantite, unite_vente, prix_unitaire_ht, taux_tva, remise_ligne, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.id_devis,
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
      UPDATE LigneDevis 
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
    const stmt = db.prepare('DELETE FROM LigneDevis WHERE id_ligne = ?');
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
}

module.exports = LigneDevis;

