// Fonctions utilitaires
const db = require('../database/connection');

/**
 * Calculer le montant HT d'une ligne
 */
function calculerMontantHT(quantite, prix_unitaire, remise = 0) {
  return quantite * prix_unitaire * (1 - remise / 100);
}

/**
 * Calculer le montant TTC d'une ligne
 */
function calculerMontantTTC(quantite, prix_unitaire, taux_tva, remise = 0) {
  const montantHT = calculerMontantHT(quantite, prix_unitaire, remise);
  return montantHT * (1 + taux_tva / 100);
}

/**
 * Calculer la TVA
 */
function calculerTVA(montantHT, taux_tva) {
  return montantHT * (taux_tva / 100);
}

/**
 * Formater un montant en DZD
 */
function formaterMontant(montant) {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD'
  }).format(montant);
}

/**
 * Générer un numéro de document automatique
 */
function genererNumeroDocument(prefixe, table, colonne) {
  const stmt = db.prepare(`SELECT ${colonne} FROM ${table} ORDER BY id_${table.toLowerCase()} DESC LIMIT 1`);
  const dernier = stmt.get();
  
  let numero = 1;
  if (dernier) {
    const dernierNum = parseInt(dernier[colonne].split('-')[1]);
    numero = dernierNum + 1;
  }
  
  return `${prefixe}-${String(numero).padStart(3, '0')}`;
}

/**
 * Valider les données requises
 */
function validerDonneesRequises(data, champsRequis) {
  const champsManquants = [];
  
  champsRequis.forEach(champ => {
    if (data[champ] === undefined || data[champ] === null || data[champ] === '') {
      champsManquants.push(champ);
    }
  });
  
  if (champsManquants.length > 0) {
    throw new Error(`Champs requis manquants: ${champsManquants.join(', ')}`);
  }
}

/**
 * Formater une date au format DD/MM/YYYY
 */
function formaterDate(date) {
  const d = new Date(date);
  const jour = String(d.getDate()).padStart(2, '0');
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const annee = d.getFullYear();
  return `${jour}/${mois}/${annee}`;
}

/**
 * Vérifier si une date est expirée
 */
function estExpire(date) {
  if (!date) return false;
  return new Date(date) < new Date();
}

/**
 * Calculer le nombre de jours entre deux dates
 */
function joursEntre(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

module.exports = {
  calculerMontantHT,
  calculerMontantTTC,
  calculerTVA,
  formaterMontant,
  genererNumeroDocument,
  validerDonneesRequises,
  formaterDate,
  estExpire,
  joursEntre
};