// models/Production.js - PostgreSQL
const pool = require('../database/connection');

class Production {
  
  static async getAll() {
    const result = await pool.query(`
      SELECT 
        p.*,
        pr.nom as produit_nom,
        pr.unite
      FROM Production p
      JOIN Produit pr ON p.id_produit = pr.id_produit
      ORDER BY p.date_production DESC
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query(`
      SELECT 
        p.*,
        pr.nom as produit_nom,
        pr.unite
      FROM Production p
      JOIN Produit pr ON p.id_produit = pr.id_produit
      WHERE p.id_production = $1
    `, [id]);
    return result.rows[0];
  }

  static async getByProduit(id_produit) {
    const result = await pool.query(`
      SELECT 
        p.*,
        pr.nom as produit_nom,
        pr.unite
      FROM Production p
      JOIN Produit pr ON p.id_produit = pr.id_produit
      WHERE p.id_produit = $1
      ORDER BY p.date_production DESC
    `, [id_produit]);
    return result.rows;
  }

  static async create(data) {
    const { id_produit, quantite_produite, operateur, commentaire } = data;

    if (!id_produit || !quantite_produite || !operateur) {
      throw new Error('Données manquantes (id_produit, quantite_produite, operateur requis)');
    }

    const result = await pool.query(`
      INSERT INTO Production 
      (id_produit, quantite_produite, date_production, operateur, commentaire)
      VALUES ($1, $2, NOW(), $3, $4)
      RETURNING *
    `, [id_produit, quantite_produite, operateur, commentaire || null]);

    return this.getById(result.rows[0].id_production);
  }

  static async produire(id_produit, quantite_produite, operateur, commentaire = null) {
    if (!id_produit || !quantite_produite || !operateur) {
      throw new Error('Données manquantes (id_produit, quantite_produite, operateur requis)');
    }

    if (quantite_produite <= 0) {
      throw new Error('La quantité doit être supérieure à 0');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Vérifier que le produit existe
      const produitResult = await client.query('SELECT * FROM Produit WHERE id_produit = $1', [id_produit]);
      if (produitResult.rows.length === 0) {
        throw new Error('Produit non trouvé');
      }

      // ✅ Insérer dans Production (les triggers font le reste)
      const result = await client.query(`
        INSERT INTO Production 
        (id_produit, quantite_produite, date_production, operateur, commentaire)
        VALUES ($1, $2, NOW(), $3, $4)
        RETURNING *
      `, [id_produit, quantite_produite, operateur, commentaire || null]);

      await client.query('COMMIT');
      return this.getById(result.rows[0].id_production);

    } catch (error) {
      await client.query('ROLLBACK');
      
      if (error.message.includes('Stock insuffisant')) {
        throw new Error('Stock insuffisant pour une ou plusieurs matières premières');
      }
      
      if (error.message.includes('Aucune recette')) {
        throw new Error('Aucune recette définie pour ce produit. Veuillez d\'abord créer une recette.');
      }

      throw error;
    } finally {
      client.release();
    }
  }

  static async verifierStock(id_produit, quantite) {
    if (quantite <= 0) {
      throw new Error('La quantité doit être supérieure à 0');
    }

    const result = await pool.query(`
      SELECT 
        r.id_recette,
        r.id_produit,
        r.id_matiere,
        r.quantite_necessaire,
        m.nom as matiere_nom,
        m.stock_actuel,
        m.unite
      FROM RecetteProduction r
      JOIN MatierePremiere m ON r.id_matiere = m.id_matiere
      WHERE r.id_produit = $1
    `, [id_produit]);

    const recette = result.rows;

    if (recette.length === 0) {
      throw new Error('Aucune recette définie pour ce produit');
    }

    const matieres_ok = [];
    const matieres_manquantes = [];

    for (const ingredient of recette) {
      if (!ingredient.quantite_necessaire || ingredient.quantite_necessaire <= 0) {
        throw new Error(`Recette invalide : la quantité nécessaire pour "${ingredient.matiere_nom}" est manquante ou nulle.`);
      }

      const quantite_necessaire = parseFloat(ingredient.quantite_necessaire) * parseFloat(quantite);
      const stock_disponible = parseFloat(ingredient.stock_actuel || 0);
      
      const matiereInfo = {
        matiere: ingredient.matiere_nom,
        necessaire: quantite_necessaire,
        disponible: stock_disponible,
        unite: ingredient.unite
      };

      if (stock_disponible >= quantite_necessaire) {
        matieres_ok.push(matiereInfo);
      } else {
        matieres_manquantes.push({
          ...matiereInfo,
          manquant: quantite_necessaire - stock_disponible
        });
      }
    }

    return {
      possible: matieres_manquantes.length === 0,
      matieres_ok,
      matieres_manquantes
    };
  }

  static async delete(id) {
    const production = await this.getById(id);
    if (!production) {
      throw new Error('Production non trouvée');
    }

    await pool.query('DELETE FROM Production WHERE id_production = $1', [id]);
    return true;
  }
}

module.exports = Production;
