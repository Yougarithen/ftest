// ========== models/RecetteProduction.js - PostgreSQL ==========
const pool = require('../database/connection');

class RecetteProduction {
  
  static async getAll() {
    const result = await pool.query(`
      SELECT rp.*, 
             p.nom as produit_nom, p.unite as produit_unite,
             m.nom as matiere_nom, m.unite as matiere_unite, m.prix_unitaire
      FROM RecetteProduction rp
      JOIN Produit p ON rp.id_produit = p.id_produit
      JOIN MatierePremiere m ON rp.id_matiere = m.id_matiere
      ORDER BY p.nom, m.nom
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query(`
      SELECT rp.*, 
             p.nom as produit_nom, p.unite as produit_unite,
             m.nom as matiere_nom, m.unite as matiere_unite, m.prix_unitaire
      FROM RecetteProduction rp
      JOIN Produit p ON rp.id_produit = p.id_produit
      JOIN MatierePremiere m ON rp.id_matiere = m.id_matiere
      WHERE rp.id_recette = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByProduit(id_produit) {
    const result = await pool.query(`
      SELECT rp.*, 
             m.nom as matiere_nom, m.unite as matiere_unite, m.prix_unitaire,
             (rp.quantite_necessaire * m.prix_unitaire) as cout_matiere
      FROM RecetteProduction rp
      JOIN MatierePremiere m ON rp.id_matiere = m.id_matiere
      WHERE rp.id_produit = $1
      ORDER BY m.nom
    `, [id_produit]);
    return result.rows;
  }

  static async create(data) {
    const result = await pool.query(`
      INSERT INTO RecetteProduction (id_produit, id_matiere, quantite_necessaire)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [data.id_produit, data.id_matiere, data.quantite_necessaire]);
    
    return this.getById(result.rows[0].id_recette);
  }

  static async update(id, data) {
    const result = await pool.query(`
      UPDATE RecetteProduction 
      SET id_produit = $1, id_matiere = $2, quantite_necessaire = $3
      WHERE id_recette = $4
      RETURNING *
    `, [data.id_produit, data.id_matiere, data.quantite_necessaire, id]);
    
    return this.getById(id);
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM RecetteProduction WHERE id_recette = $1', [id]);
    return result.rowCount;
  }

  static async calculerCoutProduction(id_produit, quantite = 1) {
    const recette = await this.getByProduit(id_produit);
    
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

  static async verifierDisponibilite(id_produit, quantite) {
    const recette = await this.getByProduit(id_produit);
    const matiereManquantes = [];

    for (const ingredient of recette) {
      const matiereResult = await pool.query('SELECT * FROM MatierePremiere WHERE id_matiere = $1', [ingredient.id_matiere]);
      const matiere = matiereResult.rows[0];
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
    }

    return {
      disponible: matiereManquantes.length === 0,
      matieres_manquantes: matiereManquantes
    };
  }
}

module.exports = RecetteProduction;
