// Dans Facture.js - Méthode getAll()

static async getAll() {
    const facturesResult = await pool.query(`
      SELECT 
        f.id_facture,
        f.numero_facture,
        f.id_client,
        c.nom as client,
        f.date_facture,
        f.date_echeance,
        f.statut,
        f.type_facture,
        f.remise_globale,
        f.conditions_paiement,  -- ✅ AJOUTÉ
        f.notes,                -- ✅ AJOUTÉ
        COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100)), 0) as montant_ht,
        COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100) * lf.taux_tva / 100), 0) as montant_tva,
        COALESCE(SUM(lf.quantite * lf.prix_unitaire_ht * (1 - lf.remise_ligne / 100) * (1 + lf.taux_tva / 100)), 0) as montant_ttc
      FROM Facture f
      LEFT JOIN Client c ON f.id_client = c.id_client
      LEFT JOIN LigneFacture lf ON f.id_facture = lf.id_facture
      GROUP BY f.id_facture, c.nom, f.type_facture, f.conditions_paiement, f.notes  -- ✅ AJOUTÉ dans GROUP BY
      ORDER BY f.date_facture DESC
    `);

    const factures = facturesResult.rows;

    const paiementsResult = await pool.query(`
      SELECT id_facture, COALESCE(SUM(montant_paye), 0) as montant_paye
      FROM Paiement
      GROUP BY id_facture
    `);

    const paiementsMap = {};
    paiementsResult.rows.forEach(p => {
        paiementsMap[p.id_facture] = parseFloat(p.montant_paye);
    });

    return factures.map(f => ({
        ...f,
        montant_paye: paiementsMap[f.id_facture] || 0,
        montant_restant: parseFloat(f.montant_ttc) - (paiementsMap[f.id_facture] || 0)
    }));
}