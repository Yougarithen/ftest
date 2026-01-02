// ========== models/LigneDevis.js - PostgreSQL ==========
const pool = require('../database/connection');

class LigneDevis {
  
  static async getAll() {
    const result = await pool.query(`
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
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query(`
      SELECT ld.*, 
             d.numero_devis,
             p.nom as produit_nom, p.code_produit,
             (ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100)) as montant_ht,
             (ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100) * ld.taux_tva/100) as montant_tva,
             (ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100) * (1 + ld.taux_tva/100)) as montant_ttc
      FROM LigneDevis ld
      JOIN Devis d ON ld.id_devis = d.id_devis
      JOIN Produit p ON ld.id_produit = p.id_produit
      WHERE ld.id_ligne = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByDevis(id_devis) {
    const result = await pool.query(`
      SELECT ld.*, 
             p.nom as produit_nom, p.code_produit,
             (ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100)) as montant_ht,
             (ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100) * ld.taux_tva/100) as montant_tva,
             (ld.quantite * ld.prix_unitaire_ht * (1 - ld.remise_ligne/100) * (1 + ld.taux_tva/100)) as montant_ttc
      FROM LigneDevis ld
      JOIN Produit p ON ld.id_produit = p.id_produit
      WHERE ld.id_devis = $1
      ORDER BY ld.id_ligne
    `, [id_devis]);
    return result.rows;
  }

  static async create(data) {
    const result = await pool.query(`
      INSERT INTO LigneDevis (id_devis, id_produit, quantite, unite_vente, prix_unitaire_ht, taux_tva, remise_ligne, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      data.id_devis,
      data.id_produit,
      data.quantite,
      data.unite_vente,
      data.prix_unitaire_ht,
      data.taux_tva,
      data.remise_ligne || 0,
      data.description || null
    ]);
    
    return this.getById(result.rows[0].id_ligne);
  }

  static async update(id, data) {
    const result = await pool.query(`
      UPDATE LigneDevis 
      SET id_produit = $1, quantite = $2, unite_vente = $3, prix_unitaire_ht = $4, 
          taux_tva = $5, remise_ligne = $6, description = $7
      WHERE id_ligne = $8
      RETURNING *
    `, [
      data.id_produit,
      data.quantite,
      data.unite_vente,
      data.prix_unitaire_ht,
      data.taux_tva,
      data.remise_ligne,
      data.description,
      id
    ]);
    
    return this.getById(id);
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM LigneDevis WHERE id_ligne = $1', [id]);
    return result.rowCount;
  }

  static async calculerTotaux(id) {
    const ligne = await this.getById(id);
    if (!ligne) return null;

    return {
      montant_ht: ligne.montant_ht,
      montant_tva: ligne.montant_tva,
      montant_ttc: ligne.montant_ttc
    };
  }
}

module.exports = LigneDevis;
