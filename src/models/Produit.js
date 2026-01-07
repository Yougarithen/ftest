// Model pour les produits finis - PostgreSQL
const pool = require('../database/connection');

class Produit {
  
  static async getAll() {
    const result = await pool.query('SELECT * FROM Produit ORDER BY nom');
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM Produit WHERE id_produit = $1', [id]);
    return result.rows[0];
  }

  static async create(data) {
    const result = await pool.query(`
      INSERT INTO Produit (code_produit, nom, description, unite, poids, unite_poids, stock_actuel, prix_vente_suggere, taux_tva, soumis_taxe)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
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
    ]);
    
    return result.rows[0];
  }

    static async ajusterStock(id, quantite, responsable, typeAjustement, motif) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Récupérer le produit actuel
            const produitResult = await client.query(
                'SELECT * FROM Produit WHERE id_produit = $1',
                [id]
            );
            const produit = produitResult.rows[0];

            if (!produit) throw new Error('Produit introuvable');

            const nouvelleQuantite = parseFloat(produit.stock_actuel) + parseFloat(quantite);

            if (nouvelleQuantite < 0) {
                throw new Error('Le stock ne peut pas être négatif');
            }

            // Enregistrer l'ajustement
            await client.query(`
      INSERT INTO AjustementStock (
        type_article, 
        id_article, 
        type_ajustement, 
        quantite_avant, 
        quantite_ajustee, 
        quantite_apres, 
        responsable, 
        motif
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
                'PRODUIT',
                id,
                typeAjustement,
                produit.stock_actuel,
                quantite,
                nouvelleQuantite,
                responsable,
                motif
            ]);

            // Mettre à jour le stock
            const updateResult = await client.query(`
      UPDATE Produit 
      SET stock_actuel = $1 
      WHERE id_produit = $2 
      RETURNING *
    `, [nouvelleQuantite, id]);

            await client.query('COMMIT');
            return updateResult.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Récupérer l'historique des ajustements d'un produit
    static async getHistoriqueAjustements(id) {
        const result = await pool.query(`
    SELECT * FROM Vue_HistoriqueAjustements
    WHERE type_article = 'PRODUIT' AND id_article = $1
    ORDER BY date_ajustement DESC
  `, [id]);
        return result.rows;
    }


  static async update(id, data) {
    const result = await pool.query(`
      UPDATE Produit 
      SET code_produit = $1, nom = $2, description = $3, unite = $4, poids = $5, 
          unite_poids = $6, prix_vente_suggere = $7, taux_tva = $8, soumis_taxe = $9
      WHERE id_produit = $10
      RETURNING *
    `, [
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
    ]);
    
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM Produit WHERE id_produit = $1', [id]);
    return result.rowCount;
  }

  // Récupérer la recette de production d'un produit
  static async getRecette(id) {
    const result = await pool.query(`
      SELECT rp.*, mp.nom as nom_matiere, mp.unite
      FROM RecetteProduction rp
      JOIN MatierePremiere mp ON rp.id_matiere = mp.id_matiere
      WHERE rp.id_produit = $1
    `, [id]);
    return result.rows;
  }

  // Ajouter un ingrédient à la recette
  static async ajouterIngredient(id_produit, id_matiere, quantite) {
    const result = await pool.query(`
      INSERT INTO RecetteProduction (id_produit, id_matiere, quantite_necessaire)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [id_produit, id_matiere, quantite]);
    return result.rows[0];
  }
}

module.exports = Produit;
