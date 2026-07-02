-- ============================================================
--  AEEIG — Schéma de base de données (Supabase / PostgreSQL)
--  À exécuter une fois dans : Supabase → SQL Editor → New query → Run
--  Idempotent autant que possible (drop/create).
-- ============================================================

-- ---------- Tables ----------

-- Profils (étend auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'pending'
              check (role in ('pending','membre','abonne','admin')),
  universite  text,
  faculte     text,
  adhesion_key text,
  created_at  timestamptz not null default now()
);

-- Clés d'adhésion (générées par l'admin après paiement de la carte)
create table if not exists public.adhesion_keys (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,
  beneficiaire text,
  statut       text not null default 'générée'
               check (statut in ('générée','remise','utilisée','annulée')),
  annee        text not null default '2026-2027',
  used_by      uuid references auth.users(id) on delete set null,
  used_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- Actualités
create table if not exists public.news (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique,
  titre      text not null,
  date       date not null default current_date,
  categorie  text,
  cover      text not null default 'cover-1',
  extrait    text,
  contenu    text,
  published  boolean not null default true,
  created_at timestamptz not null default now()
);

-- Documents de la bibliothèque (le PDF est dans le Storage : bucket "bibliotheque")
create table if not exists public.library_docs (
  id         uuid primary key default gen_random_uuid(),
  titre      text not null,
  auteur     text,
  type       text,          -- Mémoire, Thèse, Cours, Livre, Guide
  filiere    text,
  annee      int,
  resume     text,
  file_path  text,          -- chemin dans le bucket Storage
  created_at timestamptz not null default now()
);

-- Abonnements des non-membres
create table if not exists public.subscriptions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade,
  debut            date not null default current_date,
  fin              date not null,
  statut           text not null default 'actif'
                   check (statut in ('actif','expiré','suspendu')),
  paiement_ref     text,
  paiement_methode text,
  montant          int,
  created_at       timestamptz not null default now()
);

-- Paramètres modifiables depuis l'admin (téléphone trésorerie, tarif…)
create table if not exists public.settings (
  key   text primary key,
  value text
);

