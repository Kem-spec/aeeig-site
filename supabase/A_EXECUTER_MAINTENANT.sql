-- ============================================================
--  AEEIG — SQL À EXÉCUTER MAINTENANT
--  Supabase → SQL Editor → New query → coller → Run
--  Regroupe : correctif de sécurité CRITIQUE + nouvelles colonnes.
-- ============================================================

-- 1) Nouvelles colonnes (téléphone du membre, matière + sujet des documents)
alter table public.profiles     add column if not exists telephone text;
alter table public.library_docs add column if not exists matiere text;
alter table public.library_docs add column if not exists sujet   text;

-- 2) SÉCURITÉ (CRITIQUE) — empêche un membre de se donner les droits admin.
--    Les utilisateurs ne peuvent modifier que ces colonnes de leur profil ;
--    role / is_admin ne changent que via les fonctions serveur (SECURITY DEFINER).
revoke update on public.profiles from anon, authenticated;
grant  update (full_name, universite, faculte, niveau, sexe, telephone)
  on public.profiles to authenticated;
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (public.is_admin() or (id = auth.uid() and is_admin = false and role <> 'admin'));

-- 3) Catégorie d'actualité « Vie associative » -> « Vie de l'amicale »
update public.news set categorie = 'Vie de l''amicale' where categorie = 'Vie associative';

-- 4) Neutraliser TOUS les comptes de test créés pendant les audits
update public.profiles set is_admin = false, role = 'pending'
  where email like '%@exemple.test';
-- (ensuite : supprimez ces comptes dans Authentication -> Users)
