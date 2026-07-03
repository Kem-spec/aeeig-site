/* ============================================================
   AEEIG — Logique applicative (back-end Supabase)
   Auth réelle + données partagées via le client SB (config.js).
   ============================================================ */

/* ---------- Utilitaires ---------- */
function formatDate(iso) {
  if (!iso) return "";
  const d = iso.length <= 10 ? new Date(iso + "T00:00:00") : new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
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
  return (name || "?").split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

/* ---------- Authentification (Supabase) ---------- */
const Auth = {
  _me: undefined,

  // Renvoie { id, email, full_name, role, universite, faculte, ... } ou null
  async me() {
    if (this._me !== undefined) return this._me;
    const { data: { user } } = await SB.auth.getUser();
    if (!user) { this._me = null; return null; }
    const { data: profile } = await SB.from("profiles").select("*").eq("id", user.id).single();
    this._me = { id: user.id, email: user.email, ...(profile || {}) };
    return this._me;
  },

  async signIn(email, password) {
    const { data, error } = await SB.auth.signInWithPassword({ email: email.trim(), password });
    this._me = undefined;
    return { ok: !error, error, user: data && data.user };
  },

  async signUp(email, password, fullName) {
    const { data, error } = await SB.auth.signUp({
      email: email.trim(), password,
      options: { data: { full_name: fullName } },
    });
    this._me = undefined;
    return { ok: !error, error, user: data && data.user, session: data && data.session };
  },

  async signOut() {
    await SB.auth.signOut();
    this._me = undefined;
    window.location.href = "index.html";
  },

  async redeemKey(code, universite, faculte) {
    const { data, error } = await SB.rpc("redeem_adhesion_key", {
      p_code: code, p_universite: universite, p_faculte: faculte,
    });
    this._me = undefined;
    if (error) return { ok: false, reason: error.message };
    return data;
  },

  async activateSubscription(ref, methode, montant) {
    const { data, error } = await SB.rpc("activate_subscription", {
      p_ref: ref, p_methode: methode, p_montant: montant,
    });
    this._me = undefined;
    if (error) return { ok: false, reason: error.message };
    return data;
  },

  async updateProfile(fields) {
    const me = await this.me();
    if (!me) return { ok: false };
    const { error } = await SB.from("profiles").update(fields).eq("id", me.id);
    this._me = undefined;
    return { ok: !error, error };
  },
};

/* ---------- Paramètres du site ---------- */
const Settings = {
  _c: null,
  async load() {
    if (this._c) return this._c;
    const { data } = await SB.from("settings").select("*");
    const o = {};
    (data || []).forEach(r => { o[r.key] = r.value; });
    this._c = o;
    return o;
  },
};

async function injectSettings() {
  const s = await Settings.load();
  document.querySelectorAll("[data-setting]").forEach(el => {
    const v = s[el.dataset.setting];
    const has = v != null && String(v).trim() !== "";
    if (has) el.textContent = v;
    // Ligne optionnelle (ex. 2e/3e numéro) : masquée si la valeur est vide
    if (el.hasAttribute("data-optional")) {
      const row = el.closest("[data-optrow]") || el;
      row.style.display = has ? "" : "none";
    }
  });
}

/* ---------- Actualités ---------- */
const News = {
  async list({ limit = null } = {}) {
    let q = SB.from("news").select("*").eq("published", true).order("date", { ascending: false });
    if (limit) q = q.limit(limit);
    const { data } = await q;
    return data || [];
  },
  async all() {
    const { data } = await SB.from("news").select("*").order("date", { ascending: false });
    return data || [];
  },
  async bySlug(slug) {
    const { data } = await SB.from("news").select("*").eq("slug", slug).maybeSingle();
    return data;
  },
  create(obj) { return SB.from("news").insert(obj).select().single(); },
  update(id, obj) { return SB.from("news").update(obj).eq("id", id).select().single(); },
  remove(id) { return SB.from("news").delete().eq("id", id); },
};

/* ---------- Bibliothèque ---------- */
const Library = {
  _byId: {},
  _cache(rows) { (rows || []).forEach(d => { this._byId[d.id] = d; }); return rows || []; },
  // Catalogue public : documents validés uniquement
  async list() {
    const { data } = await SB.from("library_docs").select("*").eq("status", "approved").order("created_at", { ascending: false });
    return this._cache(data);
  },
  // Admin : tous les documents (y compris en attente / rejetés)
  async listAll() {
    const { data } = await SB.from("library_docs").select("*, profiles(full_name)").order("created_at", { ascending: false });
    return this._cache(data);
  },
  // Mes propres dépôts (membre)
  async listMine(userId) {
    const { data } = await SB.from("library_docs").select("*").eq("submitted_by", userId).order("created_at", { ascending: false });
    return this._cache(data);
  },
  create(obj) { return SB.from("library_docs").insert(obj).select().single(); },
  setStatus(id, status) { return SB.from("library_docs").update({ status }).eq("id", id); },
  remove(id) { return SB.from("library_docs").delete().eq("id", id); },
};

/* ---------- Bulletins (privés) ---------- */
const Bulletins = {
  async listMine(userId) {
    const { data } = await SB.from("bulletins").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    return data || [];
  },
  create(obj) { return SB.from("bulletins").insert(obj).select().single(); },
  remove(id) { return SB.from("bulletins").delete().eq("id", id); },
};

/* ---------- Espace admin (données) ---------- */
const Admin = {
  async keys() {
    const { data } = await SB.from("adhesion_keys").select("*").order("created_at", { ascending: false });
    return data || [];
  },
  async generateKey(nom) {
    const { data, error } = await SB.rpc("generate_adhesion_key", { p_beneficiaire: nom });
    if (error) throw error;
    return data;
  },
  cancelKey(id) { return SB.from("adhesion_keys").update({ statut: "annulée" }).eq("id", id); },
  async members() {
    const { data } = await SB.from("profiles").select("*").in("role", ["membre", "admin"]).order("created_at", { ascending: false });
    return data || [];
  },
  async subscribers() {
    const { data } = await SB.from("subscriptions").select("*, profiles(full_name, email)").order("created_at", { ascending: false });
    return data || [];
  },
  saveSetting(key, value) { return SB.from("settings").upsert({ key, value }); },
};

/* ---------- Paiement (abonnements) ----------
   Mode maquette : simulation. Pour activer la vraie passerelle
   (Orange Money / MTN / carte via CinetPay, PayDunya…), il suffira
   de renseigner les clés du prestataire et d'implémenter processLive().
*/
const Payment = {
  async merchantFor(method) {
    const s = await Settings.load();
    if (method === "orange") return s.merchantOrange || null;
    if (method === "mtn") return s.merchantMTN || null;
    return null;
  },
  async amountLabel() {
    const s = await Settings.load();
    return s.abonnementTarif || "—";
  },
  async amount() {
    const s = await Settings.load();
    const n = parseInt((s.abonnementTarif || "").replace(/[^0-9]/g, ""), 10);
    return isNaN(n) ? 0 : n;
  },
  // Simulation d'un paiement réussi (à remplacer par processLive en production)
  async process({ method /*, phone, email */ }) {
    const montant = await this.amount();
    await new Promise(r => setTimeout(r, 1200));
    return { ok: true, ref: "SIM-" + Date.now().toString(36).toUpperCase(), method, montant };
  },
  // async processLive({ method, phone, email }) {
  //   // 1) Créer la transaction chez le prestataire (fetch vers son API)
  //   // 2) Rediriger l'utilisateur vers l'URL de paiement renvoyée
  //   // 3) Au retour (webhook/redirect), confirmer puis activate_subscription
  // }
};

/* ---------- Stockage de fichiers (Supabase Storage) ---------- */
function safeFileName(n) {
  return (n || "fichier").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}
const Storage = {
  async uploadCover(file) {
    const path = Date.now() + "-" + safeFileName(file.name);
    const { error } = await SB.storage.from("covers").upload(path, file, { upsert: false });
    if (error) throw error;
    return SB.storage.from("covers").getPublicUrl(path).data.publicUrl;
  },
  async uploadDoc(file) {
    const path = Date.now() + "-" + safeFileName(file.name);
    const { error } = await SB.storage.from("bibliotheque").upload(path, file, { upsert: false });
    if (error) throw error;
    return { path, name: file.name };
  },
  async signedDocUrl(path) {
    const { data, error } = await SB.storage.from("bibliotheque").createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  },
  async uploadBulletin(file, userId) {
    const path = userId + "/" + Date.now() + "-" + safeFileName(file.name);
    const { error } = await SB.storage.from("bulletins").upload(path, file, { upsert: false });
    if (error) throw error;
    return { path, name: file.name };
  },
  async signedBulletinUrl(path) {
    const { data, error } = await SB.storage.from("bulletins").createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  },
};

/* ---------- Menus déroulants avec option « Autre » ---------- */
// Génère les <option> d'un select ; sélectionne « Autre » si la valeur
// courante n'est pas dans la liste (valeur personnalisée).
function optionList(list, selected) {
  const inList = list.includes(selected);
  return `<option value="">— Choisir —</option>` +
    list.map(o => `<option ${o === selected ? "selected" : ""}>${escapeHtml(o)}</option>`).join("") +
    `<option ${(!inList && selected) ? "selected" : ""}>Autre</option>`;
}

// Révèle le champ de saisie libre quand « Autre » est choisi
function wireOtherSelects(root = document) {
  root.querySelectorAll("select[data-other]").forEach(sel => {
    const extra = document.getElementById(sel.dataset.other);
    if (!extra) return;
    const input = extra.querySelector("input");
    sel.addEventListener("change", () => {
      const other = sel.value === "Autre";
      extra.hidden = !other;
      if (input) { input.required = other; if (!other) { input.value = ""; extra.classList.remove("has-error"); } }
    });
  });
}

// Valeur d'un select, ou la saisie libre quand « Autre » est choisi
function selectFieldValue(selId) {
  const sel = document.getElementById(selId);
  if (sel.value === "Autre" && sel.dataset.other) {
    return document.getElementById(sel.dataset.other).querySelector("input").value.trim();
  }
  return sel.value;
}

/* ---------- Slug (pour les URL d'actualités) ---------- */
function slugify(str) {
  return (str || "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

/* ---------- Header : menu mobile + état connecté ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".main-nav");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open);
    });
  }

  injectSettings();

  // Adapter les boutons du header selon la session
  const cta = document.querySelector("[data-auth-cta]");
  const join = document.querySelector("[data-join-cta]");
  if (cta || join) {
    const me = await Auth.me();
    if (me) {
      if (cta) { cta.textContent = "Mon espace"; cta.href = "espace-membre.html"; }
      if (join) {
        join.textContent = "Se déconnecter";
        join.href = "#";
        join.addEventListener("click", e => { e.preventDefault(); Auth.signOut(); });
      }
    }
  }

  // Ombre du header au défilement
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Apparition douce des sections au défilement (.reveal / .reveal-stagger)
  const revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: .12, rootMargin: "0px 0px -60px 0px" });
      revealEls.forEach(el => io.observe(el));
      // Filet de sécurité : si l'observateur ne déclenche jamais, ne pas
      // laisser du contenu invisible indéfiniment.
      setTimeout(() => revealEls.forEach(el => el.classList.add("reveal-visible")), 2500);
    } else {
      revealEls.forEach(el => el.classList.add("reveal-visible"));
    }
  }
});

/* ---------- Rendu : carte actualité ---------- */
function coverAttrs(article) {
  return article.cover_url
    ? { cls: "has-image", style: ` style="background-image:url('${encodeURI(article.cover_url)}');"` }
    : { cls: article.cover || "cover-1", style: "" };
}

function newsCardHTML(article) {
  const c = coverAttrs(article);
  return `
    <a class="news-card" href="actualites.html#${article.slug || article.id}">
      <div class="news-cover ${c.cls}"${c.style}>
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

/* ---------- Rendu : carte document ---------- */
function docCardHTML(doc, { locked = false } = {}) {
  const action = locked
    ? `<a class="btn btn-outline btn-sm" href="connexion.html">Se connecter pour lire</a>`
    : `<button class="btn btn-green btn-sm" onclick="openViewer('${doc.id}')">Lire en ligne</button>`;
  return `
    <article class="doc-card">
      <div class="doc-type ${DOC_TYPE_CLASS[doc.type] || "dt-guide"}">${(doc.type || "").toUpperCase()}</div>
      <h3>${escapeHtml(doc.titre)}</h3>
      <span class="doc-meta">${escapeHtml(doc.auteur)} · ${escapeHtml(doc.filiere)}${doc.niveau ? " · " + escapeHtml(doc.niveau) : ""} · ${doc.annee || ""}</span>
      <p class="doc-desc">${escapeHtml(doc.resume)}</p>
      ${action}
    </article>`;
}

/* ---------- Lecture des documents ----------
   S'ouvre dans un onglet dédié (lecture.html) : le document occupe
   tout l'écran pour une lecture confortable. */
function openViewer(docId) {
  window.open("lecture.html?doc=" + encodeURIComponent(docId), "_blank", "noopener");
}

/* ============================================================
   PWA — Service Worker + bouton flottant « Installer l'app »
   ============================================================ */
(function pwaInstall() {
  // Enregistrer le service worker (permet l'installation + secours hors-ligne)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  // Déjà installée ? Page de lecture ? Masqué pour la session ? → pas de bouton
  const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (standalone) return;
  if (/lecture\.html/.test(location.pathname)) return;
  if (sessionStorage.getItem("aeeig_pwa_hide")) return;

  const ua = navigator.userAgent || "";
  const isIOS = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  const isMobile = window.matchMedia("(max-width: 860px)").matches || /iphone|ipad|ipod|android/i.test(ua);
  if (!isMobile) return;

  let deferred = null, fab = null;

  function buildFab() {
    if (fab) return;
    fab = document.createElement("button");
    fab.className = "pwa-fab";
    fab.setAttribute("aria-label", "Installer l'application AEEIG");
    fab.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
      <span class="pwa-fab-x" aria-hidden="true">×</span>`;
    document.body.appendChild(fab);

    const label = document.createElement("span");
    label.className = "pwa-fab-label";
    label.textContent = "Installer l'app";
    fab.appendChild(label);
    setTimeout(() => label.remove(), 4500);

    fab.addEventListener("click", async e => {
      if (e.target.classList.contains("pwa-fab-x")) {
        e.stopPropagation();
        sessionStorage.setItem("aeeig_pwa_hide", "1");
        fab.style.display = "none";
        return;
      }
      if (deferred) {
        deferred.prompt();
        const choice = await deferred.userChoice;
        deferred = null;
        if (choice.outcome === "accepted") fab.style.display = "none";
      } else {
        showSheet();
      }
    });
    fab.style.display = "flex";
  }

  function showSheet() {
    let ov = document.getElementById("pwa-sheet");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "pwa-sheet";
      ov.className = "pwa-sheet-overlay";
      ov.innerHTML = `
        <div class="pwa-sheet" role="dialog" aria-modal="true">
          <h3>Ajouter AEEIG à l'écran d'accueil</h3>
          <p style="color:var(--ink-soft); margin:0;">Installez le portail comme une application, pour y accéder d'un seul geste depuis votre téléphone.</p>
          ${isIOS ? `<ol>
            <li>Touchez le bouton <strong>Partager</strong>
              <svg class="ios-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13"/><path d="m8 7 4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>
              en bas de Safari.</li>
            <li>Faites défiler puis choisissez <strong>« Sur l'écran d'accueil »</strong>.</li>
            <li>Touchez <strong>Ajouter</strong>.</li>
          </ol>` : `<ol>
            <li>Ouvrez le menu <strong>⋮</strong> de votre navigateur.</li>
            <li>Choisissez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</li>
          </ol>`}
          <button class="btn btn-primary" id="pwa-sheet-close" style="width:100%; margin-top:16px;">J'ai compris</button>
        </div>`;
      document.body.appendChild(ov);
      ov.addEventListener("click", e => { if (e.target === ov) ov.classList.remove("open"); });
      ov.querySelector("#pwa-sheet-close").addEventListener("click", () => ov.classList.remove("open"));
    }
    ov.classList.add("open");
  }

  // Android / Chrome : capter l'invite native
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; buildFab(); });
  window.addEventListener("appinstalled", () => { if (fab) fab.style.display = "none"; });

  // iOS Safari ne déclenche pas beforeinstallprompt → on montre le bouton (instructions)
  if (isIOS) {
    if (document.body) buildFab();
    else document.addEventListener("DOMContentLoaded", buildFab);
  }
})();
