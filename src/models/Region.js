// Model pour les régions des bons de livraison - PostgreSQL
const pool = require('../database/connection');

class Region {
    
    /**
     * Récupérer toutes les régions
     */
    static async getAll() {
        const result = await pool.query(`
            SELECT 
                r.id_region,
                r.id_bon_livraison,
                r.nom_region,
                r.nom_chauffeur,
                r.frais_transport,
                r.date_creation,
                r.date_modification,
                f.numero_facture,
                f.date_facture,
                f.statut,
                c.nom as client,
                COALESCE(SUM(lf.quantite * lf.prix_ttc * (1 - lf.remise_ligne / 100)), 0) as montant_ttc
            FROM Region r
            INNER JOIN Facture f ON r.id_bon_livraison = f.id_facture
            LEFT JOIN Client c ON f.id_client = c.id_client
            LEFT JOIN LigneFacture lf ON f.id_facture = lf.id_facture
            WHERE f.type_facture = 'BON_LIVRAISON'
            GROUP BY r.id_region, f.numero_facture, f.date_facture, f.statut, c.nom
            ORDER BY r.date_creation DESC
        `);
        
        return result.rows;
    }
    
    /**
     * Récupérer une région par son ID
     */
    static async getById(id) {
        const result = await pool.query(`
            SELECT 
                r.id_region,
                r.id_bon_livraison,
                r.nom_region,
                r.nom_chauffeur,
                r.frais_transport,
                r.date_creation,
                r.date_modification,
                f.numero_facture,
                f.date_facture,
                f.statut,
                f.id_client,
                c.nom as client,
                COALESCE(SUM(lf.quantite * lf.prix_ttc * (1 - lf.remise_ligne / 100)), 0) as montant_ttc
            FROM Region r
            INNER JOIN Facture f ON r.id_bon_livraison = f.id_facture
            LEFT JOIN Client c ON f.id_client = c.id_client
            LEFT JOIN LigneFacture lf ON f.id_facture = lf.id_facture
            WHERE r.id_region = $1 AND f.type_facture = 'BON_LIVRAISON'
            GROUP BY r.id_region, f.numero_facture, f.date_facture, f.statut, f.id_client, c.nom
        `, [id]);
        
        return result.rows[0] || null;
    }
    
    /**
     * Récupérer une région par ID de bon de livraison
     */
    static async getByBonLivraison(idBonLivraison) {
        const result = await pool.query(`
            SELECT 
                r.id_region,
                r.id_bon_livraison,
                r.nom_region,
                r.nom_chauffeur,
                r.frais_transport,
                r.date_creation,
                r.date_modification
            FROM Region r
            WHERE r.id_bon_livraison = $1
        `, [idBonLivraison]);
        
        return result.rows[0] || null;
    }
    
    /**
     * Créer une nouvelle région pour un bon de livraison
     */
    static async create(data) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Vérifier que c'est bien un bon de livraison
            const bonCheck = await client.query(`
                SELECT id_facture, type_facture 
                FROM Facture 
                WHERE id_facture = $1
            `, [data.id_bon_livraison]);
            
            if (bonCheck.rows.length === 0) {
                throw new Error('Bon de livraison introuvable');
            }
            
            if (bonCheck.rows[0].type_facture !== 'BON_LIVRAISON') {
                throw new Error('La facture doit être de type BON_LIVRAISON');
            }
            
            // Vérifier si une région existe déjà pour ce BL
            const regionExistante = await client.query(`
                SELECT id_region 
                FROM Region 
                WHERE id_bon_livraison = $1
            `, [data.id_bon_livraison]);
            
            if (regionExistante.rows.length > 0) {
                throw new Error('Une région est déjà assignée à ce bon de livraison');
            }
            
