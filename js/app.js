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
    if (s[el.dataset.setting] != null) el.textContent = s[el.dataset.setting];
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
  async list() {
    const { data } = await SB.from("library_docs").select("*").order("created_at", { ascending: false });
    (data || []).forEach(d => { this._byId[d.id] = d; });
    return data || [];
  },
  create(obj) { return SB.from("library_docs").insert(obj).select().single(); },
  remove(id) { return SB.from("library_docs").delete().eq("id", id); },
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
      const dest = me.role === "admin" ? "admin.html" : "espace-membre.html";
      if (cta) { cta.textContent = me.role === "admin" ? "Espace admin" : "Mon espace"; cta.href = dest; }
      if (join) {
        join.textContent = "Se déconnecter";
        join.href = "#";
        join.addEventListener("click", e => { e.preventDefault(); Auth.signOut(); });
      }
    }
  }
});

/* ---------- Rendu : carte actualité ---------- */
function newsCardHTML(article) {
  return `
    <a class="news-card" href="actualites.html#${article.slug || article.id}">
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

/* ---------- Rendu : carte document ---------- */
function docCardHTML(doc, { locked = false } = {}) {
  const action = locked
    ? `<a class="btn btn-outline btn-sm" href="connexion.html">Se connecter pour lire</a>`
    : `<button class="btn btn-green btn-sm" onclick="openViewer('${doc.id}')">Lire en ligne</button>`;
  return `
    <article class="doc-card">
      <div class="doc-type ${DOC_TYPE_CLASS[doc.type] || "dt-guide"}">${(doc.type || "").toUpperCase()}</div>
      <h3>${escapeHtml(doc.titre)}</h3>
      <span class="doc-meta">${escapeHtml(doc.auteur)} · ${escapeHtml(doc.filiere)} · ${doc.annee || ""}</span>
      <p class="doc-desc">${escapeHtml(doc.resume)}</p>
      ${action}
    </article>`;
}

/* ---------- Visionneuse (consultation seule, anti-copie) ---------- */
async function openViewer(docId) {
  const doc = Library._byId[docId];
  if (!doc) return;
  const me = await Auth.me();

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
        <div class="watermark">AEEIG · ${escapeHtml(me ? (me.full_name || me.email) : "Portail AEEIG")}</div>
        <p><strong>${escapeHtml(doc.type)} — ${escapeHtml(doc.auteur)} (${doc.annee || ""})</strong></p>
        <p><em>${escapeHtml(doc.resume)}</em></p>
        <p>Le fichier PDF de ce document n'a pas encore été téléversé. Une fois ajouté par
        l'administration, il s'affichera ici page par page dans la visionneuse sécurisée,
        sans possibilité de téléchargement.</p>
      </div>
      <div class="viewer-foot">
        <span>Consultation en ligne uniquement</span>
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
