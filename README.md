# InteractAEEIG — Maquette fonctionnelle (étape 1)

Site web associatif et portail étudiant de l'**Association des Étudiants Ivoiriens en Guinée (AEEIG)**,
conforme au cahier des charges (version document de travail).

## Lancer le site

Site 100 % statique : ouvrir `index.html` dans un navigateur, ou servir le dossier :

```
python -m http.server 8642 --directory aeeig-site
```

## Pages

| Fichier | Espace |
|---|---|
| `index.html` | Accueil-vitrine : hero, bloc « deux profils », actualités récentes, aperçu bibliothèque, présentation, CTA |
| `actualites.html` | Liste + fiche détaillée (URL partageable via `#id-article`), filtres par catégorie |
| `bibliotheque.html` | Catalogue, recherche, filtres type/filière, visionneuse sécurisée (lecture seule, filigrane, clic droit désactivé) |
| `connexion.html` | Connexion + inscription membre (clé d'adhésion) + abonnement non-membre (paiement simulé) |
| `espace-membre.html` | Tableau de bord étudiant (suivi académique, dépôts, profil) et vue abonné |
| `admin.html` | Tableau de bord, clés d'adhésion, membres, abonnements, contenus, paramètres |
| `a-propos.html` | Présentation + formulaire de contact |

## Comptes et clés de démonstration

- **Admin** : `admin@aeeig.org` / `Admin2026!`
- **Membre** : n'importe quel e-mail/mot de passe sur l'onglet Connexion (mode démo)
- **Clés d'adhésion valides** : `AEEIG-2026-K7X4`, `AEEIG-2026-M2P9`, `AEEIG-2026-Z9L2`
  - `AEEIG-2026-R5T1` → déjà utilisée (test du refus)
  - `AEEIG-2026-D4Q7` → annulée (test du refus)

Pour réinitialiser la démo : effacer le stockage local du navigateur (`localStorage`).

## État d'avancement

**Fait (maquette front-end)** : design system v2 « institutionnel moderne » (fond blanc, vert institutionnel,
orange en accent, Archivo + Public Sans, responsive, accessibilité),
toutes les pages, simulation des règles métier (clé à usage unique, rôles membre/abonné/admin,
verrouillage bibliothèque hors connexion, visionneuse anti-copie).

**À faire (étape 2 — back-end)** : base de données, authentification réelle (Bcrypt/Argon2),
génération et suivi des clés côté serveur, passerelle de paiement mobile money, dépôt de fichiers PDF,
streaming des documents dans la visionneuse, journalisation admin, e-mails (réinitialisation,
rappels d'échéance).

**Contenus à fournir par l'association** (section 5 du cahier des charges) : logo haute définition
(fichier `assets/logo.svg` = reproduction provisoire), textes officiels, numéro réel de la trésorerie,
tarif de l'abonnement, premières actualités et premiers documents.
