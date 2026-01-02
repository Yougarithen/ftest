// ========== models/InventaireMatiere.js - PostgreSQL ==========
const pool = require('../database/connection');

class InventaireMatiere {
  
  static async getAll() {
    const result = await pool.query(`
      SELECT im.*, 
             i.date_inventaire, i.responsable, i.statut as inventaire_statut,
             m.nom as matiere_nom, m.unite,
             (im.stock_physique - im.stock_theorique) as ecart,
             CASE 
               WHEN im.stock_theorique = 0 THEN 0
               ELSE ROUND(((im.stock_physique - im.stock_theorique) * 100.0 / im.stock_theorique)::numeric, 2)
             END as ecart_pourcent
      FROM InventaireMatiere im
      JOIN Inventaire i ON im.id_inventaire = i.id_inventaire
      JOIN MatierePremiere m ON im.id_matiere = m.id_matiere
      ORDER BY i.date_inventaire DESC, m.nom
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query(`
      SELECT im.*, 
             i.date_inventaire, i.responsable, i.statut as inventaire_statut,
             m.nom as matiere_nom, m.unite, m.prix_unitaire,
             (im.stock_physique - im.stock_theorique) as ecart,
             CASE 
               WHEN im.stock_theorique = 0 THEN 0
               ELSE ROUND(((im.stock_physique - im.stock_theorique) * 100.0 / im.stock_theorique)::numeric, 2)
             END as ecart_pourcent,
             ((im.stock_physique - im.stock_theorique) * m.prix_unitaire) as valeur_ecart
      FROM InventaireMatiere im
      JOIN Inventaire i ON im.id_inventaire = i.id_inventaire
      JOIN MatierePremiere m ON im.id_matiere = m.id_matiere
      WHERE im.id_ligne_inv = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByInventaire(id_inventaire) {
    const result = await pool.query(`
      SELECT im.*, 
             m.nom as matiere_nom, m.unite, m.prix_unitaire,
             (im.stock_physique - im.stock_theorique) as ecart,
             CASE 
               WHEN im.stock_theorique = 0 THEN 0
               ELSE ROUND(((im.stock_physique - im.stock_theorique) * 100.0 / im.stock_theorique)::numeric, 2)
             END as ecart_pourcent,
             ((im.stock_physique - im.stock_theorique) * m.prix_unitaire) as valeur_ecart
      FROM InventaireMatiere im
      JOIN MatierePremiere m ON im.id_matiere = m.id_matiere
      WHERE im.id_inventaire = $1
      ORDER BY m.nom
    `, [id_inventaire]);
    return result.rows;
  }

  static async create(data) {
    const matiereResult = await pool.query('SELECT stock_actuel FROM MatierePremiere WHERE id_matiere = $1', [data.id_matiere]);
    const matiere = matiereResult.rows[0];
    
    const result = await pool.query(`
      INSERT INTO InventaireMatiere (id_inventaire, id_matiere, stock_theorique, stock_physique)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [data.id_inventaire, data.id_matiere, matiere.stock_actuel, data.stock_physique]);
    
    return this.getById(result.rows[0].id_ligne_inv);
  }

  static async update(id, data) {
    const result = await pool.query(`
      UPDATE InventaireMatiere 
      SET stock_physique = $1
      WHERE id_ligne_inv = $2
      RETURNING *
    `, [data.stock_physique, id]);
    
    return this.getById(id);
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM InventaireMatiere WHERE id_ligne_inv = $1', [id]);
    return result.rowCount;
  }

  static async getEcartsSignificatifs(id_inventaire) {
    const result = await pool.query(`
      SELECT im.*, 
             m.nom as matiere_nom, m.unite, m.prix_unitaire,
             (im.stock_physique - im.stock_theorique) as ecart,
             ROUND(((im.stock_physique - im.stock_theorique) * 100.0 / im.stock_theorique)::numeric, 2) as ecart_pourcent,
             ((im.stock_physique - im.stock_theorique) * m.prix_unitaire) as valeur_ecart
      FROM InventaireMatiere im
      JOIN MatierePremiere m ON im.id_matiere = m.id_matiere
      WHERE im.id_inventaire = $1
        AND ABS((im.stock_physique - im.stock_theorique) * 100.0 / NULLIF(im.stock_theorique, 0)) > 5
      ORDER BY ABS(im.stock_physique - im.stock_theorique) DESC
    `, [id_inventaire]);
    return result.rows;
  }
}

module.exports = InventaireMatiere;
