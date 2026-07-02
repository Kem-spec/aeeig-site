# Mise en ligne du site AEEIG (GitHub + Netlify)

Le site est un site **statique** (HTML/CSS/JS) : aucune compilation. Netlify n'a qu'à publier le dossier.

## 1. Créer le dépôt sur GitHub
1. Aller sur https://github.com/new
2. **Repository name** : `aeeig-site` (par exemple)
3. Laisser **vide** : ne PAS cocher « Add a README », « .gitignore » ni licence (ils existent déjà).
4. Cliquer **Create repository**.
5. Copier l'URL affichée, du type `https://github.com/TON-UTILISATEUR/aeeig-site.git`

## 2. Envoyer le code (une seule fois)
Dans un terminal, dans le dossier du projet :
```bash
cd "C:/Users/DELL/Claude/aeeig-site"
git remote add origin https://github.com/TON-UTILISATEUR/aeeig-site.git
git push -u origin main
```
Au premier `push`, une fenêtre s'ouvre pour te connecter à GitHub → accepter.

## 3. Connecter Netlify (déploiement automatique)
1. Aller sur https://app.netlify.com → se connecter (possible avec GitHub).
2. **Add new site → Import an existing project → GitHub**.
3. Autoriser Netlify, puis choisir le dépôt `aeeig-site`.
4. Laisser les réglages par défaut (Netlify lit `netlify.toml`) → **Deploy**.
5. Au bout de ~1 min, Netlify donne un lien public, ex. `https://aeeig-site.netlify.app`.

## 4. Cycle de travail
- On modifie le site → on enregistre → `git push` (ou Claude s'en charge).
- Netlify **redéploie tout seul** en ~1 minute. Il suffit de rafraîchir la page en ligne.

## Plus tard
- **Nom de domaine** (`interactaeeig.org`) : achetable puis relié dans Netlify (Domain settings).
- **Back-end** (comptes partagés, paiement réel) : étape suivante, sans casser le site actuel.
