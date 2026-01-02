// Model pour les matières premières
const db = require('../database/connection');

class MatierePremiere {
  
  // Récupérer toutes les matières premières
  static getAll() {
    const stmt = db.prepare('SELECT * FROM MatierePremiere ORDER BY nom');
    return stmt.all();
  }

  // Récupérer une matière par son ID
  static getById(id) {
    const stmt = db.prepare('SELECT * FROM MatierePremiere WHERE id_matiere = ?');
    return stmt.get(id);
  }

  // Récupérer les matières par type
  static getByType(type) {
    const stmt = db.prepare('SELECT * FROM MatierePremiere WHERE typeM = ? ORDER BY nom');
    return stmt.all(type);
  }

  // Créer une nouvelle matière première
  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO MatierePremiere (nom, unite, typeM, stock_actuel, stock_minimum, prix_unitaire)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.nom,
      data.unite,
      data.typeM || data.type_matiere, // Support des deux noms
      data.stock_actuel || 0,
      data.stock_minimum || 0,
      data.prix_unitaire || null
    );
    
    return this.getById(result.lastInsertRowid);
  }

  // Mettre à jour une matière première
  static update(id, data) {
    const stmt = db.prepare(`
      UPDATE MatierePremiere 
      SET nom = ?, unite = ?, typeM = ?, stock_actuel = ?, stock_minimum = ?, prix_unitaire = ?
      WHERE id_matiere = ?
    `);
    
    stmt.run(
      data.nom,
      data.unite,
      data.typeM || data.type_matiere,
      data.stock_actuel,
      data.stock_minimum,
      data.prix_unitaire,
      id
    );
    
    return this.getById(id);
  }

  // Supprimer une matière première
  static delete(id) {
    const stmt = db.prepare('DELETE FROM MatierePremiere WHERE id_matiere = ?');
    return stmt.run(id);
  }

  // Récupérer les matières en alerte de stock
  static getAlertes() {
    const stmt = db.prepare('SELECT * FROM Vue_AlerteStock');
    return stmt.all();
  }

  // Récupérer les statistiques par type
  static getStatsByType() {
    const stmt = db.prepare(`
      SELECT 
        typeM as type,
        COUNT(*) as nb_matieres,
        SUM(stock_actuel) as stock_total,
        SUM(stock_actuel * COALESCE(prix_unitaire, 0)) as valeur_totale,
        SUM(CASE WHEN stock_actuel < stock_minimum THEN 1 ELSE 0 END) as nb_alertes
      FROM MatierePremiere
      GROUP BY typeM
      ORDER BY typeM
    `);
    return stmt.all();
  }

  // Ajuster le stock
  static ajusterStock(id, quantite, responsable, motif) {
    const matiere = this.getById(id);
    if (!matiere) throw new Error('Matière première introuvable');

    const nouvelleQuantite = matiere.stock_actuel + quantite;
    
    // Enregistrer l'ajustement
    const stmtAjustement = db.prepare(`
      INSERT INTO AjustementStock (type_article, id_article, type_ajustement, quantite_avant, quantite_ajustee, quantite_apres, responsable, motif)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmtAjustement.run(
      'MATIERE',
      id,
      quantite > 0 ? 'AJOUT' : 'RETRAIT',
      matiere.stock_actuel,
      quantite,
      nouvelleQuantite,
      responsable,
      motif
    );

    // Mettre à jour le stock
    const stmtUpdate = db.prepare('UPDATE MatierePremiere SET stock_actuel = ? WHERE id_matiere = ?');
    stmtUpdate.run(nouvelleQuantite, id);

    return this.getById(id);
  }
}

module.exports = MatierePremiere;