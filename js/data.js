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
