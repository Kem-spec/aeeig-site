/* ============================================================
   AEEIG — Constantes partagées (les données réelles viennent
   désormais de Supabase, voir js/app.js).
   ============================================================ */

// Classe CSS de la pastille de type de document (bibliothèque)
const DOC_TYPE_CLASS = {
  "Mémoire": "dt-memoire",
  "Thèse":   "dt-these",
  "Cours":   "dt-cours",
  "Livre":   "dt-livre",
  "Guide":   "dt-guide",
};

// Options proposées dans l'éditeur d'actualités (admin)
const NEWS_COVERS = ["cover-1", "cover-2", "cover-3", "cover-4", "cover-5", "cover-6"];
const NEWS_CATEGORIES = [
  "Vie associative", "Adhésions", "Sport & culture",
  "Académique", "Entraide", "Bibliothèque",
];

// Listes partagées inscription ↔ profil (une seule source de vérité)
const UNIVERSITES = [
  "Université Gamal Abdel Nasser de Conakry",
  "Université Général Lansana Conté de Sonfonia",
  "Université Kofi Annan de Guinée",
  "Université la Source",
  "Institut Supérieur de Technologie de Mamou",
];
const FACULTES = [
  "Faculté de Médecine",
  "Faculté de Pharmacie",
  "Faculté d'Odonto-Stomatologie",
  "Faculté des Sciences et Techniques",
  "Faculté de Droit et Sciences Politiques",
  "Faculté des Sciences Économiques et de Gestion",
  "Faculté des Lettres et Sciences Humaines",
  "Faculté des Sciences Sociales",
  "Institut Polytechnique (Génie)",
];
