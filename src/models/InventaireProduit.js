// ========== models/InventaireProduit.js ==========
const db = require('../database/connection');

class InventaireProduit {
  
  static getAll() {
    const stmt = db.prepare(`
      SELECT ip.*, 
             i.date_inventaire, i.responsable, i.statut as inventaire_statut,
             p.nom as produit_nom, p.unite,
             (ip.stock_physique - ip.stock_theorique) as ecart,
             CASE 
               WHEN ip.stock_theorique = 0 THEN 0
               ELSE ROUND(((ip.stock_physique - ip.stock_theorique) * 100.0 / ip.stock_theorique), 2)
             END as ecart_pourcent
      FROM InventaireProduit ip
      JOIN Inventaire i ON ip.id_inventaire = i.id_inventaire
      JOIN Produit p ON ip.id_produit = p.id_produit
      ORDER BY i.date_inventaire DESC, p.nom
    `);
    return stmt.all();
  }

  static getById(id) {
    const stmt = db.prepare(`
      SELECT ip.*, 
             i.date_inventaire, i.responsable, i.statut as inventaire_statut,
             p.nom as produit_nom, p.unite, p.prix_vente_suggere,
             (ip.stock_physique - ip.stock_theorique) as ecart,
             CASE 
               WHEN ip.stock_theorique = 0 THEN 0
               ELSE ROUND(((ip.stock_physique - ip.stock_theorique) * 100.0 / ip.stock_theorique), 2)
             END as ecart_pourcent,
             ((ip.stock_physique - ip.stock_theorique) * p.prix_vente_suggere) as valeur_ecart
      FROM InventaireProduit ip
      JOIN Inventaire i ON ip.id_inventaire = i.id_inventaire
      JOIN Produit p ON ip.id_produit = p.id_produit
      WHERE ip.id_ligne_inv = ?
    `);
    return stmt.get(id);
  }

  static getByInventaire(id_inventaire) {
    const stmt = db.prepare(`
      SELECT ip.*, 
             p.nom as produit_nom, p.unite, p.prix_vente_suggere,
             (ip.stock_physique - ip.stock_theorique) as ecart,
             CASE 
               WHEN ip.stock_theorique = 0 THEN 0
               ELSE ROUND(((ip.stock_physique - ip.stock_theorique) * 100.0 / ip.stock_theorique), 2)
             END as ecart_pourcent,
             ((ip.stock_physique - ip.stock_theorique) * p.prix_vente_suggere) as valeur_ecart
      FROM InventaireProduit ip
      JOIN Produit p ON ip.id_produit = p.id_produit
      WHERE ip.id_inventaire = ?
      ORDER BY p.nom
    `);
    return stmt.all(id_inventaire);
  }

  static create(data) {
    // Récupérer le stock théorique actuel
    const produit = db.prepare('SELECT stock_actuel FROM Produit WHERE id_produit = ?').get(data.id_produit);
    
    const stmt = db.prepare(`
      INSERT INTO InventaireProduit (id_inventaire, id_produit, stock_theorique, stock_physique)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.id_inventaire,
      data.id_produit,
      produit.stock_actuel,
      data.stock_physique
    );
    
    return this.getById(result.lastInsertRowid);
  }

  static update(id, data) {
    const stmt = db.prepare(`
      UPDATE InventaireProduit 
      SET stock_physique = ?
      WHERE id_ligne_inv = ?
    `);
    
    stmt.run(data.stock_physique, id);
    return this.getById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM InventaireProduit WHERE id_ligne_inv = ?');
    return stmt.run(id);
  }

  // Récupérer les écarts significatifs (> 5%)
  static getEcartsSignificatifs(id_inventaire) {
    const stmt = db.prepare(`
      SELECT ip.*, 
             p.nom as produit_nom, p.unite, p.prix_vente_suggere,
             (ip.stock_physique - ip.stock_theorique) as ecart,
             ROUND(((ip.stock_physique - ip.stock_theorique) * 100.0 / ip.stock_theorique), 2) as ecart_pourcent,
             ((ip.stock_physique - ip.stock_theorique) * p.prix_vente_suggere) as valeur_ecart
      FROM InventaireProduit ip
      JOIN Produit p ON ip.id_produit = p.id_produit
      WHERE ip.id_inventaire = ?
        AND ABS((ip.stock_physique - ip.stock_theorique) * 100.0 / NULLIF(ip.stock_theorique, 0)) > 5
      ORDER BY ABS(ip.stock_physique - ip.stock_theorique) DESC
    `);
    return stmt.all(id_inventaire);
  }
}

module.exports = InventaireProduit;
