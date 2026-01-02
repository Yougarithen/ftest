// src/models/userModel.js
const db = require('../database/connection');
const bcrypt = require('bcryptjs');

class userModel {
  // Créer un nouvel utilisateur
  static async create({ nom_utilisateur, email, mot_de_passe, nom_complet, id_role = 5 }) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = db.prepare(
        'SELECT * FROM Utilisateur WHERE nom_utilisateur = ? OR email = ?'
      ).get(nom_utilisateur, email);

      if (existingUser) {
        throw new Error('Nom d\'utilisateur ou email déjà utilisé');
      }

      // Hasher le mot de passe
      const mot_de_passe_hash = await bcrypt.hash(mot_de_passe, 10);

      // Insérer l'utilisateur
      const result = db.prepare(`
        INSERT INTO Utilisateur (nom_utilisateur, email, mot_de_passe_hash, nom_complet, id_role)
        VALUES (?, ?, ?, ?, ?)
      `).run(nom_utilisateur, email, mot_de_passe_hash, nom_complet, id_role);

      return this.findById(result.lastInsertRowid);
    } catch (error) {
      throw error;
    }
  }

  // Trouver un utilisateur par ID
  static findById(id) {
    return db.prepare(`
      SELECT 
        u.id_utilisateur,
        u.nom_utilisateur,
        u.email,
        u.nom_complet,
        u.actif,
        u.derniere_connexion,
        u.date_creation,
        r.id_role,
        r.nom as role,
        r.description as role_description
      FROM Utilisateur u
      JOIN Role r ON u.id_role = r.id_role
      WHERE u.id_utilisateur = ?
    `).get(id);
  }

  // Trouver un utilisateur par email
  static findByEmail(email) {
    return db.prepare(`
      SELECT 
        u.*,
        r.nom as role,
        r.description as role_description
      FROM Utilisateur u
      JOIN Role r ON u.id_role = r.id_role
      WHERE u.email = ?
    `).get(email);
  }

  // Trouver un utilisateur par nom d'utilisateur
  static findByUsername(nom_utilisateur) {
    return db.prepare(`
      SELECT 
        u.*,
        r.nom as role,
        r.description as role_description
      FROM Utilisateur u
      JOIN Role r ON u.id_role = r.id_role
      WHERE u.nom_utilisateur = ?
    `).get(nom_utilisateur);
  }

  // Obtenir tous les utilisateurs
  static getAll() {
    return db.prepare(`
      SELECT * FROM Vue_UtilisateursComplet
      ORDER BY date_creation DESC
    `).all();
  }

  // Vérifier le mot de passe
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Mettre à jour la dernière connexion
  static updateLastLogin(id) {
    return db.prepare(`
      UPDATE Utilisateur 
      SET derniere_connexion = CURRENT_TIMESTAMP 
      WHERE id_utilisateur = ?
    `).run(id);
  }

  // Mettre à jour un utilisateur
  static update(id, { nom_complet, email, id_role, actif }) {
    const updates = [];
    const values = [];

    if (nom_complet !== undefined) {
      updates.push('nom_complet = ?');
      values.push(nom_complet);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (id_role !== undefined) {
      updates.push('id_role = ?');
      values.push(id_role);
    }
    if (actif !== undefined) {
      updates.push('actif = ?');
      values.push(actif ? 1 : 0);
    }

    updates.push('date_modification = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE Utilisateur SET ${updates.join(', ')} WHERE id_utilisateur = ?`;
    db.prepare(query).run(...values);

    return this.findById(id);
  }

  // Changer le mot de passe
  static async changePassword(id, newPassword) {
    const mot_de_passe_hash = await bcrypt.hash(newPassword, 10);
    db.prepare(`
      UPDATE Utilisateur 
      SET mot_de_passe_hash = ?, date_modification = CURRENT_TIMESTAMP 
      WHERE id_utilisateur = ?
    `).run(mot_de_passe_hash, id);
    return true;
  }

  // Supprimer un utilisateur
  static delete(id) {
    return db.prepare('DELETE FROM Utilisateur WHERE id_utilisateur = ?').run(id);
  }

  // Obtenir les permissions d'un utilisateur
  static getPermissions(id) {
    // Permissions via le rôle
    const rolePermissions = db.prepare(`
      SELECT DISTINCT p.nom
      FROM Permission p
      JOIN RolePermission rp ON p.id_permission = rp.id_permission
      JOIN Utilisateur u ON rp.id_role = u.id_role
      WHERE u.id_utilisateur = ?
    `).all(id);

    // Permissions individuelles
    const userPermissions = db.prepare(`
      SELECT DISTINCT p.nom
      FROM Permission p
      JOIN UtilisateurPermission up ON p.id_permission = up.id_permission
      WHERE up.id_utilisateur = ?
    `).all(id);

    // Combiner et retourner un tableau unique
    const allPermissions = [...rolePermissions, ...userPermissions];
    return [...new Set(allPermissions.map(p => p.nom))];
  }

  // Vérifier si un utilisateur a une permission spécifique
  static hasPermission(id, permissionName) {
    const permissions = this.getPermissions(id);
    return permissions.includes(permissionName);
  }

  // Attribuer une permission individuelle à un utilisateur
  static grantPermission(userId, permissionId) {
    return db.prepare(`
      INSERT OR IGNORE INTO UtilisateurPermission (id_utilisateur, id_permission)
      VALUES (?, ?)
    `).run(userId, permissionId);
  }

  // Retirer une permission individuelle à un utilisateur
  static revokePermission(userId, permissionId) {
    return db.prepare(`
      DELETE FROM UtilisateurPermission 
      WHERE id_utilisateur = ? AND id_permission = ?
    `).run(userId, permissionId);
  }
}

module.exports = userModel;