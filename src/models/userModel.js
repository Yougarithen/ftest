// src/models/userModel.js - PostgreSQL
const pool = require('../database/connection');
const bcrypt = require('bcryptjs');

class userModel {
  // Créer un nouvel utilisateur
  static async create({ nom_utilisateur, email, mot_de_passe, nom_complet, id_role = 5 }) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await pool.query(
        'SELECT * FROM Utilisateur WHERE nom_utilisateur = $1 OR email = $2',
        [nom_utilisateur, email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('Nom d\'utilisateur ou email déjà utilisé');
      }

      // Hasher le mot de passe
      const mot_de_passe_hash = await bcrypt.hash(mot_de_passe, 10);

      // Insérer l'utilisateur
      const result = await pool.query(`
        INSERT INTO Utilisateur (nom_utilisateur, email, mot_de_passe_hash, nom_complet, id_role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id_utilisateur
      `, [nom_utilisateur, email, mot_de_passe_hash, nom_complet, id_role]);

      return this.findById(result.rows[0].id_utilisateur);
    } catch (error) {
      throw error;
    }
  }

  // Trouver un utilisateur par ID
  static async findById(id) {
    const result = await pool.query(`
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
      WHERE u.id_utilisateur = $1
    `, [id]);
    return result.rows[0];
  }

  // Trouver un utilisateur par email
  static async findByEmail(email) {
    const result = await pool.query(`
      SELECT 
        u.*,
        r.nom as role,
        r.description as role_description
      FROM Utilisateur u
      JOIN Role r ON u.id_role = r.id_role
      WHERE u.email = $1
    `, [email]);
    return result.rows[0];
  }

  // Trouver un utilisateur par nom d'utilisateur
  static async findByUsername(nom_utilisateur) {
    const result = await pool.query(`
      SELECT 
        u.*,
        r.nom as role,
        r.description as role_description
      FROM Utilisateur u
      JOIN Role r ON u.id_role = r.id_role
      WHERE u.nom_utilisateur = $1
    `, [nom_utilisateur]);
    return result.rows[0];
  }

  // Obtenir tous les utilisateurs
  static async getAll() {
    const result = await pool.query(`
      SELECT * FROM Vue_UtilisateursComplet
      ORDER BY date_creation DESC
    `);
    return result.rows;
  }

  // Vérifier le mot de passe
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Mettre à jour la dernière connexion
  static async updateLastLogin(id) {
    const result = await pool.query(`
      UPDATE Utilisateur 
      SET derniere_connexion = CURRENT_TIMESTAMP 
      WHERE id_utilisateur = $1
      RETURNING *
    `, [id]);
    return result.rowCount;
  }

  // Mettre à jour un utilisateur
  static async update(id, { nom_complet, email, id_role, actif }) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (nom_complet !== undefined) {
      updates.push(`nom_complet = $${paramIndex++}`);
      values.push(nom_complet);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (id_role !== undefined) {
      updates.push(`id_role = $${paramIndex++}`);
      values.push(id_role);
    }
    if (actif !== undefined) {
   updates.push(`actif = $${paramIndex++}`);
  values.push(actif);  // ✅ Passe directement le boolean, pas 1 ou 0
    }

    updates.push(`date_modification = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE Utilisateur SET ${updates.join(', ')} WHERE id_utilisateur = $${paramIndex}`;
    await pool.query(query, values);

    return this.findById(id);
  }

  // Changer le mot de passe
  static async changePassword(id, newPassword) {
    const mot_de_passe_hash = await bcrypt.hash(newPassword, 10);
    await pool.query(`
      UPDATE Utilisateur 
      SET mot_de_passe_hash = $1, date_modification = CURRENT_TIMESTAMP 
      WHERE id_utilisateur = $2
    `, [mot_de_passe_hash, id]);
    return true;
  }

  // Supprimer un utilisateur
  static async delete(id) {
    const result = await pool.query('DELETE FROM Utilisateur WHERE id_utilisateur = $1', [id]);
    return result.rowCount;
  }

  // Obtenir les permissions d'un utilisateur
  static async getPermissions(id) {
    // Permissions via le rôle
    const rolePermissions = await pool.query(`
      SELECT DISTINCT p.nom
      FROM Permission p
      JOIN RolePermission rp ON p.id_permission = rp.id_permission
      JOIN Utilisateur u ON rp.id_role = u.id_role
      WHERE u.id_utilisateur = $1
    `, [id]);

    // Permissions individuelles
    const userPermissions = await pool.query(`
      SELECT DISTINCT p.nom
      FROM Permission p
      JOIN UtilisateurPermission up ON p.id_permission = up.id_permission
      WHERE up.id_utilisateur = $1
    `, [id]);

    // Combiner et retourner un tableau unique
    const allPermissions = [...rolePermissions.rows, ...userPermissions.rows];
    return [...new Set(allPermissions.map(p => p.nom))];
  }

  // Vérifier si un utilisateur a une permission spécifique
  static async hasPermission(id, permissionName) {
    const permissions = await this.getPermissions(id);
    return permissions.includes(permissionName);
  }

  // Attribuer une permission individuelle à un utilisateur
  static async grantPermission(userId, permissionId) {
    const result = await pool.query(`
      INSERT INTO UtilisateurPermission (id_utilisateur, id_permission)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING *
    `, [userId, permissionId]);
    return result.rowCount;
  }

  // Retirer une permission individuelle à un utilisateur
  static async revokePermission(userId, permissionId) {
    const result = await pool.query(`
      DELETE FROM UtilisateurPermission 
      WHERE id_utilisateur = $1 AND id_permission = $2
    `, [userId, permissionId]);
    return result.rowCount;
  }
}

module.exports = userModel;
