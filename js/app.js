/* ============================================================
   AEEIG — Logique applicative partagée (mode maquette)
   Authentification simulée via localStorage.
   En production : remplacée par le back-end (sessions, API).
   ============================================================ */

const Auth = {
  KEY: "aeeig_session",

  get user() {
    try { return JSON.parse(localStorage.getItem(this.KEY)); }
    catch { return null; }
  },

  login(user) {
    localStorage.setItem(this.KEY, JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem(this.KEY);
    window.location.href = "index.html";
  },

  // Clés déjà consommées dans cette maquette
  usedKeys() {
    try { return JSON.parse(localStorage.getItem("aeeig_used_keys")) || []; }
    catch { return []; }
  },

  consumeKey(code) {
    const used = this.usedKeys();
    used.push(code);
    localStorage.setItem("aeeig_used_keys", JSON.stringify(used));
  },

  // Clés générées par l'admin (persistées pour relier admin ↔ inscription membre)
  generatedKeys() {
    try { return JSON.parse(localStorage.getItem("aeeig_gen_keys")) || []; }
    catch { return []; }
  },

  addGeneratedKey(key) {
    const list = this.generatedKeys();
    list.unshift(key);
    localStorage.setItem("aeeig_gen_keys", JSON.stringify(list));
  },

  isKeyValid(code) {
    const norm = code.trim().toUpperCase();
    const key = [...this.generatedKeys(), ...AEEIG.demoKeys].find(k => k.code === norm);
    if (!key) return { ok: false, reason: "Cette clé d'adhésion n'existe pas. Vérifiez la saisie ou contactez la trésorerie." };
    if (key.statut === "annulée") return { ok: false, reason: "Cette clé a été annulée par l'administration. Contactez la trésorerie." };
    if (key.statut === "utilisée" || this.usedKeys().includes(key.code))
      return { ok: false, reason: "Cette clé a déjà été utilisée pour créer un compte." };
    return { ok: true, key };
  },

  /* ---- Comptes (mode maquette : stockés dans localStorage) ----
     NB : le mot de passe est conservé en clair côté navigateur uniquement pour
     la démonstration. En production, il sera transmis au back-end et haché
     (Bcrypt/Argon2) — jamais stocké dans le navigateur. */
  accounts() {
    try { return JSON.parse(localStorage.getItem("aeeig_accounts")) || []; }
    catch { return []; }
  },

  findAccount(email) {
    const e = (email || "").trim().toLowerCase();
    return this.accounts().find(a => (a.email || "").toLowerCase() === e);
  },

  register(user) {
    const list = this.accounts().filter(a => (a.email || "").toLowerCase() !== user.email.toLowerCase());
    list.push(user);
    localStorage.setItem("aeeig_accounts", JSON.stringify(list));
  },

  registeredMembers() { return this.accounts().filter(a => a.role === "membre"); },
  registeredSubscribers() { return this.accounts().filter(a => a.role === "abonne"); },

  // Authentifie un couple e-mail / mot de passe et ouvre la session si valide.
  authenticate(email, pass) {
    email = (email || "").trim().toLowerCase();
    if (email === AEEIG.demoAdmin.email && pass === AEEIG.demoAdmin.password) {
      const u = { nom: "Administration AEEIG", email, role: "admin" };
      this.login(u);
      return { ok: true, user: u };
    }
    if (email === AEEIG.demoAdmin.email)
      return { ok: false, reason: "Mot de passe incorrect pour le compte administrateur." };

    const acc = this.findAccount(email);
    if (acc) {
      if (acc.password !== pass) return { ok: false, reason: "E-mail ou mot de passe incorrect." };
      const { password, ...safe } = acc;
      this.login(safe);
      return { ok: true, user: safe };
    }

    // Mode démonstration : toute autre combinaison connecte un membre fictif
    const demo = {
      nom: email.split("@")[0].replace(/[._]/g, " ") || "Membre AEEIG",
      email, role: "membre",
      universite: "Université Gamal Abdel Nasser de Conakry",
      demo: true,
    };
    this.login(demo);
    return { ok: true, user: demo };
  },
};

/* ---------- Paiement de l'abonnement ----------
   Mode maquette (simulé) tant que la passerelle n'est pas configurée dans
   AEEIG.settings.payment. Le jour où les moyens de réception seront disponibles,
   renseignez gatewayUrl et/ou les numéros marchands : le mode réel s'activera. */
const Payment = {
  get config() { return (typeof AEEIG !== "undefined" && AEEIG.settings.payment) || {}; },
  amount() { return this.config.montant || 150000; },
  currency() { return this.config.devise || "GNF"; },
  amountLabel() { return this.amount().toLocaleString("fr-FR") + " " + this.currency(); },

  merchantFor(method) {
    const c = this.config;
    if (method === "orange") return c.orangeMoney && c.orangeMoney.merchant;
    if (method === "mtn")    return c.mtnMoney && c.mtnMoney.merchant;
    return null;
  },

  isLive() { return !!(this.config.gatewayUrl); },

  process(payload) {
    return this.isLive() ? this.processLive(payload) : this.processDemo(payload);
  },

  processDemo(payload) {
    return new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      ref: "SIM-" + Date.now().toString(36).toUpperCase(),
      method: payload.method,
      montant: this.amount(),
    }), 1500));
  },

  // PRODUCTION — à compléter avec le prestataire retenu (Orange Money / MTN / carte).
  processLive(payload) {
    /* Exemple d'intégration :
       return fetch(this.config.gatewayUrl, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           montant: this.amount(),
           devise: this.currency(),
           methode: payload.method,          // "orange" | "mtn" | "carte"
           telephone: payload.phone,         // numéro Mobile Money à débiter
           client: payload.email,
           marchand: this.merchantFor(payload.method),
           retour: location.origin + "/connexion.html",
         }),
       }).then(r => r.json());
       // La passerelle renvoie ensuite { ok, ref, ... } ou redirige le navigateur.
    */
    return Promise.resolve({ ok: false, pending: true, message: "Redirection vers la passerelle de paiement… (à configurer)" });
  },
};

