// scripts/seedAdmin.js
// Script pour créer un utilisateur administrateur par défaut
require('dotenv').config();
const UserModel = require('../models/userModel');

async function createDefaultAdmin() {
  try {
    console.log('🔧 Création de l\'utilisateur administrateur par défaut...');

    // Vérifier si un admin existe déjà
    const existingAdmin = UserModel.findByUsername('admin');
    
    if (existingAdmin) {
      console.log('ℹ️  Un administrateur existe déjà');
      console.log('Nom d\'utilisateur:', existingAdmin.nom_utilisateur);
      console.log('Email:', existingAdmin.email);
      return;
    }

    // Créer l'admin par défaut
    const admin = await UserModel.create({
      nom_utilisateur: 'admin',
      email: 'admin@exemple.com',
      mot_de_passe: 'admin123', // À CHANGER EN PRODUCTION !
      nom_complet: 'Administrateur Système',
      id_role: 1 // Rôle ADMIN
    });

    console.log('✅ Administrateur créé avec succès !');
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📋 INFORMATIONS DE CONNEXION');
    console.log('═══════════════════════════════════════');
    console.log('Nom d\'utilisateur: admin');
    console.log('Email: admin@exemple.com');
    console.log('Mot de passe: admin123');
    console.log('');
    console.log('⚠️  IMPORTANT: Changez ce mot de passe immédiatement !');
    console.log('═══════════════════════════════════════');
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error.message);
  }
}

// Exécuter si lancé directement
if (require.main === module) {
  createDefaultAdmin()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = createDefaultAdmin;