/* ============================================================
   AEEIG — Constantes partagées (les données réelles viennent
   désormais de Supabase, voir js/app.js).
   ============================================================ */

// Classe CSS de la pastille de type de document (bibliothèque)
const DOC_TYPE_CLASS = {
  "Mémoire": "dt-memoire",
  "Thèse":   "dt-these",
  "Cours":   "dt-cours",
  "Sujet":   "dt-sujet",
  "Article": "dt-article",
  "Livre":   "dt-livre",
  "Guide":   "dt-guide",
};

// Options proposées dans l'éditeur d'actualités (admin)
const NEWS_COVERS = ["cover-1", "cover-2", "cover-3", "cover-4", "cover-5", "cover-6"];
const NEWS_CATEGORIES = [
  "Vie de l'amicale", "Adhésions", "Sport & culture",
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

// Niveaux universitaires — liste unique (LMD + cursus type médecine)
// utilisée à la fois pour le niveau de l'étudiant et le niveau visé d'un document.
const NIVEAUX = [
  "Licence 1 / 1ère année",
  "Licence 2 / 2e année",
  "Licence 3 / 3e année",
  "Master 1 / 4e année",
  "Master 2 / 5e année",
  "6e année",
  "7e année",
  "8e année",
];
const NIVEAUX_DOC = NIVEAUX;   // même référentiel pour les documents (uniforme)
const SEXES = ["Féminin", "Masculin"];
const DEPOT_TYPES = ["Mémoire", "Thèse", "Article", "Sujet", "Cours", "Guide"];
