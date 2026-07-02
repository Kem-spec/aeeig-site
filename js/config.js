/* ============================================================
   AEEIG — Configuration Supabase
   La clé "publishable" est PUBLIQUE (prévue pour le navigateur).
   La sécurité réelle est assurée par la RLS côté base de données.
   ============================================================ */
const SUPABASE_URL = "https://fqknoaqwhlqbfdaghcui.supabase.co";
const SUPABASE_KEY = "sb_publishable_tS4OHhIMgkDbgcEMyK184Q_AL7AQLuM";

// Client global (window.supabase vient du script CDN chargé juste avant)
const SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