/* ---------- Utilitaires ---------- */

function formatDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3800);
}

function initials(name) {
  return name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Header : menu mobile + état connecté ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".main-nav");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open);
    });
  }

  // Adapter les boutons du header si une session existe
  const user = Auth.user;
  const cta = document.querySelector("[data-auth-cta]");
  if (cta && user) {
    cta.textContent = user.role === "admin" ? "Espace admin" : "Mon espace";
    cta.href = user.role === "admin" ? "admin.html" : "espace-membre.html";
    cta.classList.remove("btn-outline");
    cta.classList.add("btn-primary");
  }

  // « Rejoindre » devient « Déconnexion » lorsque l'utilisateur est connecté
  const join = document.querySelector("[data-join-cta]");
  if (join && user) {
    join.textContent = "Déconnexion";
    join.setAttribute("href", "#");
    join.classList.remove("btn-primary");
    join.classList.add("btn-outline");
    join.addEventListener("click", e => { e.preventDefault(); Auth.logout(); });
  }

  // Injecter les paramètres modifiables (téléphone trésorerie, tarif…)
  document.querySelectorAll("[data-setting]").forEach(el => {
    const key = el.dataset.setting;
    if (AEEIG.settings[key]) el.textContent = AEEIG.settings[key];
  });
});

/* ---------- Rendu : cartes actualité ---------- */

function newsCardHTML(article) {
  return `
    <a class="news-card" href="actualites.html#${article.id}">
      <div class="news-cover ${article.cover}">
        <span class="news-cat">${escapeHtml(article.categorie)}</span>
      </div>
      <div class="news-body">
        <span class="news-date">${formatDate(article.date)}</span>
        <h3>${escapeHtml(article.titre)}</h3>
        <p class="news-excerpt">${escapeHtml(article.extrait)}</p>
        <span class="news-link">Lire l'article →</span>
      </div>
    </a>`;
}

/* ---------- Rendu : cartes document ---------- */

function docCardHTML(doc, { locked = false } = {}) {
  const action = locked
    ? `<a class="btn btn-outline btn-sm" href="connexion.html">Se connecter pour lire</a>`
    : `<button class="btn btn-green btn-sm" onclick="openViewer(${doc.id})">Lire en ligne</button>`;
  return `
    <article class="doc-card">
      <div class="doc-type ${DOC_TYPE_CLASS[doc.type] || "dt-guide"}">${doc.type.toUpperCase()}</div>
      <h3>${escapeHtml(doc.titre)}</h3>
      <span class="doc-meta">${escapeHtml(doc.auteur)} · ${escapeHtml(doc.filiere)} · ${doc.annee}</span>
      <p class="doc-desc">${escapeHtml(doc.resume)}</p>
      ${action}
    </article>`;
}

/* ---------- Visionneuse (consultation seule, anti-copie) ---------- */

function openViewer(docId) {
  const doc = AEEIG.library.find(d => d.id === docId);
  if (!doc) return;

  let overlay = document.getElementById("viewer-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "viewer-overlay";
    overlay.className = "viewer-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    document.body.appendChild(overlay);
    overlay.addEventListener("click", e => { if (e.target === overlay) closeViewer(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeViewer(); });
  }

  overlay.innerHTML = `
    <div class="viewer">
      <div class="viewer-head">
        <h3>${escapeHtml(doc.titre)}</h3>
        <button class="btn btn-outline btn-sm" onclick="closeViewer()" aria-label="Fermer la visionneuse">✕ Fermer</button>
      </div>
      <div class="viewer-page" oncontextmenu="return false">
        <div class="watermark">AEEIG · ${escapeHtml(Auth.user ? Auth.user.nom : "Portail AEEIG")}</div>
        <p><strong>${escapeHtml(doc.type)} — ${escapeHtml(doc.auteur)} (${doc.annee})</strong></p>
        <p><em>${escapeHtml(doc.resume)}</em></p>
        <p>Ceci est un aperçu de démonstration de la visionneuse sécurisée. En production, le document
        complet (PDF) s'affichera ici page par page, sans possibilité de téléchargement.</p>
        <p>Mesures de protection prévues : lecture en flux depuis le serveur (le fichier n'est jamais
        transmis en entier au navigateur), clic droit et impression désactivés, filigrane personnalisé
        au nom du lecteur, limitation du nombre de pages affichées simultanément.</p>
        <p>— — —</p>
        <p>Chapitre 1 : Introduction … (contenu du document)</p>
      </div>
      <div class="viewer-foot">
        <span>Page 1 / — · Consultation en ligne uniquement</span>
        <span class="viewer-lock">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
          Téléchargement désactivé
        </span>
      </div>
    </div>`;
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeViewer() {
  const overlay = document.getElementById("viewer-overlay");
  if (overlay) {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }
}
