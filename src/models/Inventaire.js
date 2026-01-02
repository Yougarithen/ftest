
// Model pour les inventaires
const db = require('../database/connection');

class Inventaire {
  
  static getAll() {
    const stmt = db.prepare('SELECT * FROM Inventaire ORDER BY date_inventaire DESC');
    return stmt.all();
  }

  static getById(id) {
    const inventaire = db.prepare('SELECT * FROM Inventaire WHERE id_inventaire = ?').get(id);
    if (!inventaire) return null;

    inventaire.matieres = db.prepare('SELECT * FROM Vue_EcartInventaireMatiere WHERE id_inventaire = ?').all(id);
    inventaire.produits = db.prepare('SELECT * FROM Vue_EcartInventaireProduit WHERE id_inventaire = ?').all(id);

    return inventaire;
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO Inventaire (responsable, statut, commentaire)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(
      data.responsable,
      data.statut || 'En cours',
      data.commentaire || null
    );
    
    return this.getById(result.lastInsertRowid);
  }

  static update(id, data) {
    const stmt = db.prepare(`
      UPDATE Inventaire 
      SET responsable = ?, statut = ?, commentaire = ?
      WHERE id_inventaire = ?
    `);
    
    stmt.run(data.responsable, data.statut, data.commentaire, id);
    return this.getById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM Inventaire WHERE id_inventaire = ?');
    return stmt.run(id);
  }

  // Ajouter une ligne d'inventaire matière
  static ajouterLigneMatiere(id_inventaire, id_matiere, stock_physique) {
    const matiere = db.prepare('SELECT stock_actuel FROM MatierePremiere WHERE id_matiere = ?').get(id_matiere);
    
    const stmt = db.prepare(`
      INSERT INTO InventaireMatiere (id_inventaire, id_matiere, stock_theorique, stock_physique)
      VALUES (?, ?, ?, ?)
    `);
    
    return stmt.run(id_inventaire, id_matiere, matiere.stock_actuel, stock_physique);
  }

  // Ajouter une ligne d'inventaire produit
  static ajouterLigneProduit(id_inventaire, id_produit, stock_physique) {
    const produit = db.prepare('SELECT stock_actuel FROM Produit WHERE id_produit = ?').get(id_produit);
    
    const stmt = db.prepare(`
      INSERT INTO InventaireProduit (id_inventaire, id_produit, stock_theorique, stock_physique)
      VALUES (?, ?, ?, ?)
    `);
    
    return stmt.run(id_inventaire, id_produit, produit.stock_actuel, stock_physique);
  }

  // Clôturer un inventaire et ajuster les stocks
  static cloturer(id, responsable) {
    const inventaire = this.getById(id);
    if (!inventaire) throw new Error('Inventaire introuvable');
    if (inventaire.statut !== 'En cours') throw new Error('L\'inventaire est déjà clôturé');

    const MatierePremiere = require('./MatierePremiere');

    // Ajuster les stocks des matières
    inventaire.matieres.forEach(ligne => {
      if (ligne.ecart !== 0) {
        MatierePremiere.ajusterStock(
          ligne.id_matiere,
          ligne.ecart,
          responsable,
          `Ajustement suite à inventaire #${id}`
        );
      }
    });

    // Ajuster les stocks des produits
    inventaire.produits.forEach(ligne => {
      if (ligne.ecart !== 0) {
        db.prepare('UPDATE Produit SET stock_actuel = ? WHERE id_produit = ?')
          .run(ligne.stock_physique, ligne.id_produit);
      }
    });

    // Mettre à jour le statut de l'inventaire
    db.prepare('UPDATE Inventaire SET statut = ? WHERE id_inventaire = ?').run('Clôturé', id);

    return this.getById(id);
  }
}

module.exports = Inventaire;
