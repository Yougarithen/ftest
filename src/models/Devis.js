// Model pour les devis
const db = require('../database/connection');

class Devis {
  
  static getAll() {
    const stmt = db.prepare('SELECT * FROM Vue_DevisTotaux ORDER BY date_devis DESC');
    return stmt.all();
  }

  static getById(id) {
    const devis = db.prepare('SELECT * FROM Vue_DevisTotaux WHERE id_devis = ?').get(id);
    if (!devis) return null;

    // Récupérer les lignes du devis
    const lignes = db.prepare('SELECT * FROM LigneDevis WHERE id_devis = ?').all(id);
    devis.lignes = lignes;

    return devis;
  }

  static create(data) {
    // Générer un numéro de devis automatique
    const lastDevis = db.prepare('SELECT numero_devis FROM Devis ORDER BY id_devis DESC LIMIT 1').get();
    let numeroDevis = 'DEV-001';
    
    if (lastDevis) {
      const lastNum = parseInt(lastDevis.numero_devis.split('-')[1]);
      numeroDevis = `DEV-${String(lastNum + 1).padStart(3, '0')}`;
    }

    const stmt = db.prepare(`
      INSERT INTO Devis (numero_devis, id_client, date_devis, date_validite, statut, remise_globale, conditions_paiement, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      numeroDevis,
      data.id_client,
      data.date_devis || new Date().toISOString().split('T')[0],
      data.date_validite || null,
      data.statut || 'Brouillon',
      data.remise_globale || 0,
      data.conditions_paiement || null,
      data.notes || null
    );
    
    return this.getById(result.lastInsertRowid);
  }

  static update(id, data) {
    const stmt = db.prepare(`
      UPDATE Devis 
      SET id_client = ?, date_devis = ?, date_validite = ?, statut = ?, 
          remise_globale = ?, conditions_paiement = ?, notes = ?, date_modification = CURRENT_TIMESTAMP
      WHERE id_devis = ?
    `);
    
    stmt.run(
      data.id_client,
      data.date_devis,
      data.date_validite,
      data.statut,
      data.remise_globale,
      data.conditions_paiement,
      data.notes,
      id
    );
    
    return this.getById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM Devis WHERE id_devis = ?');
    return stmt.run(id);
  }

  // Ajouter une ligne au devis
  static ajouterLigne(id_devis, data) {
    const stmt = db.prepare(`
      INSERT INTO LigneDevis (id_devis, id_produit, quantite, unite_vente, prix_unitaire_ht, taux_tva, remise_ligne, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      id_devis,
      data.id_produit,
      data.quantite,
      data.unite_vente,
      data.prix_unitaire_ht,
      data.taux_tva,
      data.remise_ligne || 0,
      data.description || null
    );
  }

  // Supprimer une ligne du devis
  static supprimerLigne(id_ligne) {
    const stmt = db.prepare('DELETE FROM LigneDevis WHERE id_ligne = ?');
    return stmt.run(id_ligne);
  }

  // Convertir un devis en facture
  static convertirEnFacture(id_devis) {
    const devis = this.getById(id_devis);
    if (!devis) throw new Error('Devis introuvable');
    if (devis.statut !== 'Accepté') throw new Error('Le devis doit être accepté pour être converti');

    const Facture = require('./Facture');
    
    // Créer la facture
    const facture = Facture.create({
      id_client: devis.id_client,
      id_devis: id_devis,
      remise_globale: devis.remise_globale,
      conditions_paiement: devis.conditions_paiement,
      notes: devis.notes
    });

    // Copier les lignes du devis vers la facture
    devis.lignes.forEach(ligne => {
      Facture.ajouterLigne(facture.id_facture, {
        id_produit: ligne.id_produit,
        quantite: ligne.quantite,
        unite_vente: ligne.unite_vente,
        prix_unitaire_ht: ligne.prix_unitaire_ht,
        taux_tva: ligne.taux_tva,
        remise_ligne: ligne.remise_ligne,
        description: ligne.description
      });
    });

    // Mettre à jour le devis avec l'ID de la facture
    db.prepare('UPDATE Devis SET id_facture = ? WHERE id_devis = ?').run(facture.id_facture, id_devis);

    return Facture.getById(facture.id_facture);
  }
}

module.exports = Devis;
