// Model pour les clients
const db = require('../database/connection');

class Client {
  
  static getAll() {
    const stmt = db.prepare('SELECT * FROM Client ORDER BY nom');
    return stmt.all();
  }

  static getById(id) {
    const stmt = db.prepare('SELECT * FROM Client WHERE id_client = ?');
    return stmt.get(id);
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO Client (nom, numero_rc, nif, n_article, adresse, contact, telephone, email, assujetti_tva, TypeC)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.nom,
      data.numero_rc || null,
      data.nif || null,
      data.n_article || null,
      data.adresse || null,
      data.contact || null,
      data.telephone || null,
      data.email || null,
      data.assujetti_tva !== undefined ? data.assujetti_tva : 1,
      data.TypeC || 'Entreprise' // Valeur par défaut
    );
    
    return this.getById(result.lastInsertRowid);
  }

  static update(id, data) {
    const stmt = db.prepare(`
      UPDATE Client 
      SET nom = ?, numero_rc = ?, nif = ?, n_article = ?, adresse = ?, 
          contact = ?, telephone = ?, email = ?, assujetti_tva = ?, TypeC = ?
      WHERE id_client = ?
    `);
    
    stmt.run(
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
    );
    
    return this.getById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM Client WHERE id_client = ?');
    return stmt.run(id);
  }

  // Récupérer les crédits d'un client
  static getCredits(id) {
    const stmt = db.prepare(`
      SELECT * FROM Vue_CreditsClients WHERE id_client = ?
    `);
    return stmt.get(id);
  }

  // Récupérer tous les types de clients distincts
  static getTypes() {
    const stmt = db.prepare('SELECT DISTINCT TypeC FROM Client ORDER BY TypeC');
    return stmt.all();
  }
}

module.exports = Client;