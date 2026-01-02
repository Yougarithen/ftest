// Model pour les ajustements de stock
const db = require('../database/connection');

class AjustementStock {
  
  static getAll() {
    const stmt = db.prepare(`
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
    return stmt.all();
  }

  static getById(id) {
    const stmt = db.prepare('SELECT * FROM AjustementStock WHERE id_ajustement = ?');
    return stmt.get(id);
  }

  static getByArticle(type_article, id_article) {
    const stmt = db.prepare(`
      SELECT * FROM AjustementStock 
      WHERE type_article = ? AND id_article = ?
      ORDER BY date_ajustement DESC
    `);
    return stmt.all(type_article, id_article);
  }

  static getByInventaire(id_inventaire) {
    const stmt = db.prepare(`
      SELECT * FROM AjustementStock 
      WHERE id_inventaire = ?
      ORDER BY date_ajustement DESC
    `);
    return stmt.all(id_inventaire);
  }
}

module.exports = AjustementStock;

