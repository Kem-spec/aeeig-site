-- ============================================================
--  AEEIG — Stockage de fichiers (Supabase Storage)
--  À exécuter dans SQL Editor. Crée 2 espaces :
--   - covers        : images de couverture des actualités (public)
--   - bibliotheque  : documents PDF/Word/PPT (privé, réservé aux connectés)
-- ============================================================

-- Espaces de stockage
insert into storage.buckets (id, name, public) values ('covers', 'covers', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('bibliotheque', 'bibliotheque', false)
  on conflict (id) do nothing;

-- Colonnes liées
alter table public.news         add column if not exists cover_url text;
alter table public.library_docs add column if not exists file_name text;

-- ----- Politiques Storage (RLS sur storage.objects) -----

-- Couvertures : lisibles par tous, modifiables par l'admin
drop policy if exists covers_read  on storage.objects;
create policy covers_read on storage.objects for select using (bucket_id = 'covers');
drop policy if exists covers_admin on storage.objects;
create policy covers_admin on storage.objects for all
  using (bucket_id = 'covers' and public.is_admin())
  with check (bucket_id = 'covers' and public.is_admin());

-- Documents : lecture réservée aux membres / abonnés / admin ; écriture admin
drop policy if exists biblio_read  on storage.objects;
create policy biblio_read on storage.objects for select using (
  bucket_id = 'bibliotheque' and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and (p.role in ('membre','abonne') or p.is_admin)
  ));
drop policy if exists biblio_admin on storage.objects;
create policy biblio_admin on storage.objects for all
  using (bucket_id = 'bibliotheque' and public.is_admin())
  with check (bucket_id = 'bibliotheque' and public.is_admin());
