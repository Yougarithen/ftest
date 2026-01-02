// ========== models/InventaireMatiere.js ==========
const db = require('../database/connection');

class InventaireMatiere {
  
  static getAll() {
    const stmt = db.prepare(`
      SELECT im.*, 
             i.date_inventaire, i.responsable, i.statut as inventaire_statut,
             m.nom as matiere_nom, m.unite,
             (im.stock_physique - im.stock_theorique) as ecart,
             CASE 
               WHEN im.stock_theorique = 0 THEN 0
               ELSE ROUND(((im.stock_physique - im.stock_theorique) * 100.0 / im.stock_theorique), 2)
             END as ecart_pourcent
      FROM InventaireMatiere im
      JOIN Inventaire i ON im.id_inventaire = i.id_inventaire
      JOIN MatierePremiere m ON im.id_matiere = m.id_matiere
      ORDER BY i.date_inventaire DESC, m.nom
    `);
    return stmt.all();
  }

  static getById(id) {
    const stmt = db.prepare(`
      SELECT im.*, 
             i.date_inventaire, i.responsable, i.statut as inventaire_statut,
             m.nom as matiere_nom, m.unite, m.prix_unitaire,
             (im.stock_physique - im.stock_theorique) as ecart,
             CASE 
               WHEN im.stock_theorique = 0 THEN 0
               ELSE ROUND(((im.stock_physique - im.stock_theorique) * 100.0 / im.stock_theorique), 2)
             END as ecart_pourcent,
             ((im.stock_physique - im.stock_theorique) * m.prix_unitaire) as valeur_ecart
      FROM InventaireMatiere im
      JOIN Inventaire i ON im.id_inventaire = i.id_inventaire
      JOIN MatierePremiere m ON im.id_matiere = m.id_matiere
      WHERE im.id_ligne_inv = ?
    `);
    return stmt.get(id);
  }

  static getByInventaire(id_inventaire) {
    const stmt = db.prepare(`
      SELECT im.*, 
             m.nom as matiere_nom, m.unite, m.prix_unitaire,
             (im.stock_physique - im.stock_theorique) as ecart,
             CASE 
               WHEN im.stock_theorique = 0 THEN 0
               ELSE ROUND(((im.stock_physique - im.stock_theorique) * 100.0 / im.stock_theorique), 2)
             END as ecart_pourcent,
             ((im.stock_physique - im.stock_theorique) * m.prix_unitaire) as valeur_ecart
      FROM InventaireMatiere im
      JOIN MatierePremiere m ON im.id_matiere = m.id_matiere
      WHERE im.id_inventaire = ?
      ORDER BY m.nom
    `);
    return stmt.all(id_inventaire);
  }

  static create(data) {
    // Récupérer le stock théorique actuel
    const matiere = db.prepare('SELECT stock_actuel FROM MatierePremiere WHERE id_matiere = ?').get(data.id_matiere);
    
    const stmt = db.prepare(`
      INSERT INTO InventaireMatiere (id_inventaire, id_matiere, stock_theorique, stock_physique)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.id_inventaire,
      data.id_matiere,
      matiere.stock_actuel,
      data.stock_physique
    );
    
    return this.getById(result.lastInsertRowid);
  }

  static update(id, data) {
    const stmt = db.prepare(`
      UPDATE InventaireMatiere 
      SET stock_physique = ?
      WHERE id_ligne_inv = ?
    `);
    
    stmt.run(data.stock_physique, id);
    return this.getById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM InventaireMatiere WHERE id_ligne_inv = ?');
    return stmt.run(id);
  }

  // Récupérer les écarts significatifs (> 5%)
  static getEcartsSignificatifs(id_inventaire) {
    const stmt = db.prepare(`
      SELECT im.*, 
             m.nom as matiere_nom, m.unite, m.prix_unitaire,
             (im.stock_physique - im.stock_theorique) as ecart,
             ROUND(((im.stock_physique - im.stock_theorique) * 100.0 / im.stock_theorique), 2) as ecart_pourcent,
             ((im.stock_physique - im.stock_theorique) * m.prix_unitaire) as valeur_ecart
      FROM InventaireMatiere im
      JOIN MatierePremiere m ON im.id_matiere = m.id_matiere
      WHERE im.id_inventaire = ?
        AND ABS((im.stock_physique - im.stock_theorique) * 100.0 / NULLIF(im.stock_theorique, 0)) > 5
      ORDER BY ABS(im.stock_physique - im.stock_theorique) DESC
    `);
    return stmt.all(id_inventaire);
  }
}

module.exports = InventaireMatiere;

