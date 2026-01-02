// ========== models/RecetteProduction.js ==========

const db = require('../database/connection');

class RecetteProduction {
  
  static getAll() {
    const stmt = db.prepare(`
      SELECT rp.*, 
             p.nom as produit_nom, p.unite as produit_unite,
             m.nom as matiere_nom, m.unite as matiere_unite, m.prix_unitaire
      FROM RecetteProduction rp
      JOIN Produit p ON rp.id_produit = p.id_produit
      JOIN MatierePremiere m ON rp.id_matiere = m.id_matiere
      ORDER BY p.nom, m.nom
    `);
    return stmt.all();
  }

  static getById(id) {
    const stmt = db.prepare(`
      SELECT rp.*, 
             p.nom as produit_nom, p.unite as produit_unite,
             m.nom as matiere_nom, m.unite as matiere_unite, m.prix_unitaire
      FROM RecetteProduction rp
      JOIN Produit p ON rp.id_produit = p.id_produit
      JOIN MatierePremiere m ON rp.id_matiere = m.id_matiere
      WHERE rp.id_recette = ?
    `);
    return stmt.get(id);
  }

  static getByProduit(id_produit) {
    const stmt = db.prepare(`
      SELECT rp.*, 
             m.nom as matiere_nom, m.unite as matiere_unite, m.prix_unitaire,
             (rp.quantite_necessaire * m.prix_unitaire) as cout_matiere
      FROM RecetteProduction rp
      JOIN MatierePremiere m ON rp.id_matiere = m.id_matiere
      WHERE rp.id_produit = ?
      ORDER BY m.nom
    `);
    return stmt.all(id_produit);
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO RecetteProduction (id_produit, id_matiere, quantite_necessaire)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(
      data.id_produit,
      data.id_matiere,
      data.quantite_necessaire
    );
    
    return this.getById(result.lastInsertRowid);
  }

  static update(id, data) {
    const stmt = db.prepare(`
      UPDATE RecetteProduction 
      SET id_produit = ?, id_matiere = ?, quantite_necessaire = ?
      WHERE id_recette = ?
    `);
    
    stmt.run(
      data.id_produit,
      data.id_matiere,
      data.quantite_necessaire,
      id
    );
    
    return this.getById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM RecetteProduction WHERE id_recette = ?');
    return stmt.run(id);
  }

  // Calculer le coût de production d'un produit
  static calculerCoutProduction(id_produit, quantite = 1) {
    const recette = this.getByProduit(id_produit);
    
    let coutTotal = 0;
    const details = [];

    recette.forEach(ingredient => {
      const coutIngredient = ingredient.quantite_necessaire * quantite * ingredient.prix_unitaire;
      coutTotal += coutIngredient;
      
      details.push({
        matiere: ingredient.matiere_nom,
        quantite_necessaire: ingredient.quantite_necessaire * quantite,
        unite: ingredient.matiere_unite,
        prix_unitaire: ingredient.prix_unitaire,
        cout: coutIngredient
      });
    });

    return {
      id_produit,
      quantite_produite: quantite,
      cout_total: coutTotal,
      cout_unitaire: coutTotal / quantite,
      details
    };
  }

  // Vérifier disponibilité des matières pour production
  static verifierDisponibilite(id_produit, quantite) {
    const recette = this.getByProduit(id_produit);
    const matiereManquantes = [];

    recette.forEach(ingredient => {
      const matiere = db.prepare('SELECT * FROM MatierePremiere WHERE id_matiere = ?').get(ingredient.id_matiere);
      const quantiteNecessaire = ingredient.quantite_necessaire * quantite;
      
      if (matiere.stock_actuel < quantiteNecessaire) {
        matiereManquantes.push({
          matiere: ingredient.matiere_nom,
          necessaire: quantiteNecessaire,
          disponible: matiere.stock_actuel,
          manquant: quantiteNecessaire - matiere.stock_actuel,
          unite: matiere.unite
        });
      }
    });

    return {
      disponible: matiereManquantes.length === 0,
      matieres_manquantes: matiereManquantes
    };
  }
}

module.exports = RecetteProduction;
