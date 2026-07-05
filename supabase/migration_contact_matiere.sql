-- ============================================================
--  AEEIG — Migration : téléphone (profil), matière + sujet (documents)
--  À exécuter dans SQL Editor (Run). Sans risque, idempotent.
-- ============================================================

-- Téléphone de contact du membre (saisi à l'inscription)
alter table public.profiles add column if not exists telephone text;

-- Matière et sujet d'un document de la bibliothèque
alter table public.library_docs add column if not exists matiere text;
alter table public.library_docs add column if not exists sujet   text;

-- Autoriser le membre à écrire son téléphone (colonnes modifiables par l'utilisateur)
grant update (full_name, universite, faculte, niveau, sexe, telephone) on public.profiles to authenticated;

-- Renommer la catégorie d'actualité « Vie associative » -> « Vie de l'amicale »
update public.news set categorie = 'Vie de l''amicale' where categorie = 'Vie associative';
