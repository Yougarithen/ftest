// ========== models/LigneFacture.js - PostgreSQL ==========
const pool = require('../database/connection');

class LigneFacture {
  
  static async getAll() {
    const result = await pool.query(`
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
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query(`
      SELECT lf.*, 
             f.numero_facture, f.statut as facture_statut,
             p.nom as produit_nom, p.code_produit,
             (lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100)) as montant_ht,
             (lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100) * lf.taux_tva/100) as montant_tva,
             (lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100) * (1 + lf.taux_tva/100)) as montant_ttc
      FROM LigneFacture lf
      JOIN Facture f ON lf.id_facture = f.id_facture
      JOIN Produit p ON lf.id_produit = p.id_produit
      WHERE lf.id_ligne = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByFacture(id_facture) {
    const result = await pool.query(`
      SELECT lf.*, 
             p.nom as produit_nom, p.code_produit, p.stock_actuel,
             (lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100)) as montant_ht,
             (lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100) * lf.taux_tva/100) as montant_tva,
             (lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne/100) * (1 + lf.taux_tva/100)) as montant_ttc
      FROM LigneFacture lf
      JOIN Produit p ON lf.id_produit = p.id_produit
      WHERE lf.id_facture = $1
      ORDER BY lf.id_ligne
    `, [id_facture]);
    return result.rows;
  }

  static async create(data) {
    const result = await pool.query(`
      INSERT INTO LigneFacture (id_facture, id_produit, quantite, unite_vente, prix_unitaire_ht, taux_tva, remise_ligne, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      data.id_facture,
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
      UPDATE LigneFacture 
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
    const result = await pool.query('DELETE FROM LigneFacture WHERE id_ligne = $1', [id]);
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

  static async verifierStock(id_produit, quantite) {
    const result = await pool.query('SELECT stock_actuel, nom FROM Produit WHERE id_produit = $1', [id_produit]);
    const produit = result.rows[0];
    
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
