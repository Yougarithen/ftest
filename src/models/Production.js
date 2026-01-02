// models/Production.js
const db = require('../database/connection');

class Production {
  /**
   * Récupérer toutes les productions avec détails
   */
  static getAll() {
    const query = `
      SELECT 
        p.*,
        pr.nom as produit_nom,
        pr.unite
      FROM Production p
      JOIN Produit pr ON p.id_produit = pr.id_produit
      ORDER BY p.date_production DESC
    `;
    return db.prepare(query).all();
  }

  /**
   * Récupérer une production par ID
   */
  static getById(id) {
    const query = `
      SELECT 
        p.*,
        pr.nom as produit_nom,
        pr.unite
      FROM Production p
      JOIN Produit pr ON p.id_produit = pr.id_produit
      WHERE p.id_production = ?
    `;
    return db.prepare(query).get(id);
  }

  /**
   * Récupérer les productions d'un produit
   */
  static getByProduit(id_produit) {
    const query = `
      SELECT 
        p.*,
        pr.nom as produit_nom,
        pr.unite
      FROM Production p
      JOIN Produit pr ON p.id_produit = pr.id_produit
      WHERE p.id_produit = ?
      ORDER BY p.date_production DESC
    `;
    return db.prepare(query).all(id_produit);
  }

  /**
   * Créer une entrée de production simple (sans logique)
   */
  static create(data) {
    const { id_produit, quantite_produite, operateur, commentaire } = data;

    if (!id_produit || !quantite_produite || !operateur) {
      throw new Error('Données manquantes (id_produit, quantite_produite, operateur requis)');
    }

    const query = `
      INSERT INTO Production 
      (id_produit, quantite_produite, date_production, operateur, commentaire)
      VALUES (?, ?, datetime('now'), ?, ?)
    `;

    const result = db.prepare(query).run(
      id_produit,
      quantite_produite,
      operateur,
      commentaire || null
    );

    return this.getById(result.lastInsertRowid);
  }

  /**
   * 🎯 PRODUIRE - Simplifié avec triggers SQL
   * Les triggers se chargent automatiquement de :
   * - Vérifier le stock des matières premières (BEFORE INSERT)
   * - Déduire les matières premières (AFTER INSERT)
   * - Augmenter le stock du produit fini (AFTER INSERT)
   * - Enregistrer dans AjustementStock (AFTER INSERT - optionnel)
   */
  static produire(id_produit, quantite_produite, operateur, commentaire = null) {
    // Validation de base
    if (!id_produit || !quantite_produite || !operateur) {
      throw new Error('Données manquantes (id_produit, quantite_produite, operateur requis)');
    }

    if (quantite_produite <= 0) {
      throw new Error('La quantité doit être supérieure à 0');
    }

    // Vérifier que le produit existe
    const produit = db.prepare('SELECT * FROM Produit WHERE id_produit = ?').get(id_produit);
    if (!produit) {
      throw new Error('Produit non trouvé');
    }

    try {
      // ✅ SIMPLE : Juste insérer dans Production
      // Les triggers font tout le reste automatiquement !
      const result = db.prepare(`
        INSERT INTO Production 
        (id_produit, quantite_produite, date_production, operateur, commentaire)
        VALUES (?, ?, datetime('now'), ?, ?)
      `).run(id_produit, quantite_produite, operateur, commentaire || null);

      // Récupérer la production créée avec les détails
      const production = this.getById(result.lastInsertRowid);
      
      return production;

    } catch (error) {
      // Les triggers peuvent lever des erreurs RAISE(ABORT, 'message')
      // qui seront catchées ici
      
      // Vérifier si c'est une erreur de stock insuffisant
      if (error.message.includes('Stock insuffisant')) {
        throw new Error('Stock insuffisant pour une ou plusieurs matières premières');
      }
      
      if (error.message.includes('Aucune recette')) {
        throw new Error('Aucune recette définie pour ce produit. Veuillez d\'abord créer une recette.');
      }

      // Autres erreurs
      throw error;
    }
  }

  /**
   * Vérifier le stock avant production
   * Utile pour l'interface utilisateur (afficher les alertes)
   */
  static verifierStock(id_produit, quantite) {
    if (quantite <= 0) {
      throw new Error('La quantité doit être supérieure à 0');
    }

    const recette = db.prepare(`
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
      WHERE r.id_produit = ?
    `).all(id_produit);

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

  /**
   * Supprimer une production
   * Note : Tu pourrais ajouter un trigger pour annuler les mouvements de stock
   */
  static delete(id) {
    const production = this.getById(id);
    if (!production) {
      throw new Error('Production non trouvée');
    }

    db.prepare('DELETE FROM Production WHERE id_production = ?').run(id);
    return true;
  }
}

module.exports = Production;