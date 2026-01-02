// Model pour les clients - PostgreSQL
const pool = require('../database/connection');

class Client {
  
  static async getAll() {
    const result = await pool.query('SELECT * FROM Client ORDER BY nom');
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM Client WHERE id_client = $1', [id]);
    return result.rows[0];
  }

  static async create(data) {
    const result = await pool.query(`
      INSERT INTO Client (nom, numero_rc, nif, n_article, adresse, contact, telephone, email, assujetti_tva, TypeC)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      data.nom,
      data.numero_rc || null,
      data.nif || null,
      data.n_article || null,
      data.adresse || null,
      data.contact || null,
      data.telephone || null,
      data.email || null,
      data.assujetti_tva !== undefined ? data.assujetti_tva : 1,
      data.TypeC || 'Entreprise'
    ]);
    
    return result.rows[0];
  }

  static async update(id, data) {
    const result = await pool.query(`
      UPDATE Client 
      SET nom = $1, numero_rc = $2, nif = $3, n_article = $4, adresse = $5, 
          contact = $6, telephone = $7, email = $8, assujetti_tva = $9, TypeC = $10
      WHERE id_client = $11
      RETURNING *
    `, [
      data.nom,
      data.numero_rc,
      data.nif,
      data.n_article,
      data.adresse,
      data.contact,
      data.telephone,
      data.email,
      data.assujetti_tva,
      data.TypeC || 'Entreprise',
      id
    ]);
    
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM Client WHERE id_client = $1', [id]);
    return result.rowCount;
  }

  // Récupérer les crédits d'un client
  static async getCredits(id) {
    const result = await pool.query(`
      SELECT * FROM Vue_CreditsClients WHERE id_client = $1
    `, [id]);
    return result.rows[0];
  }

  // Récupérer tous les types de clients distincts
  static async getTypes() {
    const result = await pool.query('SELECT DISTINCT TypeC FROM Client ORDER BY TypeC');
    return result.rows;
  }
}

module.exports = Client;
