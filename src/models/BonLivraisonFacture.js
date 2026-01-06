// models/BonLivraisonFacture.js - Modèle pour la liaison bons/factures
const pool = require('../database/connection');

class BonLivraisonFacture {

  /**
   * Créer une liaison entre un bon de livraison et une facture
   */
  static async create(id_bon_livraison, id_facture) {
    const result = await pool.query(`
      INSERT INTO BonLivraisonFacture (id_bon_livraison, id_facture)
      VALUES ($1, $2)
      RETURNING *
    `, [id_bon_livraison, id_facture]);
    
    return result.rows[0];
  }

  /**
   * Récupérer toutes les liaisons d'une facture
   */
  static async getByFacture(id_facture) {
    const result = await pool.query(`
      SELECT 
        blf.*,
        f.numero_facture as numero_bon,
        f.date_facture as date_bon,
        f.statut as statut_bon
      FROM BonLivraisonFacture blf
      JOIN Facture f ON blf.id_bon_livraison = f.id_facture
      WHERE blf.id_facture = $1
      ORDER BY f.date_facture DESC
    `, [id_facture]);
    
    return result.rows;
  }

  /**
   * Récupérer toutes les liaisons d'un bon de livraison
   */
  static async getByBonLivraison(id_bon_livraison) {
    const result = await pool.query(`
      SELECT 
        blf.*,
        f.numero_facture,
        f.date_facture,
        f.statut
      FROM BonLivraisonFacture blf
      JOIN Facture f ON blf.id_facture = f.id_facture
      WHERE blf.id_bon_livraison = $1
      ORDER BY f.date_facture DESC
    `, [id_bon_livraison]);
    
    return result.rows;
  }

  /**
   * Vérifier si un bon est déjà facturé
   */
  static async isBonFacture(id_bon_livraison) {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM BonLivraisonFacture
      WHERE id_bon_livraison = $1
    `, [id_bon_livraison]);
    
    return result.rows[0].count > 0;
  }

  /**
   * Supprimer une liaison
   */
  static async delete(id_liaison) {
    const result = await pool.query(`
      DELETE FROM BonLivraisonFacture
      WHERE id_liaison = $1
    `, [id_liaison]);
    
    return result.rowCount;
  }

  /**
   * Supprimer toutes les liaisons d'une facture
   */
  static async deleteByFacture(id_facture) {
    const result = await pool.query(`
      DELETE FROM BonLivraisonFacture
      WHERE id_facture = $1
    `, [id_facture]);
    
    return result.rowCount;
  }
}

module.exports = BonLivraisonFacture;