            // Insérer la région
            const result = await client.query(`
                INSERT INTO Region (id_bon_livraison, nom_region, nom_chauffeur, frais_transport)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [
                data.id_bon_livraison,
                data.nom_region,
                data.nom_chauffeur || null,
                data.frais_transport || 0
            ]);
            
            await client.query('COMMIT');
            return result.rows[0];
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Mettre à jour une région
     */
    static async update(id, data) {
        const result = await pool.query(`
            UPDATE Region 
            SET nom_region = $1,
                nom_chauffeur = $2,
                frais_transport = $3
            WHERE id_region = $4
            RETURNING *
        `, [
            data.nom_region,
            data.nom_chauffeur || null,
            data.frais_transport || 0,
            id
        ]);
        
        if (result.rows.length === 0) {
            throw new Error('Région introuvable');
        }
        
        return result.rows[0];
    }
    
    /**
     * Supprimer une région
     */
    static async delete(id) {
        const result = await pool.query(`
            DELETE FROM Region 
            WHERE id_region = $1
            RETURNING *
        `, [id]);
        
        if (result.rows.length === 0) {
            throw new Error('Région introuvable');
        }
        
        return result.rows[0];
    }
    
    /**
     * Récupérer toutes les régions par nom de région
     */
    static async getByNomRegion(nomRegion) {
        const result = await pool.query(`
            SELECT 
                r.id_region,
                r.id_bon_livraison,
                r.nom_region,
                r.nom_chauffeur,
                r.frais_transport,
                r.date_creation,
                r.date_modification,
                f.numero_facture,
                f.date_facture,
                f.statut,
                c.nom as client,
                COALESCE(SUM(lf.quantite * lf.prix_ttc * (1 - lf.remise_ligne / 100)), 0) as montant_ttc
            FROM Region r
            INNER JOIN Facture f ON r.id_bon_livraison = f.id_facture
            LEFT JOIN Client c ON f.id_client = c.id_client
            LEFT JOIN LigneFacture lf ON f.id_facture = lf.id_facture
            WHERE r.nom_region = $1 AND f.type_facture = 'BON_LIVRAISON'
            GROUP BY r.id_region, f.numero_facture, f.date_facture, f.statut, c.nom
            ORDER BY r.date_creation DESC
        `, [nomRegion]);
        
        return result.rows;
    }
    
    /**
     * Récupérer toutes les régions par chauffeur
     */
    static async getByChauffeur(nomChauffeur) {
        const result = await pool.query(`
            SELECT 
                r.id_region,
                r.id_bon_livraison,
                r.nom_region,
                r.nom_chauffeur,
                r.frais_transport,
                r.date_creation,
                r.date_modification,
                f.numero_facture,
                f.date_facture,
                f.statut,
                c.nom as client,
                COALESCE(SUM(lf.quantite * lf.prix_ttc * (1 - lf.remise_ligne / 100)), 0) as montant_ttc
            FROM Region r
            INNER JOIN Facture f ON r.id_bon_livraison = f.id_facture
            LEFT JOIN Client c ON f.id_client = c.id_client
            LEFT JOIN LigneFacture lf ON f.id_facture = lf.id_facture
            WHERE r.nom_chauffeur = $1 AND f.type_facture = 'BON_LIVRAISON'
            GROUP BY r.id_region, f.numero_facture, f.date_facture, f.statut, c.nom
            ORDER BY r.date_creation DESC
        `, [nomChauffeur]);
        
        return result.rows;
    }
    
    /**
     * Statistiques par région
     */
    static async getStatistiquesParRegion() {
        const result = await pool.query(`
            SELECT 
                r.nom_region,
                COUNT(r.id_region) as nombre_livraisons,
                COALESCE(SUM(r.frais_transport), 0) as total_frais_transport,
                COALESCE(AVG(r.frais_transport), 0) as moyenne_frais_transport,
                COALESCE(SUM(
                    (SELECT COALESCE(SUM(lf.quantite * lf.prix_ttc * (1 - lf.remise_ligne / 100)), 0)
                     FROM LigneFacture lf 
                     WHERE lf.id_facture = r.id_bon_livraison)
                ), 0) as montant_total_ttc
            FROM Region r
            INNER JOIN Facture f ON r.id_bon_livraison = f.id_facture
            WHERE f.type_facture = 'BON_LIVRAISON'
            GROUP BY r.nom_region
            ORDER BY nombre_livraisons DESC
        `);
        
        return result.rows;
    }
    
    /**
     * Bons de livraison sans région assignée
     */
    static async getBonsLivraisonSansRegion() {
        const result = await pool.query(`
            SELECT 
                f.id_facture,
                f.numero_facture,
                f.date_facture,
                f.statut,
                f.id_client,
                c.nom as client,
                COALESCE(SUM(lf.quantite * lf.prix_ttc * (1 - lf.remise_ligne / 100)), 0) as montant_ttc
            FROM Facture f
            LEFT JOIN Client c ON f.id_client = c.id_client
            LEFT JOIN LigneFacture lf ON f.id_facture = lf.id_facture
            WHERE f.type_facture = 'BON_LIVRAISON'
                AND f.id_facture NOT IN (SELECT id_bon_livraison FROM Region)
            GROUP BY f.id_facture, c.nom
            ORDER BY f.date_facture DESC
        `);
        
        return result.rows;
    }
}

module.exports = Region;
