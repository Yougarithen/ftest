# 🚀 GUIDE DE MIGRATION SQLite → PostgreSQL
## Tous vos models sont convertis et prêts !

---

## ✅ FICHIERS CONVERTIS (16 models)

### 📦 Configuration
- `connection.js` - Connexion PostgreSQL avec pool

### 👥 Gestion des utilisateurs
- `userModel.js` - Authentification et permissions

### 📊 Données de base
- `Client.js` - Gestion des clients
- `MatierePremiere.js` - Matières premières avec ajustement stock
- `Produit.js` - Produits finis avec recettes

### 📝 Documents commerciaux
- `Devis.js` - Devis avec conversion en facture
- `Facture.js` - Factures avec calculs complexes
- `LigneDevis.js` - Lignes de devis
- `LigneFacture.js` - Lignes de factures
- `Paiement.js` - Paiements

### 🏭 Production
- `Production.js` - Productions avec vérification stock
- `RecetteProduction.js` - Recettes de production

### 📦 Inventaire
- `Inventaire.js` - Inventaires avec clôture
- `InventaireMatiere.js` - Lignes inventaire matières
- `InventaireProduit.js` - Lignes inventaire produits
- `AjustementStock.js` - Historique des ajustements

---

## 🔄 PRINCIPAUX CHANGEMENTS

### 1. Syntaxe des requêtes
```javascript
// ❌ SQLite (AVANT)
const stmt = db.prepare('SELECT * FROM Client WHERE id = ?');
const client = stmt.get(id);

// ✅ PostgreSQL (APRÈS)
const result = await pool.query('SELECT * FROM Client WHERE id = $1', [id]);
const client = result.rows[0];
```

### 2. Style de programmation
```javascript
// ❌ SQLite - Synchrone
static getAll() {
  const stmt = db.prepare('SELECT * FROM Client');
  return stmt.all();
}

// ✅ PostgreSQL - Asynchrone
static async getAll() {
  const result = await pool.query('SELECT * FROM Client');
  return result.rows;
}
```

### 3. Placeholders
- SQLite: `?`, `?`, `?`
- PostgreSQL: `$1`, `$2`, `$3`

### 4. Résultats des requêtes
- SQLite: Retourne directement les données
- PostgreSQL: Retourne `result.rows` (array) ou `result.rows[0]` (objet unique)

### 5. Transactions
```javascript
// ❌ SQLite
db.serialize(() => {
  db.run('BEGIN');
  db.run(query1);
  db.run(query2);
  db.run('COMMIT');
});

// ✅ PostgreSQL
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query(query1);
  await client.query(query2);
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

---

## 📋 CHECKLIST DE MIGRATION

### Étape 1: Créer la base PostgreSQL sur Railway
- [ ] Aller dans votre projet Railway
- [ ] Cliquer sur **+ New → Database → PostgreSQL**
- [ ] Noter le `DATABASE_URL`

### Étape 2: Créer le schéma PostgreSQL
Je vais créer le fichier `schema-postgres.sql` pour vous.
- [ ] Exécuter le schéma dans votre base PostgreSQL

### Étape 3: Copier les nouveaux models
- [ ] Remplacer tous les fichiers dans `src/models/`
- [ ] Remplacer `src/database/connection.js`

### Étape 4: Mettre à jour les controllers
Les controllers devront être modifiés pour utiliser `async/await`.
(Je vais vous aider avec ça ensuite)

### Étape 5: Variables d'environnement
Ajouter dans votre `.env`:
```env
DATABASE_URL=postgresql://postgres:password@host:port/database
NODE_ENV=production
```

### Étape 6: Dépendances
Mettre à jour `package.json`:
```bash
npm uninstall better-sqlite3
npm install pg
```

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Models convertis (FAIT)
2. ⏳ Créer le schéma PostgreSQL
3. ⏳ Convertir les controllers
4. ⏳ Migrer les données
5. ⏳ Tester et déployer

---

## 📞 BESOIN D'AIDE ?

Si vous avez des questions sur:
- La création du schéma PostgreSQL
- La conversion des controllers
- La migration des données
- Le déploiement sur Railway

Demandez-moi et je vous guiderai ! 🚀

---

## ⚠️ NOTES IMPORTANTES

### Différences SQL à connaître:
1. **AUTOINCREMENT**
   - SQLite: `INTEGER PRIMARY KEY AUTOINCREMENT`
   - PostgreSQL: `SERIAL PRIMARY KEY` ou `BIGSERIAL PRIMARY KEY`

2. **Date/Heure**
   - SQLite: `CURRENT_TIMESTAMP`, `datetime('now')`
   - PostgreSQL: `CURRENT_TIMESTAMP`, `NOW()`

3. **Types de données**
   - SQLite: `INTEGER`, `TEXT`, `REAL`, `BLOB`
   - PostgreSQL: `INT`, `VARCHAR`, `TEXT`, `NUMERIC`, `DECIMAL`, `BYTEA`

4. **RETURNING**
   - Très utile en PostgreSQL pour récupérer l'ID inséré:
   ```sql
   INSERT INTO Client (...) VALUES (...) RETURNING *;
   ```

5. **Fonctions d'agrégation**
   - SQLite: `ROUND()` fonctionne différemment
   - PostgreSQL: Utiliser `::numeric` pour les conversions

---

**💡 TIP:** Tous ces models sont maintenant compatibles avec Railway PostgreSQL !
