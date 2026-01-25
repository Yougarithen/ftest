// addUsers.js
const userModel = require('./src/models/userModel');

async function addUsers() {
    try {
        // 1. LADDAOUI Brahim (Administrateur)
        console.log('Création de Nihad...');
        await userModel.create({
            nom_utilisateur: 'TABOUDA_NIHAD',
            email: 'klinkol.tabouda-nihad@gmail.com',
            mot_de_passe: 'T@boud@N',
            nom_complet: 'TABOUDA Nihad',
            id_role: 1 // ADMIN
        });
        console.log('✅ LADDAOUI Brahim créé avec succès');

        //// 2. Wail (Droits personnalisés)
        //console.log('Création de Wail...');
        //const wail = await userModel.create({
        //    nom_utilisateur: 'wail',
        //    email: 'klinkol.wail@gmail.com',
        //    mot_de_passe: 'Wa!l456',
        //    nom_complet: 'Wail',
        //    id_role: 5 // LECTEUR
        //});
        //console.log('✅ Wail créé avec succès');

        //// Ajouter les permissions individuelles pour Wail
        //console.log('Attribution des permissions à Wail...');
        //const permissions = [5, 9, 13, 30, 31, 32, 33, 14, 15, 16];
        //for (const perm of permissions) {
        //    await userModel.grantPermission(wail.id_utilisateur, perm);
        //}
        //console.log('✅ Permissions attribuées à Wail');

        console.log('\n🎉 Tous les utilisateurs créés avec succès !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

addUsers();