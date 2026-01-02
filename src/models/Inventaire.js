// Model pour les inventaires - PostgreSQL
const pool = require('../database/connection');

class Inventaire {
  
  static async getAll() {
    const result = await pool.query('SELECT * FROM Inventaire ORDER BY date_inventaire DESC');
    return result.rows;
  }

  static async getById(id) {
    const inventaireResult = await pool.query('SELECT * FROM Inventaire WHERE id_inventaire = $1', [id]);
    const inventaire = inventaireResult.rows[0];
    if (!inventaire) return null;

    const matieresResult = await pool.query('SELECT * FROM Vue_EcartInventaireMatiere WHERE id_inventaire = $1', [id]);
    const produitsResult = await pool.query('SELECT * FROM Vue_EcartInventaireProduit WHERE id_inventaire = $1', [id]);
    
    inventaire.matieres = matieresResult.rows;
    inventaire.produits = produitsResult.rows;

    return inventaire;
  }

  static async create(data) {
    const result = await pool.query(`
      INSERT INTO Inventaire (responsable, statut, commentaire)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [
      data.responsable,
      data.statut || 'En cours',
      data.commentaire || null
    ]);
    
    return this.getById(result.rows[0].id_inventaire);
  }

  static async update(id, data) {
    const result = await pool.query(`
      UPDATE Inventaire 
      SET responsable = $1, statut = $2, commentaire = $3
      WHERE id_inventaire = $4
      RETURNING *
    `, [data.responsable, data.statut, data.commentaire, id]);
    
    return this.getById(id);
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM Inventaire WHERE id_inventaire = $1', [id]);
    return result.rowCount;
  }

  static async ajouterLigneMatiere(id_inventaire, id_matiere, stock_physique) {
    const matiereResult = await pool.query('SELECT stock_actuel FROM MatierePremiere WHERE id_matiere = $1', [id_matiere]);
    const matiere = matiereResult.rows[0];
    
    const result = await pool.query(`
      INSERT INTO InventaireMatiere (id_inventaire, id_matiere, stock_theorique, stock_physique)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id_inventaire, id_matiere, matiere.stock_actuel, stock_physique]);
    
    return result.rows[0];
  }

  static async ajouterLigneProduit(id_inventaire, id_produit, stock_physique) {
    const produitResult = await pool.query('SELECT stock_actuel FROM Produit WHERE id_produit = $1', [id_produit]);
    const produit = produitResult.rows[0];
    
    const result = await pool.query(`
      INSERT INTO InventaireProduit (id_inventaire, id_produit, stock_theorique, stock_physique)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id_inventaire, id_produit, produit.stock_actuel, stock_physique]);
    
    return result.rows[0];
  }

  static async cloturer(id, responsable) {
    const inventaire = await this.getById(id);
    if (!inventaire) throw new Error('Inventaire introuvable');
    if (inventaire.statut !== 'En cours') throw new Error('L\'inventaire est déjà clôturé');

    const MatierePremiere = require('./MatierePremiere');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Ajuster les stocks des matières
      for (const ligne of inventaire.matieres) {
        if (ligne.ecart !== 0) {
          await MatierePremiere.ajusterStock(
            ligne.id_matiere,
            ligne.ecart,
            responsable,
            `Ajustement suite à inventaire #${id}`
          );
        }
      }

      // Ajuster les stocks des produits
      for (const ligne of inventaire.produits) {
        if (ligne.ecart !== 0) {
          await client.query('UPDATE Produit SET stock_actuel = $1 WHERE id_produit = $2', 
            [ligne.stock_physique, ligne.id_produit]);
        }
      }

      // Mettre à jour le statut de l'inventaire
      await client.query('UPDATE Inventaire SET statut = $1 WHERE id_inventaire = $2', ['Clôturé', id]);

      await client.query('COMMIT');
      return this.getById(id);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Inventaire;
