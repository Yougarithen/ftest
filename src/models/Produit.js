// Model pour les produits finis
const db = require('../database/connection');

class Produit {
  
  static getAll() {
    const stmt = db.prepare('SELECT * FROM Produit ORDER BY nom');
    return stmt.all();
  }

  static getById(id) {
    const stmt = db.prepare('SELECT * FROM Produit WHERE id_produit = ?');
    return stmt.get(id);
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO Produit (code_produit, nom, description, unite, poids, unite_poids, stock_actuel, prix_vente_suggere, taux_tva, soumis_taxe)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.code_produit || null,
      data.nom,
      data.description || null,
      data.unite,
      data.poids || null,
      data.unite_poids || 'kg',
      data.stock_actuel || 0,
      data.prix_vente_suggere || null,
      data.taux_tva || 19.00,
      data.soumis_taxe !== undefined ? data.soumis_taxe : 1
    );
    
    return this.getById(result.lastInsertRowid);
  }

  static update(id, data) {
    const stmt = db.prepare(`
      UPDATE Produit 
      SET code_produit = ?, nom = ?, description = ?, unite = ?, poids = ?, 
          unite_poids = ?, prix_vente_suggere = ?, taux_tva = ?, soumis_taxe = ?
      WHERE id_produit = ?
    `);
    
    stmt.run(
      data.code_produit,
      data.nom,
      data.description,
      data.unite,
      data.poids,
      data.unite_poids,
      data.prix_vente_suggere,
      data.taux_tva,
      data.soumis_taxe,
      id
    );
    
    return this.getById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM Produit WHERE id_produit = ?');
    return stmt.run(id);
  }

  // Récupérer la recette de production d'un produit
  static getRecette(id) {
    const stmt = db.prepare(`
      SELECT rp.*, mp.nom as nom_matiere, mp.unite
      FROM RecetteProduction rp
      JOIN MatierePremiere mp ON rp.id_matiere = mp.id_matiere
      WHERE rp.id_produit = ?
    `);
    return stmt.all(id);
  }

  // Ajouter un ingrédient à la recette
  static ajouterIngredient(id_produit, id_matiere, quantite) {
    const stmt = db.prepare(`
      INSERT INTO RecetteProduction (id_produit, id_matiere, quantite_necessaire)
      VALUES (?, ?, ?)
    `);
    return stmt.run(id_produit, id_matiere, quantite);
  }
}

module.exports = Produit;