-- ---------- Fonction utilitaire : l'utilisateur courant est-il admin ? ----------
-- SECURITY DEFINER => contourne la RLS (évite la récursion des policies).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- Création automatique du profil à l'inscription ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RPC : un étudiant utilise sa clé d'adhésion ----------
-- Appelée APRÈS l'inscription (l'utilisateur est authentifié).
create or replace function public.redeem_adhesion_key(
  p_code text, p_universite text, p_faculte text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  k public.adhesion_keys;
begin
  if auth.uid() is null then
    return json_build_object('ok', false, 'reason', 'Non authentifié.');
  end if;

  select * into k from public.adhesion_keys
    where code = upper(trim(p_code)) for update;

  if not found then
    return json_build_object('ok', false, 'reason', $r$Cette clé d'adhésion n'existe pas.$r$);
  end if;
  if k.statut = 'annulée' then
    return json_build_object('ok', false, 'reason', $r$Cette clé a été annulée par l'administration.$r$);
  end if;
  if k.statut = 'utilisée' or k.used_by is not null then
    return json_build_object('ok', false, 'reason', $r$Cette clé a déjà été utilisée.$r$);
  end if;

  update public.adhesion_keys
    set statut = 'utilisée', used_by = auth.uid(), used_at = now()
    where id = k.id;

  update public.profiles
    set role = 'membre', universite = p_universite,
        faculte = p_faculte, adhesion_key = k.code
    where id = auth.uid();

  return json_build_object('ok', true);
end;
$$;

-- ---------- RPC : l'admin génère une clé ----------
create or replace function public.generate_adhesion_key(p_beneficiaire text)
returns public.adhesion_keys
language plpgsql
security definer
set search_path = public
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  code  text;
  k     public.adhesion_keys;
begin
  if not public.is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;
  loop
    code := 'AEEIG-2026-' ||
      substr(chars, floor(random()*33)::int + 1, 1) ||
      substr(chars, floor(random()*33)::int + 1, 1) ||
      substr(chars, floor(random()*33)::int + 1, 1) ||
      substr(chars, floor(random()*33)::int + 1, 1);
    exit when not exists (select 1 from public.adhesion_keys where adhesion_keys.code = code);
  end loop;

  insert into public.adhesion_keys (code, beneficiaire, statut)
  values (code, p_beneficiaire, 'générée')
  returning * into k;
  return k;
end;
$$;

-- ---------- RPC : activer un abonnement (après paiement) ----------
create or replace function public.activate_subscription(
  p_ref text, p_methode text, p_montant int
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fin date := current_date + interval '1 year';
begin
  if auth.uid() is null then
    return json_build_object('ok', false, 'reason', 'Non authentifié.');
  end if;

  insert into public.subscriptions (user_id, fin, paiement_ref, paiement_methode, montant)
  values (auth.uid(), v_fin, p_ref, p_methode, p_montant);

  update public.profiles set role = 'abonne' where id = auth.uid();

  return json_build_object('ok', true, 'fin', v_fin);
end;
$$;

-- ============================================================
--  Row Level Security (RLS)
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.adhesion_keys enable row level security;
alter table public.news          enable row level security;
alter table public.library_docs  enable row level security;
alter table public.subscriptions enable row level security;
alter table public.settings      enable row level security;

-- profiles : chacun voit/modifie le sien ; l'admin voit/modifie tout
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- adhesion_keys : admin uniquement (les étudiants passent par les RPC)
drop policy if exists keys_admin_all on public.adhesion_keys;
create policy keys_admin_all on public.adhesion_keys
  for all using (public.is_admin()) with check (public.is_admin());

-- news : lecture publique des articles publiés ; admin gère tout
drop policy if exists news_public_read on public.news;
create policy news_public_read on public.news
  for select using (published or public.is_admin());
drop policy if exists news_admin_write on public.news;
create policy news_admin_write on public.news
  for all using (public.is_admin()) with check (public.is_admin());

-- library_docs : catalogue visible par tous ; admin gère tout
drop policy if exists lib_public_read on public.library_docs;
create policy lib_public_read on public.library_docs
  for select using (true);
drop policy if exists lib_admin_write on public.library_docs;
create policy lib_admin_write on public.library_docs
  for all using (public.is_admin()) with check (public.is_admin());

-- subscriptions : chacun voit le sien ; admin voit tout
drop policy if exists subs_select_own on public.subscriptions;
create policy subs_select_own on public.subscriptions
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists subs_admin_write on public.subscriptions;
create policy subs_admin_write on public.subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

-- settings : lecture publique (affichés sur le site) ; admin modifie
drop policy if exists settings_public_read on public.settings;
create policy settings_public_read on public.settings
  for select using (true);
drop policy if exists settings_admin_write on public.settings;
create policy settings_admin_write on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
--  Contenu initial (migré depuis la maquette)
-- ============================================================

insert into public.settings (key, value) values
  ('tresorierPhone',       '+224 620 00 00 00'),
  ('tresorierPermanence',  $v$Permanence : lundi & jeudi, 15h–18h, siège AEEIG (Conakry)$v$),
  ('abonnementTarif',      '150 000 GNF / an'),
  ('abonnementDuree',      '12 mois'),
  ('contactEmail',         'contact@aeeig.org'),
  ('contactPhone',         '+224 621 00 00 00')
on conflict (key) do nothing;

insert into public.news (slug, titre, date, categorie, cover, extrait, contenu) values
 ('assemblee-generale-2026', $t$Assemblée générale 2026 : rendez-vous le 18 juillet$t$, '2026-06-25', 'Vie associative', 'cover-1',
  $t$Tous les membres sont conviés à l'assemblée générale annuelle : bilan de l'année, renouvellement du bureau et perspectives 2026-2027.$t$,
  $t$L'Assemblée générale annuelle de l'AEEIG se tiendra le samedi 18 juillet 2026 à partir de 14h au siège de l'association à Conakry.

À l'ordre du jour : présentation du bilan moral et financier de l'année écoulée, renouvellement partiel du bureau exécutif, présentation du projet de portail numérique et échanges libres avec les membres.

La présence de tous les membres à jour de leur carte est vivement souhaitée.$t$),
 ('campagne-adhesion-2026-2027', $t$Campagne d'adhésion 2026-2027 : c'est parti !$t$, '2026-06-18', 'Adhésions', 'cover-2',
  $t$La campagne de renouvellement des cartes de membre est ouverte. Rapprochez-vous de la trésorerie pour obtenir votre carte et votre clé d'adhésion.$t$,
  $t$La campagne d'adhésion pour l'année académique 2026-2027 est officiellement lancée.

Pour adhérer ou renouveler votre carte : rendez-vous aux permanences de la trésorerie. Après paiement, une clé d'adhésion personnelle vous sera remise : elle vous permettra de créer votre compte sur le portail AEEIG.$t$),
 ('tournoi-maracana-inter-universites', $t$Tournoi de maracana inter-universités : les inscriptions sont ouvertes$t$, '2026-06-10', 'Sport & culture', 'cover-4',
  $t$L'AEEIG organise son traditionnel tournoi de maracana. Constituez vos équipes par université et inscrivez-vous avant le 30 juin.$t$,
  $t$Comme chaque année, l'AEEIG organise son tournoi de maracana inter-universités, moment fort de cohésion entre les étudiants ivoiriens de Guinée.

Les équipes doivent être constituées par université et inscrites auprès du secrétariat avant le 30 juin.$t$),
 ('resultats-bourses-excellence', $t$Bourses d'excellence : félicitations à nos lauréats$t$, '2026-05-28', 'Académique', 'cover-3',
  $t$Cinq étudiants membres de l'AEEIG figurent parmi les lauréats des bourses d'excellence. L'association salue leur travail remarquable.$t$,
  $t$L'AEEIG adresse ses chaleureuses félicitations aux cinq étudiants membres de l'association distingués cette année par les bourses d'excellence.$t$),
 ('accueil-nouveaux-bacheliers', $t$Accueil des nouveaux bacheliers : le guide d'installation à Conakry$t$, '2026-05-15', 'Entraide', 'cover-6',
  $t$Vous arrivez de Côte d'Ivoire pour étudier en Guinée ? L'AEEIG publie son guide pratique d'installation et met en place un parrainage.$t$,
  $t$Chaque année, de nouveaux bacheliers ivoiriens rejoignent les universités guinéennes. Pour faciliter leur installation, l'AEEIG publie un guide pratique et un dispositif de parrainage.$t$),
 ('partenariat-bibliotheque-numerique', $t$La bibliothèque numérique AEEIG s'enrichit de nouveaux mémoires$t$, '2026-05-02', 'Bibliothèque', 'cover-5',
  $t$Une vingtaine de mémoires et thèses soutenus par des membres viennent d'être ajoutés à la bibliothèque en ligne.$t$,
  $t$La bibliothèque numérique de l'AEEIG continue de s'enrichir : une vingtaine de mémoires et thèses récemment soutenus viennent d'y être ajoutés, avec l'accord de leurs auteurs.$t$)
on conflict (slug) do nothing;

insert into public.library_docs (titre, auteur, type, filiere, annee, resume) values
 ($t$Prise en charge du paludisme grave chez l'enfant à Conakry$t$, $t$N'Guessan Emma$t$, 'Mémoire', 'Médecine', 2025, $t$Étude rétrospective menée au CHU de Donka sur 240 cas pédiatriques entre 2023 et 2025.$t$),
 ($t$Le droit OHADA et la protection des investisseurs étrangers$t$, 'Kouassi Aya', 'Mémoire', 'Droit', 2025, $t$Analyse comparée des mécanismes de protection dans l'espace OHADA, cas de la Guinée et de la Côte d'Ivoire.$t$),
 ($t$Impact du mobile money sur l'inclusion financière en Guinée$t$, 'Traoré Ibrahim', 'Thèse', 'Économie', 2024, $t$Thèse de doctorat : données d'enquête auprès de 1 200 ménages dans quatre régions.$t$),
 ($t$Cours complet d'anatomie — PCEM2$t$, 'Pr. Diallo M.', 'Cours', 'Médecine', 2026, $t$Support de cours d'anatomie de deuxième année, illustré, mis à jour pour 2025-2026.$t$),
 ($t$Guide d'installation des étudiants ivoiriens à Conakry$t$, 'AEEIG', 'Guide', 'Vie pratique', 2026, $t$Démarches administratives, logement, transport, santé : le guide officiel d'accueil de l'association.$t$),
 ($t$Béton armé : dimensionnement selon les Eurocodes$t$, 'Yao Kouadio', 'Cours', 'Génie civil', 2025, $t$Synthèse de cours et exercices corrigés pour les étudiants en génie civil.$t$),
 ($t$Pharmacovigilance des antipaludiques en Afrique de l'Ouest$t$, 'Diabaté Fatou', 'Thèse', 'Pharmacie', 2024, $t$Surveillance des effets indésirables des combinaisons à base d'artémisinine.$t$),
 ($t$Introduction au droit constitutionnel guinéen$t$, 'Dr. Camara S.', 'Livre', 'Droit', 2023, $t$Manuel de référence pour les étudiants de première année de droit.$t$),
 ($t$Méthodologie de la recherche : rédiger son mémoire$t$, 'AEEIG', 'Guide', 'Méthodologie', 2025, $t$De la problématique à la soutenance : le guide méthodologique de l'association.$t$),
 ($t$Microéconomie L2 : théorie du consommateur et du producteur$t$, 'Dr. Koné B.', 'Cours', 'Économie', 2026, $t$Polycopié complet avec exercices corrigés, programme de licence 2.$t$),
 ($t$Santé communautaire et stratégies de vaccination en zone rurale$t$, 'Bamba Mariam', 'Mémoire', 'Médecine', 2024, $t$Enquête de terrain dans la région de Kindia sur la couverture vaccinale infantile.$t$),
 ($t$L'arbitrage commercial international dans l'espace OHADA$t$, 'Koné Salif', 'Mémoire', 'Droit', 2023, $t$Étude de la Cour Commune de Justice et d'Arbitrage et de sa jurisprudence récente.$t$)
on conflict do nothing;

-- ============================================================
--  FIN. Après exécution : voir README pour créer le compte admin.
-- ============================================================
