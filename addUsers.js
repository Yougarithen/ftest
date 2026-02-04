// addUsers.js
const userModel = require('./src/models/userModel');

async function addUsers() {
    try {
        // 1. 
        console.log('Création de Nihad...');
        await userModel.create({
            nom_utilisateur: 'HAMRI Mohamed Nadir',
            email: 'klinkol.HAMRI-MOHAMED-NADIR@gmail.com',
            mot_de_passe: 'HMN@dir',
            nom_complet: 'HAMRI Mohamed Nadir',
            id_role: 1 // ADMIN
        });
        console.log('✅ LADDAOUI Brahim créé avec succès');

        // 2. 
        console.log('Création de Wail...');
        const wail = await userModel.create({
            nom_utilisateur: 'KATAB Mohamed Lamine',
            email: 'klinkol.KATAB Mohamed Lamine@gmail.com',
            mot_de_passe: 'KML@mine',
            nom_complet: 'KATAB Mohamed Lamine',
            id_role: 1 // 
        });
        console.log('✅ Wail créé avec succès');

        // Ajouter les permissions individuelles pour Wail
        console.log('Attribution des permissions à Wail...');
        const permissions = [5, 9, 13, 30, 31, 32, 33, 14, 15, 16];
        for (const perm of permissions) {
            await userModel.grantPermission(wail.id_utilisateur, perm);
        }
        console.log('✅ Permissions attribuées à Wail');

        console.log('\n🎉 Tous les utilisateurs créés avec succès !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

addUsers();