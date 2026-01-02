// Model pour les paiements - PostgreSQL
const pool = require('../database/connection');

class Paiement {
  
  static async getAll() {
    const result = await pool.query(`
      SELECT p.*, f.numero_facture, c.nom as client
      FROM Paiement p
      JOIN Facture f ON p.id_facture = f.id_facture
      JOIN Client c ON f.id_client = c.id_client
      ORDER BY p.date_paiement DESC
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM Paiement WHERE id_paiement = $1', [id]);
    return result.rows[0];
  }

  static async getByFacture(id_facture) {
    const result = await pool.query('SELECT * FROM Paiement WHERE id_facture = $1 ORDER BY date_paiement DESC', [id_facture]);
    return result.rows;
  }

  static async create(data) {
    const result = await pool.query(`
      INSERT INTO Paiement (id_facture, montant_paye, date_paiement, mode_paiement, reference, responsable, commentaire)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      data.id_facture,
      data.montant_paye,
      data.date_paiement || new Date().toISOString(),
      data.mode_paiement || null,
      data.reference || null,
      data.responsable || null,
      data.commentaire || null
    ]);
    
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM Paiement WHERE id_paiement = $1', [id]);
    return result.rowCount;
  }
}

module.exports = Paiement;
