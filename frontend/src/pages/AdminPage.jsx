import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { isAdminUser } from "../utils/adminAccess";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtDate(value) {
  const d = value?.toDate?.() || (value ? new Date(value) : null);
  if (!d || isNaN(d)) return "—";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(value) {
  const d = value?.toDate?.() || (value ? new Date(value) : null);
  if (!d || isNaN(d)) return "—";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const PAGE_SIZE = 250;

function createdAtMillis(snapshot) {
  const value = snapshot.data().createdAt;
  return value?.toMillis?.() ?? (value ? new Date(value).getTime() || 0 : 0);
}

async function getAllDocuments(collectionName) {
  const docs = [];
  let cursor = null;

  while (true) {
    const parts = [collection(db, collectionName), orderBy(documentId())];
    if (cursor) parts.push(startAfter(cursor));
    const page = await getDocs(query(...parts, limit(PAGE_SIZE)));
    docs.push(...page.docs);
    if (page.size < PAGE_SIZE) break;
    cursor = page.docs[page.docs.length - 1];
  }

  return { docs: docs.sort((a, b) => createdAtMillis(b) - createdAtMillis(a)) };
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const BG = "#0d1117";
const SURFACE = "rgba(255,255,255,0.04)";
const BORDER = "rgba(255,255,255,0.08)";
const ACCENT = "#10b981";
const TEXT = "#fff";
const MUTED = "rgba(255,255,255,0.4)";
const MUTED2 = "rgba(255,255,255,0.65)";

// ─── Sub-components ───────────────────────────────────────────────────────────

function BigStat({ value, label, sub, color = ACCENT }) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 38, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: MUTED2 }}>{label}</span>
      {sub && <span style={{ fontSize: 12, color: MUTED }}>{sub}</span>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED, margin: "32px 0 12px" }}>
      {children}
    </h2>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:         { label: "En attente",    color: "#ffd166" },
    accepted:        { label: "Accepté",       color: "#10b981" },
    declined:        { label: "Refusé",        color: "#fca5a5" },
    cancelled:       { label: "Annulé",        color: "#94a3b8" },
    completed:       { label: "Terminé",       color: "#10b981" },
    scheduling_time: { label: "Planning",      color: "#7dd3fc" },
    chat_open:       { label: "Chat ouvert",   color: "#c4b5fd" },
    available:       { label: "Disponible",    color: "#10b981" },
    exchanged:       { label: "Échangé",       color: "#7dd3fc" },
  };
  const { label, color } = map[status] || { label: status || "—", color: "#94a3b8" };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: `${color}18`, color, border: `1px solid ${color}44` }}>
      {label}
    </span>
  );
}

