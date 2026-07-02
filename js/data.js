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
const FILIERES = [
  "Médecine",
  "Pharmacie",
  "Odonto-Stomatologie",
  "Sciences et Techniques",
  "Droit et Sciences Politiques",
  "Sciences Économiques et de Gestion",
  "Lettres et Sciences Humaines",
  "Sciences Sociales",
  "Génie (Institut Polytechnique)",
  "Sciences de l'Éducation",
  "Agronomie",
];

const NIVEAUX = ["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2", "Synthèse", "Doctorat"];
const SEXES = ["Féminin", "Masculin"];
const DEPOT_TYPES = ["Mémoire", "Thèse", "Article"];

// Niveau visé par un document (les cursus type médecine vont jusqu'à 7 ans)
const NIVEAUX_DOC = [
  "1ère année", "2e année", "3e année", "4e année",
  "5e année", "6e année", "7e année",
  "Master", "Synthèse", "Doctorat", "Tous niveaux",
];
