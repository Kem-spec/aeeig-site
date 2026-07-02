-- ============================================================
--  AEEIG — Migration : niveau/sexe, bulletins, dépôts à valider
--  À exécuter dans SQL Editor (Run). Sans risque, idempotent.
-- ============================================================

-- 1) Profil : sexe + niveau universitaire
alter table public.profiles add column if not exists sexe   text;
alter table public.profiles add column if not exists niveau text;

-- 2) Bibliothèque : statut de validation + auteur du dépôt
alter table public.library_docs add column if not exists status text not null default 'approved';
alter table public.library_docs add column if not exists submitted_by uuid references public.profiles(id) on delete set null;
update public.library_docs set status = 'approved' where status is null;

-- 3) RLS bibliothèque : lecture des approuvés (tous) + ses propres dépôts + admin
drop policy if exists lib_public_read on public.library_docs;
drop policy if exists lib_admin_write on public.library_docs;
drop policy if exists lib_read   on public.library_docs;
drop policy if exists lib_write  on public.library_docs;
drop policy if exists lib_insert on public.library_docs;
drop policy if exists lib_update on public.library_docs;
drop policy if exists lib_delete on public.library_docs;

create policy lib_read on public.library_docs for select using (
  status = 'approved' or public.is_admin() or submitted_by = auth.uid()
);
-- un membre ne peut créer qu'un dépôt "pending" à son nom ; l'admin peut tout
create policy lib_insert on public.library_docs for insert with check (
  public.is_admin() or (submitted_by = auth.uid() and status = 'pending')
);
create policy lib_update on public.library_docs for update using (public.is_admin()) with check (public.is_admin());
create policy lib_delete on public.library_docs for delete using (public.is_admin());

-- 4) Table des bulletins (privés)
create table if not exists public.bulletins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade,
  periode    text,
  file_path  text,
  file_name  text,
  created_at timestamptz not null default now()
);
alter table public.bulletins enable row level security;
drop policy if exists bulletins_own on public.bulletins;
create policy bulletins_own on public.bulletins for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- 5) Stockage : nouveau bucket bulletins (privé)
insert into storage.buckets (id, name, public) values ('bulletins', 'bulletins', false)
  on conflict (id) do nothing;

-- Les membres/abonnés peuvent téléverser dans "bibliotheque" (dépôts)
drop policy if exists biblio_member_upload on storage.objects;
create policy biblio_member_upload on storage.objects for insert with check (
  bucket_id = 'bibliotheque' and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and (p.role in ('membre','abonne') or p.is_admin)
  ));

-- Bulletins : chacun accède à son propre dossier (préfixe = son id), admin voit tout
drop policy if exists bull_read  on storage.objects;
create policy bull_read on storage.objects for select using (
  bucket_id = 'bulletins' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
drop policy if exists bull_write on storage.objects;
create policy bull_write on storage.objects for insert with check (
  bucket_id = 'bulletins' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists bull_delete on storage.objects;
create policy bull_delete on storage.objects for delete using (
  bucket_id = 'bulletins' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