function TabBtn({ id, active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      style={{
        padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
        background: active ? "rgba(16,185,129,0.12)" : "transparent",
        color: active ? ACCENT : MUTED2,
        border: active ? `1px solid rgba(16,185,129,0.3)` : "1px solid transparent",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function Table({ cols, rows, onRowClick }) {
  if (!rows.length) {
    return (
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "32px", textAlign: "center", color: MUTED, fontSize: 14 }}>
        Aucune donnée
      </div>
    );
  }
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {cols.map((c) => (
                <th key={c.key} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, whiteSpace: "nowrap" }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                style={{ borderBottom: i < rows.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none", cursor: onRowClick ? "pointer" : "default", transition: "background 0.1s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                {cols.map((c) => (
                  <td key={c.key} style={{ padding: "12px 16px", color: c.muted ? MUTED2 : TEXT, whiteSpace: c.nowrap ? "nowrap" : "normal" }}>
                    {row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function TabOverview({ counts, recentExchanges, recentItems, problems }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <BigStat value={fmt(counts.users)} label="Membres" sub="total inscrits" color={ACCENT} />
        <BigStat value={fmt(counts.items)} label="Objets" sub="mis en troc" color="#7dd3fc" />
        <BigStat value={fmt(counts.exchanges)} label="Échanges" sub="au total" color="#ffd166" />
        <BigStat value={fmt(counts.feedbacks)} label="Feedbacks" sub="post-meeting" color="#c4b5fd" />
        <BigStat value={fmt(counts.problems)} label="Signalements" sub="rencontres problématiques" color={counts.problems > 0 ? "#fca5a5" : "#94a3b8"} />
      </div>

      {problems.length > 0 && (
        <>
          <SectionTitle>🚨 Signalements récents</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {problems.slice(0, 5).map((ex) => (
              <a key={ex.id} href={`/exchanges/${ex.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(252,165,165,0.06)", border: "1px solid rgba(252,165,165,0.15)", borderRadius: 12, textDecoration: "none" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fca5a5", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{ex.meetingProblem || "Problème signalé"}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{ex.senderName || "—"} · {fmtDateTime(ex.updatedAt || ex.createdAt)}</div>
                </div>
                <span style={{ fontSize: 12, color: "#fca5a5" }}>Voir →</span>
              </a>
            ))}
          </div>
        </>
      )}

      <SectionTitle>🤝 Échanges récents</SectionTitle>
      <Table
        cols={[
          { key: "date", label: "Date", muted: true, nowrap: true },
          { key: "senderName", label: "De" },
          { key: "receiverName", label: "À" },
          { key: "status", label: "Statut" },
          { key: "link", label: "" },
        ]}
        rows={recentExchanges.map((ex) => ({
          ...ex,
          date: fmtDateTime(ex.createdAt),
          status: <StatusBadge status={ex.status} />,
          link: <a href={`/exchanges/${ex.id}`} style={{ color: ACCENT, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Voir →</a>,
        }))}
      />

      <SectionTitle>📦 Objets récents</SectionTitle>
      <Table
        cols={[
          { key: "date", label: "Date", muted: true, nowrap: true },
          { key: "title", label: "Titre" },
          { key: "category", label: "Catégorie", muted: true },
          { key: "ownerName", label: "Propriétaire" },
          { key: "status", label: "Statut" },
          { key: "link", label: "" },
        ]}
        rows={recentItems.map((it) => ({
          ...it,
          date: fmtDate(it.createdAt),
          status: <StatusBadge status={it.status || "available"} />,
          link: <a href={`/items/${it.id}`} style={{ color: ACCENT, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Voir →</a>,
        }))}
      />
    </>
  );
}

// ─── Tab: Users ───────────────────────────────────────────────────────────────

function TabUsers({ users }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => !q || (u.displayName || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
  }, [users, search]);

  return (
    <>
      <input
        type="search"
        placeholder="Rechercher un membre…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 14, outline: "none", marginBottom: 16, boxSizing: "border-box" }}
      />
      <Table
        cols={[
          { key: "avatar", label: "" },
          { key: "displayName", label: "Nom" },
          { key: "email", label: "Email", muted: true },
          { key: "date", label: "Inscrit le", muted: true, nowrap: true },
          { key: "link", label: "" },
        ]}
        rows={filtered.map((u) => ({
          ...u,
          avatar: u.avatarUrl || u.photoURL
            ? <img src={u.avatarUrl || u.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
            : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👤</div>,
          displayName: u.displayName || u.name || <span style={{ color: MUTED }}>Sans nom</span>,
          date: fmtDate(u.createdAt),
          link: <a href={`/users/${u.id}`} style={{ color: ACCENT, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Profil →</a>,
        }))}
      />
    </>
  );
}

// ─── Tab: Items ───────────────────────────────────────────────────────────────

function TabItems({ items }) {
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "available") return items.filter((i) => (i.status || "available") === "available");
    if (filter === "exchanged") return items.filter((i) => i.status === "exchanged");
    return items;
  }, [items, filter]);

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "all", label: `Tous (${items.length})` },
          { id: "available", label: `Disponibles` },
          { id: "exchanged", label: `Échangés` },
        ].map((f) => (
          <button
            key={f.id} type="button" onClick={() => setFilter(f.id)}
            style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", background: filter === f.id ? "rgba(16,185,129,0.15)" : SURFACE, color: filter === f.id ? ACCENT : MUTED2, border: filter === f.id ? `1px solid rgba(16,185,129,0.3)` : `1px solid ${BORDER}` }}
          >
            {f.label}
          </button>
        ))}
      </div>
      <Table
        cols={[
          { key: "img", label: "" },
          { key: "title", label: "Titre" },
          { key: "category", label: "Catégorie", muted: true },
          { key: "ownerName", label: "Propriétaire" },
          { key: "area", label: "Zone", muted: true },
          { key: "date", label: "Date", muted: true, nowrap: true },
          { key: "status", label: "Statut" },
          { key: "link", label: "" },
        ]}
        rows={filtered.map((it) => ({
          ...it,
          img: it.imageUrl
            ? <img src={it.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
            : <div style={{ width: 40, height: 40, borderRadius: 8, background: SURFACE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📦</div>,
          date: fmtDate(it.createdAt),
          status: <StatusBadge status={it.status || "available"} />,
          link: <a href={`/items/${it.id}`} style={{ color: ACCENT, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Voir →</a>,
        }))}
      />
    </>
  );
}

// ─── Tab: Exchanges ───────────────────────────────────────────────────────────

function TabExchanges({ exchanges, unavailable }) {
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => {
    if (filter === "all") return exchanges;
    if (filter === "active") return exchanges.filter((e) => ["pending", "accepted", "scheduling_time", "chat_open"].includes(e.status));
    if (filter === "completed") return exchanges.filter((e) => e.status === "completed");
    if (filter === "problems") return exchanges.filter((e) => e.meetingProblem);
    return exchanges;
  }, [exchanges, filter]);

  const counts = useMemo(() => ({
    active: exchanges.filter((e) => ["pending", "accepted", "scheduling_time", "chat_open"].includes(e.status)).length,
    completed: exchanges.filter((e) => e.status === "completed").length,
    problems: exchanges.filter((e) => e.meetingProblem).length,
  }), [exchanges]);

  if (unavailable) {
    return <div role="alert" style={{ padding: 20, color: "#fca5a5", background: "rgba(252,165,165,0.06)", borderRadius: 12 }}>Lecture des échanges indisponible. Vérifiez les règles Firestore.</div>;
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
        <BigStat value={exchanges.length} label="Total échanges" color="#ffd166" />
        <BigStat value={counts.active} label="En cours" color={ACCENT} />
        <BigStat value={counts.completed} label="Terminés" color="#7dd3fc" />
        <BigStat value={counts.problems} label="Problèmes" color={counts.problems > 0 ? "#fca5a5" : "#94a3b8"} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "all", label: `Tous (${exchanges.length})` },
          { id: "active", label: `En cours (${counts.active})` },
          { id: "completed", label: `Terminés (${counts.completed})` },
          { id: "problems", label: `Problèmes (${counts.problems})` },
        ].map((f) => (
          <button
            key={f.id} type="button" onClick={() => setFilter(f.id)}
            style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", background: filter === f.id ? "rgba(16,185,129,0.15)" : SURFACE, color: filter === f.id ? ACCENT : MUTED2, border: filter === f.id ? `1px solid rgba(16,185,129,0.3)` : `1px solid ${BORDER}` }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Table
        cols={[
          { key: "date", label: "Date", muted: true, nowrap: true },
          { key: "senderName", label: "Initiateur" },
          { key: "receiverName", label: "Destinataire" },
          { key: "status", label: "Statut" },
          { key: "problem", label: "Problème" },
          { key: "link", label: "" },
        ]}
        rows={filtered.map((ex) => ({
          ...ex,
          date: fmtDateTime(ex.createdAt),
          status: <StatusBadge status={ex.status} />,
          problem: ex.meetingProblem
            ? <span style={{ fontSize: 11, color: "#fca5a5" }}>⚠️ {ex.meetingProblem}</span>
            : <span style={{ color: MUTED }}>—</span>,
          link: <a href={`/exchanges/${ex.id}`} style={{ color: ACCENT, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Voir →</a>,
        }))}
      />
    </>
  );
}

// ─── Tab: Feedbacks ───────────────────────────────────────────────────────────

const ANSWER_LABELS = {
  overall: { excellent: "🤩 Excellente", good: "😊 Très bien", ok: "😐 Correct", bad: "😕 Difficile" },
  item_match: { perfect: "✅ Exactement", mostly: "👍 À peu près", different: "⚠️ Différent" },
  would_do_again: { yes: "🔁 Absolument", maybe: "🤔 Peut-être", no: "❌ Non" },
};
const EASE_LABELS = { 1: "😤 Difficile", 2: "😕 Compliqué", 3: "😐 Correct", 4: "😊 Facile", 5: "🤩 Très facile" };

function lbl(cat, val) { return ANSWER_LABELS[cat]?.[val] || val || "—"; }

function TabFeedbacks({ feedbacks }) {
  const [subTab, setSubTab] = useState("post_meeting");
  const [filter, setFilter] = useState("all");

  const postMeeting = useMemo(() => feedbacks.filter((f) => !f.surveyId || f.surveyId === "post_meeting"), [feedbacks]);
  const addItem = useMemo(() => feedbacks.filter((f) => f.surveyId === "after_add_item"), [feedbacks]);
  const base = subTab === "add_item" ? addItem : postMeeting;

  const filtered = useMemo(() => base.filter((fb) => {
    if (filter === "positive") return fb.answers?.overall === "excellent" || fb.answers?.overall === "good";
    if (filter === "negative") return fb.answers?.overall === "bad" || fb.answers?.overall === "ok";
    if (filter === "different") return fb.answers?.item_match === "different";
    if (filter === "again_no") return fb.answers?.would_do_again === "no";
    return true;
  }), [base, filter]);

  const stats = useMemo(() => {
    const total = postMeeting.length;
    const positive = postMeeting.filter((f) => ["excellent", "good"].includes(f.answers?.overall)).length;
    const again = postMeeting.filter((f) => f.answers?.would_do_again === "yes").length;
    const different = postMeeting.filter((f) => f.answers?.item_match === "different").length;
    const bad = postMeeting.filter((f) => f.answers?.overall === "bad").length;
    return { total, positive, again, different, bad, posRate: total ? Math.round((positive / total) * 100) : 0, againRate: total ? Math.round((again / total) * 100) : 0 };
  }, [postMeeting]);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
        <BigStat value={stats.total} label="Total feedbacks" color="#94a3b8" />
        <BigStat value={`${stats.posRate}%`} label="Satisfaction" sub={`${stats.positive} positifs`} color={ACCENT} />
        <BigStat value={`${stats.againRate}%`} label="Referaient" color="#7dd3fc" />
        <BigStat value={stats.different} label="Objet différent" color="#ffd166" />
        <BigStat value={stats.bad} label="Difficile" color={stats.bad > 0 ? "#fca5a5" : "#94a3b8"} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[
          { id: "post_meeting", label: `🤝 Post-meeting (${postMeeting.length})` },
          { id: "add_item", label: `📦 Ajout objet (${addItem.length})` },
        ].map((t) => (
          <button key={t.id} type="button" onClick={() => { setSubTab(t.id); setFilter("all"); }}
            style={{ padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", background: subTab === t.id ? TEXT : SURFACE, color: subTab === t.id ? BG : MUTED2, border: "none" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "all", label: `Tous (${base.length})` },
          { id: "positive", label: "😊 Positifs" },
          { id: "negative", label: "😕 Négatifs" },
          { id: "different", label: "⚠️ Objet différent" },
          { id: "again_no", label: "❌ Ne referait pas" },
        ].map((f) => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)}
            style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", background: filter === f.id ? "rgba(255,255,255,0.1)" : SURFACE, color: filter === f.id ? TEXT : MUTED2, border: filter === f.id ? `1px solid rgba(255,255,255,0.2)` : `1px solid ${BORDER}` }}>
            {f.label}
          </button>
        ))}
      </div>

      {subTab === "add_item" ? (
        <Table
          cols={[
            { key: "date", label: "Date", muted: true, nowrap: true },
            { key: "userName", label: "Utilisateur" },
            { key: "ease", label: "Facilité" },
            { key: "item", label: "Objet" },
          ]}
          rows={filtered.map((fb) => ({
            ...fb,
            date: fmtDateTime(fb.createdAt),
            ease: EASE_LABELS[fb.answers?.ease] || fb.answers?.ease || "—",
            item: fb.metadata?.itemId
              ? <a href={`/items/${fb.metadata.itemId}`} style={{ color: ACCENT, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Voir →</a>
              : <span style={{ color: MUTED }}>—</span>,
          }))}
        />
      ) : (
        <Table
          cols={[
            { key: "date", label: "Date", muted: true, nowrap: true },
            { key: "userName", label: "Auteur" },
            { key: "otherName", label: "Sur", muted: true },
            { key: "overall", label: "Rencontre" },
            { key: "itemMatch", label: "Objet" },
            { key: "again", label: "Referait" },
            { key: "link", label: "" },
          ]}
          rows={filtered.map((fb) => ({
            ...fb,
            date: fmtDateTime(fb.createdAt),
            overall: lbl("overall", fb.answers?.overall),
            itemMatch: lbl("item_match", fb.answers?.item_match),
            again: lbl("would_do_again", fb.answers?.would_do_again),
            link: fb.exchangeId
              ? <a href={`/exchanges/${fb.exchangeId}`} style={{ color: ACCENT, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Voir →</a>
              : <span style={{ color: MUTED }}>—</span>,
          }))}
        />
      )}

      <p style={{ marginTop: 12, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
        {filtered.length} feedback{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
      </p>
    </>
  );
}

// ─── Tab: Signalements ────────────────────────────────────────────────────────

function TabReports({ problems, feedbackFlags, dataIncomplete }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
        <BigStat value={problems.length} label="Rencontres problématiques" color="#fca5a5" />
        <BigStat value={feedbackFlags.length} label="Feedbacks avec flags" color="#ffd166" />
      </div>

      {problems.length > 0 && (
        <>
          <SectionTitle>⚠️ Rencontres avec problèmes</SectionTitle>
          <Table
            cols={[
              { key: "date", label: "Date", muted: true, nowrap: true },
              { key: "senderName", label: "Signalant" },
              { key: "problem", label: "Problème" },
              { key: "action", label: "Action" },
              { key: "status", label: "Statut" },
              { key: "link", label: "" },
            ]}
            rows={problems.map((ex) => ({
              ...ex,
              date: fmtDateTime(ex.updatedAt || ex.createdAt),
              problem: <span style={{ color: "#fca5a5" }}>{ex.meetingProblem}</span>,
              action: ex.meetingProblemAction || "—",
              status: <StatusBadge status={ex.status} />,
              link: <a href={`/exchanges/${ex.id}`} style={{ color: ACCENT, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Voir →</a>,
            }))}
          />
        </>
      )}

      {feedbackFlags.length > 0 && (
        <>
          <SectionTitle>🚩 Feedbacks flagués</SectionTitle>
          <Table
            cols={[
              { key: "date", label: "Date", muted: true, nowrap: true },
              { key: "userName", label: "Auteur" },
              { key: "flags", label: "Flags" },
              { key: "link", label: "" },
            ]}
            rows={feedbackFlags.map((fb) => ({
              ...fb,
              date: fmtDateTime(fb.createdAt),
              flags: (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Object.entries(fb.flags || {}).filter(([, v]) => v).map(([k]) => (
                    <span key={k} style={{ fontSize: 10, padding: "2px 8px", background: "rgba(252,165,165,0.12)", color: "#fca5a5", border: "1px solid rgba(252,165,165,0.2)", borderRadius: 20 }}>
                      {k.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              ),
              link: fb.exchangeId
                ? <a href={`/exchanges/${fb.exchangeId}`} style={{ color: ACCENT, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Voir →</a>
                : <span style={{ color: MUTED }}>—</span>,
            }))}
          />
        </>
      )}

      {problems.length === 0 && feedbackFlags.length === 0 && !dataIncomplete && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 32, textAlign: "center", color: MUTED }}>
          Aucun signalement. Tout va bien ! 🎉
        </div>
      )}
    </>
  );
}

// ─── Tab: Journal ────────────────────────────────────────────────────────────

const TASK_JOURNAL_ENTRIES = [
  {
    date: "2026-10-05",
    title: "Feed public Troco",
    done: [
      "Analyse de https://www.troco.app/feed via HTML live, rendu Chrome et code React.",
      "Remplacement des noms/adresses de cafés réels par des lieux fictifs dans les données et fallbacks UI.",
      "Remplacement des lieux réels proposés dans le chat par des points simulés.",
      "Correction du strip communautés : les communautés sans compteur affichent Bientôt au lieu de membres seul.",
      "Ajout d'un bandeau invité sur le feed desktop et mobile pour expliquer l'action attendue.",
      "Réorganisation du feed : Tous les objets remonte avant les sections favoris/communautés.",
      "Vérification avec npm run build : build OK.",
    ],
    pending: [
      "Anonymiser ou nettoyer les objets/noms réels dans Firestore si le feed reste public.",
      "Choisir la stratégie SEO pour /feed : noindex si c'est une page app, prerender/SSR si la page doit être indexable.",
    ],
    notes: [
      "Les données Firestore live n'ont pas été modifiées.",
      "La configuration SEO globale n'a pas été changée.",
    ],
  },
];

function JournalList({ title, items, color = MUTED2 }) {
  return (
    <div style={{ marginTop: 18 }}>
      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED }}>
        {title}
      </p>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => (
          <li key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", color, fontSize: 13, lineHeight: 1.45 }}>
            <span style={{ marginTop: 7, width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TabJournal() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {TASK_JOURNAL_ENTRIES.map((entry) => (
        <article key={`${entry.date}-${entry.title}`} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: ACCENT }}>
                {entry.date}
              </p>
              <h2 style={{ margin: "6px 0 0", fontSize: 22, lineHeight: 1.15 }}>
                {entry.title}
              </h2>
            </div>
            <span style={{ border: `1px solid rgba(16,185,129,0.3)`, background: "rgba(16,185,129,0.12)", color: ACCENT, borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 700 }}>
              Build OK
            </span>
          </div>

          <JournalList title="Fait" items={entry.done} color={TEXT} />
          <JournalList title="À décider" items={entry.pending} color="#ffd166" />
          <JournalList title="Notes" items={entry.notes} color={MUTED2} />
        </article>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",   label: "📊 Vue d'ensemble" },
  { id: "users",      label: "👥 Membres" },
  { id: "items",      label: "📦 Objets" },
  { id: "exchanges",  label: "🤝 Échanges" },
  { id: "feedbacks",  label: "💬 Feedbacks" },
  { id: "reports",    label: "🚨 Signalements" },
  { id: "journal",    label: "🗒️ Journal" },
];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const isAdmin = !authLoading && isAdminUser(user);

  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const [counts, setCounts] = useState({ users: null, items: null, exchanges: null, feedbacks: null, problems: null });
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [recentExchanges, setRecentExchanges] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [loadErrors, setLoadErrors] = useState({});

  // Load all data once authenticated
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    let unsubFeedback = () => {};

    async function loadData() {
      setLoading(true);

      const labels = ["compteur membres", "compteur objets", "compteur échanges", "compteur feedbacks", "membres", "objets", "échanges", "échanges récents", "objets récents"];
      const results = await Promise.allSettled([
        getCountFromServer(collection(db, "users")),
        getCountFromServer(collection(db, "items")),
        getCountFromServer(collection(db, "exchanges")),
        getCountFromServer(collection(db, "feedback")),
        getAllDocuments("users"),
        getAllDocuments("items"),
        getAllDocuments("exchanges"),
        getDocs(query(collection(db, "exchanges"), orderBy("createdAt", "desc"), limit(10))),
        getDocs(query(collection(db, "items"), orderBy("createdAt", "desc"), limit(10))),
      ]);
      setLoadErrors((previous) => ({
        ...previous,
        queries: results.flatMap((result, index) => result.status === "rejected" ? [labels[index]] : []),
      }));
      const [
        usersCountSnap,
        itemsCountSnap,
        exchangesCountSnap,
        feedbackCountSnap,
        usersSnap,
        itemsSnap,
        exchangesSnap,
        recentExchangesSnap,
        recentItemsSnap,
      ] = results.map((result) => result.status === "fulfilled" ? result.value : null);

      const allExchanges = (exchangesSnap?.docs ?? []).map((d) => ({ id: d.id, ...d.data() }));
      const allUsers = (usersSnap?.docs ?? []).map((d) => ({ id: d.id, ...d.data() }));
      const allItems = (itemsSnap?.docs ?? []).map((d) => ({ id: d.id, ...d.data() }));

      // Build user lookup for name enrichment
      const userMap = {};
      allUsers.forEach((u) => { userMap[u.id] = u.displayName || u.name || u.email || u.id.slice(0, 8); });

      // Enrich exchanges with names
      const enrichedExchanges = allExchanges.map((ex) => ({
        ...ex,
        senderName: userMap[ex.senderId || ex.proposerId] || (ex.senderId || "")?.slice(0, 8) || "—",
        receiverName: userMap[ex.receiverId] || (ex.receiverId || "")?.slice(0, 8) || "—",
      }));

      // Enrich items with owner name
      const enrichedItems = allItems.map((it) => ({
        ...it,
        ownerName: userMap[it.ownerId] || it.ownerName || it.ownerEmail || "—",
      }));

      const problems = enrichedExchanges.filter((ex) => ex.meetingProblem);

      setCounts({
        users: usersCountSnap?.data().count ?? null,
        items: itemsCountSnap?.data().count ?? null,
        exchanges: exchangesCountSnap?.data().count ?? null,
        feedbacks: feedbackCountSnap?.data().count ?? null,
        problems: exchangesSnap ? problems.length : null,
      });
      setUsers(allUsers);
      setItems(enrichedItems);
      setExchanges(enrichedExchanges);
      setRecentExchanges(
        ((recentExchangesSnap?.docs ?? []).map((d) => ({ id: d.id, ...d.data() }))).map((ex) => ({
          ...ex,
          senderName: userMap[ex.senderId || ex.proposerId] || (ex.senderId || "")?.slice(0, 8) || "—",
          receiverName: userMap[ex.receiverId] || (ex.receiverId || "")?.slice(0, 8) || "—",
        }))
      );
      setRecentItems(
        ((recentItemsSnap?.docs ?? []).map((d) => ({ id: d.id, ...d.data() }))).map((it) => ({
          ...it,
          ownerName: userMap[it.ownerId] || it.ownerName || "—",
        }))
      );

      setLoading(false);
    }

    loadData();

    // Real-time feedbacks with user enrichment
    const feedbackQ = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
    unsubFeedback = onSnapshot(feedbackQ, async (snap) => {
      setLoadErrors((previous) => ({ ...previous, feedback: null }));
      const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const enriched = await Promise.all(
        raw.map(async (fb) => {
          let userName = (fb.userId || "").slice(0, 8) || "—";
          let otherName = (fb.otherUserId || "").slice(0, 8) || "—";
          try {
            if (fb.userId) {
              const s = await getDoc(doc(db, "users", fb.userId));
              if (s.exists()) userName = s.data()?.displayName || s.data()?.name || s.data()?.email || userName;
            }
            if (fb.otherUserId) {
              const s = await getDoc(doc(db, "users", fb.otherUserId));
              if (s.exists()) otherName = s.data()?.displayName || s.data()?.name || s.data()?.email || otherName;
            }
          } catch { /* ignore */ }
          return { ...fb, userName, otherName };
        })
      );
      setFeedbacks(enriched);
    }, () => {
      setLoadErrors((previous) => ({ ...previous, feedback: "feedbacks" }));
    });

    return () => unsubFeedback();
  }, [authLoading, isAdmin]);

  const problems = useMemo(() => exchanges.filter((ex) => ex.meetingProblem), [exchanges]);
  const feedbackFlags = useMemo(() => feedbacks.filter((fb) => fb.flags && Object.values(fb.flags).some(Boolean)), [feedbacks]);
  const exchangeUnavailable = loadErrors.queries?.includes("échanges") ?? false;
  const reportsIncomplete = exchangeUnavailable || Boolean(loadErrors.feedback);
  const failedLoads = [...(loadErrors.queries || []), ...(loadErrors.feedback ? [loadErrors.feedback] : [])];

  // Auth checks
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Chargement…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/feed" replace />;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 20px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: ACCENT, marginBottom: 8 }}>
              Troco — Admin
            </p>
            <h1 style={{ fontSize: 30, fontWeight: 700, margin: 0, lineHeight: 1.1 }}>Bonjour Alex 👋</h1>
            <p style={{ color: MUTED, marginTop: 8, fontSize: 14 }}>
              Tableau de bord en temps réel · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/feed")}
            style={{ padding: "8px 16px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, color: MUTED2, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            ← App
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, flexWrap: "wrap", borderBottom: `1px solid ${BORDER}`, paddingBottom: 12 }}>
          {TABS.map((t) => (
            <TabBtn key={t.id} id={t.id} active={tab === t.id} onClick={setTab}>{t.label}</TabBtn>
          ))}
        </div>

        {failedLoads.length > 0 && (
          <div role="alert" style={{ padding: "12px 16px", marginBottom: 20, color: "#fca5a5", background: "rgba(252,165,165,0.08)", border: "1px solid rgba(252,165,165,0.2)", borderRadius: 12, fontSize: 13 }}>
            Données indisponibles : {failedLoads.join(", ")}. Les sections concernées peuvent être incomplètes.
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: MUTED, fontSize: 14 }}>Chargement des données…</div>
        ) : (
          <>
            {tab === "overview"  && <TabOverview counts={counts} recentExchanges={recentExchanges} recentItems={recentItems} problems={problems} />}
            {tab === "users"     && <TabUsers users={users} />}
            {tab === "items"     && <TabItems items={items} />}
            {tab === "exchanges" && <TabExchanges exchanges={exchanges} unavailable={exchangeUnavailable} />}
            {tab === "feedbacks" && <TabFeedbacks feedbacks={feedbacks} />}
            {tab === "reports"   && <TabReports problems={problems} feedbackFlags={feedbackFlags} dataIncomplete={reportsIncomplete} />}
            {tab === "journal"   && <TabJournal />}
          </>
        )}
      </div>
    </div>
  );
}
