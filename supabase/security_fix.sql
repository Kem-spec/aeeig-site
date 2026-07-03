-- ============================================================
--  AEEIG — CORRECTIF DE SÉCURITÉ (à exécuter dans SQL Editor)
--  Corrige une escalade de privilèges : un membre pouvait se
--  définir is_admin=true / role='admin' sur son propre profil.
-- ============================================================

-- 1) Les utilisateurs ne peuvent modifier QUE ces colonnes de leur profil.
--    role, is_admin et adhesion_key ne sont plus modifiables directement :
--    seules les fonctions serveur (SECURITY DEFINER) les changent
--    (redeem_adhesion_key, activate_subscription, promotion admin manuelle en SQL).
revoke update on public.profiles from anon, authenticated;
grant  update (full_name, universite, faculte, niveau, sexe)
  on public.profiles to authenticated;

-- 2) Ceinture + bretelles : la policy refuse explicitement qu'un non-admin
--    aboutisse à un profil admin.
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (public.is_admin() or (id = auth.uid() and is_admin = false and role <> 'admin'));

-- 3) Neutraliser les comptes de test créés pendant l'audit de sécurité.
update public.profiles set is_admin = false, role = 'pending'
  where email like 'pentest-%@exemple.test' or email like 'tmp-%@exemple.test' or email like 'test-%@exemple.test';
-- (puis supprimez ces comptes dans Authentication → Users)
