// ========== models/InventaireProduit.js - PostgreSQL ==========
const pool = require('../database/connection');

class InventaireProduit {
  
  static async getAll() {
    const result = await pool.query(`
      SELECT ip.*, 
             i.date_inventaire, i.responsable, i.statut as inventaire_statut,
             p.nom as produit_nom, p.unite,
             (ip.stock_physique - ip.stock_theorique) as ecart,
             CASE 
               WHEN ip.stock_theorique = 0 THEN 0
               ELSE ROUND(((ip.stock_physique - ip.stock_theorique) * 100.0 / ip.stock_theorique)::numeric, 2)
             END as ecart_pourcent
      FROM InventaireProduit ip
      JOIN Inventaire i ON ip.id_inventaire = i.id_inventaire
      JOIN Produit p ON ip.id_produit = p.id_produit
      ORDER BY i.date_inventaire DESC, p.nom
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query(`
      SELECT ip.*, 
             i.date_inventaire, i.responsable, i.statut as inventaire_statut,
             p.nom as produit_nom, p.unite, p.prix_vente_suggere,
             (ip.stock_physique - ip.stock_theorique) as ecart,
             CASE 
               WHEN ip.stock_theorique = 0 THEN 0
               ELSE ROUND(((ip.stock_physique - ip.stock_theorique) * 100.0 / ip.stock_theorique)::numeric, 2)
             END as ecart_pourcent,
             ((ip.stock_physique - ip.stock_theorique) * p.prix_vente_suggere) as valeur_ecart
      FROM InventaireProduit ip
      JOIN Inventaire i ON ip.id_inventaire = i.id_inventaire
      JOIN Produit p ON ip.id_produit = p.id_produit
      WHERE ip.id_ligne_inv = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByInventaire(id_inventaire) {
    const result = await pool.query(`
      SELECT ip.*, 
             p.nom as produit_nom, p.unite, p.prix_vente_suggere,
             (ip.stock_physique - ip.stock_theorique) as ecart,
             CASE 
               WHEN ip.stock_theorique = 0 THEN 0
               ELSE ROUND(((ip.stock_physique - ip.stock_theorique) * 100.0 / ip.stock_theorique)::numeric, 2)
             END as ecart_pourcent,
             ((ip.stock_physique - ip.stock_theorique) * p.prix_vente_suggere) as valeur_ecart
      FROM InventaireProduit ip
      JOIN Produit p ON ip.id_produit = p.id_produit
      WHERE ip.id_inventaire = $1
      ORDER BY p.nom
    `, [id_inventaire]);
    return result.rows;
  }

  static async create(data) {
    const produitResult = await pool.query('SELECT stock_actuel FROM Produit WHERE id_produit = $1', [data.id_produit]);
    const produit = produitResult.rows[0];
    
    const result = await pool.query(`
      INSERT INTO InventaireProduit (id_inventaire, id_produit, stock_theorique, stock_physique)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [data.id_inventaire, data.id_produit, produit.stock_actuel, data.stock_physique]);
    
    return this.getById(result.rows[0].id_ligne_inv);
  }

  static async update(id, data) {
    const result = await pool.query(`
      UPDATE InventaireProduit 
      SET stock_physique = $1
      WHERE id_ligne_inv = $2
      RETURNING *
    `, [data.stock_physique, id]);
    
    return this.getById(id);
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM InventaireProduit WHERE id_ligne_inv = $1', [id]);
    return result.rowCount;
  }

  static async getEcartsSignificatifs(id_inventaire) {
    const result = await pool.query(`
      SELECT ip.*, 
             p.nom as produit_nom, p.unite, p.prix_vente_suggere,
             (ip.stock_physique - ip.stock_theorique) as ecart,
             ROUND(((ip.stock_physique - ip.stock_theorique) * 100.0 / ip.stock_theorique)::numeric, 2) as ecart_pourcent,
             ((ip.stock_physique - ip.stock_theorique) * p.prix_vente_suggere) as valeur_ecart
      FROM InventaireProduit ip
      JOIN Produit p ON ip.id_produit = p.id_produit
      WHERE ip.id_inventaire = $1
        AND ABS((ip.stock_physique - ip.stock_theorique) * 100.0 / NULLIF(ip.stock_theorique, 0)) > 5
      ORDER BY ABS(ip.stock_physique - ip.stock_theorique) DESC
    `, [id_inventaire]);
    return result.rows;
  }
}

module.exports = InventaireProduit;
