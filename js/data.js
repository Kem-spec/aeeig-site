/* ============================================================
   AEEIG — Données de démonstration (mode maquette)
   En production : ces données proviendront du back-end (API).
   ============================================================ */

const AEEIG = {

  // Paramètres modifiables depuis l'espace admin (section 3.1.1 du cahier des charges)
  settings: {
    tresorierPhone: "+224 620 00 00 00",   // à remplacer par le vrai numéro
    tresorierPermanence: "Permanence : lundi & jeudi, 15h–18h, siège AEEIG (Conakry)",
    abonnementTarif: "150 000 GNF / an",
    abonnementDuree: "12 mois",
    contactEmail: "contact@aeeig.org",
    contactPhone: "+224 621 00 00 00",

    // ---- Paiement de l'abonnement non-membre ----
    // Tant que « gatewayUrl » et les numéros marchands restent vides, le paiement
    // fonctionne en MODE MAQUETTE (simulé). Renseignez ces éléments le jour où les
    // moyens de réception de l'argent seront disponibles pour activer le mode réel.
    payment: {
      montant: 150000,        // montant numérique de l'abonnement annuel
      devise: "GNF",
      orangeMoney: { merchant: "", intitule: "AEEIG" }, // n° / code marchand Orange Money
      mtnMoney:    { merchant: "", intitule: "AEEIG" }, // n° / code marchand MTN MoMo
      carte:       { enabled: false },                   // paiement par carte bancaire
      gatewayUrl:  "",                                    // URL de la passerelle (active le mode réel)
    },
  },

  // Clés d'adhésion valides (générées par l'admin après paiement de la carte)
  demoKeys: [
    { code: "AEEIG-2026-K7X4", statut: "remise",   nom: "Kouassi Aya",       date: "2026-06-12" },
    { code: "AEEIG-2026-M2P9", statut: "remise",   nom: "Traoré Ibrahim",    date: "2026-06-15" },
    { code: "AEEIG-2026-R5T1", statut: "utilisée", nom: "N'Guessan Emma",    date: "2026-05-30" },
    { code: "AEEIG-2026-B8W3", statut: "générée",  nom: "Koné Salif",        date: "2026-06-28" },
    { code: "AEEIG-2026-D4Q7", statut: "annulée",  nom: "Bamba Mariam",      date: "2026-05-18" },
    { code: "AEEIG-2026-Z9L2", statut: "remise",   nom: "Yao Kouadio",       date: "2026-06-20" },
  ],

  // Compte administrateur de démonstration
  demoAdmin: { email: "admin@aeeig.org", password: "Admin2026!" },

  // Étudiants membres (fiches gérées par l'admin)
  demoStudents: [
    { id: "ET-0142", nom: "N'Guessan Emma",  universite: "Université Gamal Abdel Nasser", filiere: "Médecine",        annee: "5e année",  statut: "actif" },
    { id: "ET-0158", nom: "Kouassi Aya",     universite: "Université Kofi Annan",         filiere: "Droit",           annee: "3e année",  statut: "actif" },
    { id: "ET-0163", nom: "Traoré Ibrahim",  universite: "UGLC de Sonfonia",              filiere: "Économie",        annee: "Master 1",  statut: "actif" },
    { id: "ET-0171", nom: "Yao Kouadio",     universite: "Institut Sup. de Technologie",  filiere: "Génie civil",     annee: "4e année",  statut: "en attente" },
    { id: "ET-0119", nom: "Diabaté Fatou",   universite: "Université Gamal Abdel Nasser", filiere: "Pharmacie",       annee: "6e année",  statut: "actif" },
  ],

  // Abonnés non-membres
  demoSubscribers: [
    { nom: "Camara Ousmane", email: "o.camara@mail.com", debut: "2025-09-10", fin: "2026-09-10", statut: "actif" },
    { nom: "Baldé Aïssatou", email: "a.balde@mail.com",  debut: "2025-11-02", fin: "2026-11-02", statut: "actif" },
    { nom: "Sylla Mohamed",  email: "m.sylla@mail.com",  debut: "2025-05-15", fin: "2026-05-15", statut: "expiré" },
  ],

  // Actualités
  news: [
    {
      id: "assemblee-generale-2026",
      titre: "Assemblée générale 2026 : rendez-vous le 18 juillet",
      date: "2026-06-25",
      categorie: "Vie associative",
      cover: "cover-1",
      extrait: "Tous les membres sont conviés à l'assemblée générale annuelle : bilan de l'année, renouvellement du bureau et perspectives 2026-2027.",
      contenu: "L'Assemblée générale annuelle de l'AEEIG se tiendra le samedi 18 juillet 2026 à partir de 14h au siège de l'association à Conakry.\n\nÀ l'ordre du jour : présentation du bilan moral et financier de l'année écoulée, renouvellement partiel du bureau exécutif, présentation du projet de portail numérique et échanges libres avec les membres.\n\nLa présence de tous les membres à jour de leur carte est vivement souhaitée. Les membres ne pouvant se déplacer pourront donner procuration dans les conditions prévues par le règlement intérieur."
    },
    {
      id: "campagne-adhesion-2026-2027",
      titre: "Campagne d'adhésion 2026-2027 : c'est parti !",
      date: "2026-06-18",
      categorie: "Adhésions",
      cover: "cover-2",
      extrait: "La campagne de renouvellement des cartes de membre est ouverte. Rapprochez-vous de la trésorerie pour obtenir votre carte et votre clé d'adhésion.",
      contenu: "La campagne d'adhésion pour l'année académique 2026-2027 est officiellement lancée.\n\nPour adhérer ou renouveler votre carte : rendez-vous aux permanences de la trésorerie (lundi et jeudi, 15h-18h) au siège de l'association. Après paiement, une clé d'adhésion personnelle vous sera remise : elle vous permettra de créer votre compte sur le portail AEEIG et d'accéder à l'ensemble des services (suivi académique, bibliothèque en ligne, actualités).\n\nLa carte de membre reste indispensable pour participer aux votes de l'assemblée générale et bénéficier des services de l'association."
    },
    {
      id: "tournoi-maracana-inter-universites",
      titre: "Tournoi de maracana inter-universités : les inscriptions sont ouvertes",
      date: "2026-06-10",
      categorie: "Sport & culture",
      cover: "cover-4",
      extrait: "L'AEEIG organise son traditionnel tournoi de maracana. Constituez vos équipes par université et inscrivez-vous avant le 30 juin.",
      contenu: "Comme chaque année, l'AEEIG organise son tournoi de maracana inter-universités, moment fort de cohésion entre les étudiants ivoiriens de Guinée.\n\nLes équipes (7 joueurs + 3 remplaçants) doivent être constituées par université et inscrites auprès du secrétariat avant le 30 juin. Une participation symbolique par équipe est demandée pour couvrir les frais d'organisation.\n\nLa finale se jouera fin juillet et sera suivie d'une soirée culturelle ouverte à tous."
    },
    {
      id: "resultats-bourses-excellence",
      titre: "Bourses d'excellence : félicitations à nos lauréats",
      date: "2026-05-28",
      categorie: "Académique",
      cover: "cover-3",
      extrait: "Cinq étudiants membres de l'AEEIG figurent parmi les lauréats des bourses d'excellence. L'association salue leur travail remarquable.",
      contenu: "L'AEEIG adresse ses chaleureuses félicitations aux cinq étudiants membres de l'association distingués cette année par les bourses d'excellence.\n\nCes distinctions récompensent des parcours exemplaires en médecine, droit, économie et génie civil. Elles rappellent l'importance du suivi académique et de l'entraide entre étudiants, deux missions au cœur de l'action de l'AEEIG.\n\nUne cérémonie de reconnaissance sera organisée en marge de l'assemblée générale de juillet."
    },
    {
      id: "accueil-nouveaux-bacheliers",
      titre: "Accueil des nouveaux bacheliers : le guide d'installation à Conakry",
      date: "2026-05-15",
      categorie: "Entraide",
      cover: "cover-6",
      extrait: "Vous arrivez de Côte d'Ivoire pour étudier en Guinée ? L'AEEIG publie son guide pratique d'installation et met en place un parrainage.",
      contenu: "Chaque année, de nouveaux bacheliers ivoiriens rejoignent les universités guinéennes. Pour faciliter leur installation, l'AEEIG publie un guide pratique : démarches administratives, logement, transport, santé, vie universitaire.\n\nLe guide est consultable dans la bibliothèque en ligne du portail. Un dispositif de parrainage met par ailleurs en relation chaque nouvel arrivant avec un étudiant expérimenté de sa filière.\n\nPour bénéficier du parrainage, contactez le secrétariat de l'association."
    },
    {
      id: "partenariat-bibliotheque-numerique",
      titre: "La bibliothèque numérique AEEIG s'enrichit de nouveaux mémoires",
      date: "2026-05-02",
      categorie: "Bibliothèque",
      cover: "cover-5",
      extrait: "Une vingtaine de mémoires et thèses soutenus par des membres viennent d'être ajoutés à la bibliothèque en ligne, consultables par tous les inscrits.",
      contenu: "La bibliothèque numérique de l'AEEIG continue de s'enrichir : une vingtaine de mémoires et thèses récemment soutenus par des membres de l'association viennent d'y être ajoutés, avec l'accord de leurs auteurs.\n\nCes documents sont consultables en ligne par tous les membres et abonnés, directement depuis la visionneuse du portail. Ils constituent une ressource précieuse pour préparer vos propres travaux de recherche.\n\nVous souhaitez partager votre mémoire ? Déposez-le depuis votre espace membre, il sera publié après validation."
    },
  ],

  // Bibliothèque
  library: [
    { id: 1, titre: "Prise en charge du paludisme grave chez l'enfant à Conakry", auteur: "N'Guessan Emma", type: "Mémoire", filiere: "Médecine", annee: 2025, resume: "Étude rétrospective menée au CHU de Donka sur 240 cas pédiatriques entre 2023 et 2025." },
    { id: 2, titre: "Le droit OHADA et la protection des investisseurs étrangers", auteur: "Kouassi Aya", type: "Mémoire", filiere: "Droit", annee: 2025, resume: "Analyse comparée des mécanismes de protection dans l'espace OHADA, cas de la Guinée et de la Côte d'Ivoire." },
    { id: 3, titre: "Impact du mobile money sur l'inclusion financière en Guinée", auteur: "Traoré Ibrahim", type: "Thèse", filiere: "Économie", annee: 2024, resume: "Thèse de doctorat : données d'enquête auprès de 1 200 ménages dans quatre régions." },
    { id: 4, titre: "Cours complet d'anatomie — PCEM2", auteur: "Pr. Diallo M.", type: "Cours", filiere: "Médecine", annee: 2026, resume: "Support de cours d'anatomie de deuxième année, illustré, mis à jour pour l'année 2025-2026." },
    { id: 5, titre: "Guide d'installation des étudiants ivoiriens à Conakry", auteur: "AEEIG", type: "Guide", filiere: "Vie pratique", annee: 2026, resume: "Démarches administratives, logement, transport, santé : le guide officiel d'accueil de l'association." },
    { id: 6, titre: "Béton armé : dimensionnement selon les Eurocodes", auteur: "Yao Kouadio", type: "Cours", filiere: "Génie civil", annee: 2025, resume: "Synthèse de cours et exercices corrigés pour les étudiants en génie civil (licence et master)." },
    { id: 7, titre: "Pharmacovigilance des antipaludiques en Afrique de l'Ouest", auteur: "Diabaté Fatou", type: "Thèse", filiere: "Pharmacie", annee: 2024, resume: "Surveillance des effets indésirables des combinaisons thérapeutiques à base d'artémisinine." },
    { id: 8, titre: "Introduction au droit constitutionnel guinéen", auteur: "Dr. Camara S.", type: "Livre", filiere: "Droit", annee: 2023, resume: "Manuel de référence pour les étudiants de première année de droit, édition actualisée." },
    { id: 9, titre: "Méthodologie de la recherche : rédiger son mémoire", auteur: "AEEIG", type: "Guide", filiere: "Méthodologie", annee: 2025, resume: "De la problématique à la soutenance : le guide méthodologique de l'association, tous domaines confondus." },
    { id: 10, titre: "Microéconomie L2 : théorie du consommateur et du producteur", auteur: "Dr. Koné B.", type: "Cours", filiere: "Économie", annee: 2026, resume: "Polycopié complet avec exercices corrigés, programme de licence 2." },
    { id: 11, titre: "Santé communautaire et stratégies de vaccination en zone rurale", auteur: "Bamba Mariam", type: "Mémoire", filiere: "Médecine", annee: 2024, resume: "Enquête de terrain dans la région de Kindia sur la couverture vaccinale infantile." },
    { id: 12, titre: "L'arbitrage commercial international dans l'espace OHADA", auteur: "Koné Salif", type: "Mémoire", filiere: "Droit", annee: 2023, resume: "Étude de la Cour Commune de Justice et d'Arbitrage et de sa jurisprudence récente." },
  ],
};

// Types de documents -> classe CSS
const DOC_TYPE_CLASS = {
  "Mémoire": "dt-memoire",
  "Thèse": "dt-these",
  "Cours": "dt-cours",
  "Livre": "dt-livre",
  "Guide": "dt-guide",
};
