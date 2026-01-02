// Model pour les paiements
const db = require('../database/connection');

class Paiement {
  
  static getAll() {
    const stmt = db.prepare(`
      SELECT p.*, f.numero_facture, c.nom as client
      FROM Paiement p
      JOIN Facture f ON p.id_facture = f.id_facture
      JOIN Client c ON f.id_client = c.id_client
      ORDER BY p.date_paiement DESC
    `);
    return stmt.all();
  }

  static getById(id) {
    const stmt = db.prepare('SELECT * FROM Paiement WHERE id_paiement = ?');
    return stmt.get(id);
  }

  static getByFacture(id_facture) {
    const stmt = db.prepare('SELECT * FROM Paiement WHERE id_facture = ? ORDER BY date_paiement DESC');
    return stmt.all(id_facture);
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO Paiement (id_facture, montant_paye, date_paiement, mode_paiement, reference, responsable, commentaire)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.id_facture,
      data.montant_paye,
      data.date_paiement || new Date().toISOString(),
      data.mode_paiement || null,
      data.reference || null,
      data.responsable || null,
      data.commentaire || null
    );
    
    return this.getById(result.lastInsertRowid);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM Paiement WHERE id_paiement = ?');
    return stmt.run(id);
  }
}

module.exports = Paiement;