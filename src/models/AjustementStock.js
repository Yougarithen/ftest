// Model pour les ajustements de stock - PostgreSQL
const pool = require('../database/connection');

class AjustementStock {
  
  static async getAll() {
    const result = await pool.query(`
      SELECT a.*,
        CASE 
          WHEN a.type_article = 'MATIERE' THEN m.nom
          WHEN a.type_article = 'PRODUIT' THEN p.nom
        END as article_nom
      FROM AjustementStock a
      LEFT JOIN MatierePremiere m ON a.type_article = 'MATIERE' AND a.id_article = m.id_matiere
      LEFT JOIN Produit p ON a.type_article = 'PRODUIT' AND a.id_article = p.id_produit
      ORDER BY a.date_ajustement DESC
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM AjustementStock WHERE id_ajustement = $1', [id]);
    return result.rows[0];
  }

  static async getByArticle(type_article, id_article) {
    const result = await pool.query(`
      SELECT * FROM AjustementStock 
      WHERE type_article = $1 AND id_article = $2
      ORDER BY date_ajustement DESC
    `, [type_article, id_article]);
    return result.rows;
  }

  static async getByInventaire(id_inventaire) {
    const result = await pool.query(`
      SELECT * FROM AjustementStock 
      WHERE id_inventaire = $1
      ORDER BY date_ajustement DESC
    `, [id_inventaire]);
    return result.rows;
  }
}

module.exports = AjustementStock;
