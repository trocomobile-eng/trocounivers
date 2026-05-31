import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const ADMIN_UID = "wXeLxwSQaqPjvyzsWTjvftYvt972";

const SURVEY_LABELS = {
  after_add_item: {
    ease: { 1: "😤 Difficile", 2: "😕 Compliqué", 3: "😐 Correct", 4: "😊 Facile", 5: "🤩 Très facile" },
    blocker: {
      photos: "📸 Photos",
      title: "✏️ Titre",
      category: "🏷️ Catégorie",
      condition: "⭐ État",
      nothing: "✅ Rien",
    },
  },
};

const ANSWER_LABELS = {
  overall: {
    excellent: "🤩 Excellente",
    good: "😊 Très bien",
    ok: "😐 Correct",
    bad: "😕 Difficile",
  },
  other_person: {
    punctual: "⏰ Ponctuelle",
    friendly: "🤝 Sympa",
    trustworthy: "🛡️ De confiance",
    late: "⌛ En retard",
  },
  item_match: {
    perfect: "✅ Exactement",
    mostly: "👍 À peu près",
    different: "⚠️ Différent",
  },
  would_do_again: {
    yes: "🔁 Absolument",
    maybe: "🤔 Peut-être",
    no: "❌ Non",
  },
};

function formatDate(value) {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function label(category, value) {
  return ANSWER_LABELS[category]?.[value] || value || "—";
}

function StatCard({ title, value, sub, color = "emerald" }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-50 text-slate-600",
  };

  return (
    <div className={`rounded-[20px] p-4 ${colors[color]}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-70">
        {title}
      </p>
      <p className="mt-1 text-[32px] font-black leading-none">{value}</p>
      {sub && <p className="mt-1 text-[12px] font-medium opacity-70">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState("post_meeting");

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.uid !== ADMIN_UID) {
      navigate("/feed", { replace: true });
      return;
    }

    setLoading(true);

    const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      async (snap) => {
        try {
          const raw = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));

          const enriched = await Promise.all(
            raw.map(async (fb) => {
              let userName = fb.userId?.slice(0, 8) || "—";
              let otherName = fb.otherUserId?.slice(0, 8) || "—";

              try {
                if (fb.userId) {
                  const userSnap = await getDoc(doc(db, "users", fb.userId));
                  if (userSnap.exists()) {
                    const data = userSnap.data();
                    userName =
                      data?.displayName ||
                      data?.name ||
                      data?.email ||
                      userName;
                  }
                }

                if (fb.otherUserId) {
                  const otherSnap = await getDoc(doc(db, "users", fb.otherUserId));
                  if (otherSnap.exists()) {
                    const data = otherSnap.data();
                    otherName =
                      data?.displayName ||
                      data?.name ||
                      data?.email ||
                      otherName;
                  }
                }
              } catch (error) {
                console.error("Erreur lecture utilisateur feedback :", error);
              }

              return {
                ...fb,
                userName,
                otherName,
              };
            })
          );

          setFeedbacks(enriched);
        } catch (error) {
          console.error("Erreur traitement feedbacks :", error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Erreur écoute feedbacks :", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user?.uid, navigate]);

  const postMeetingFeedbacks = useMemo(() =>
    feedbacks.filter((fb) => !fb.surveyId || fb.surveyId === "post_meeting"),
    [feedbacks]
  );

  const addItemFeedbacks = useMemo(() =>
    feedbacks.filter((fb) => fb.surveyId === "after_add_item"),
    [feedbacks]
  );

  const filtered = useMemo(() => {
    const base = tab === "add_item" ? addItemFeedbacks : postMeetingFeedbacks;
    return base.filter((fb) => {
      if (filter === "positive") {
        return fb.answers?.overall === "excellent" || fb.answers?.overall === "good";
      }

      if (filter === "negative") {
        return fb.answers?.overall === "bad" || fb.answers?.overall === "ok";
      }

      if (filter === "again_no") {
        return fb.answers?.would_do_again === "no";
      }

      if (filter === "different") {
        return fb.answers?.item_match === "different";
      }

      return true;
    });
  }, [feedbacks, filter, tab, postMeetingFeedbacks, addItemFeedbacks]);

  const stats = useMemo(() => {
    const total = feedbacks.length;

    const positive = feedbacks.filter(
      (fb) => fb.answers?.overall === "excellent" || fb.answers?.overall === "good"
    ).length;

    const wouldDoAgain = feedbacks.filter(
      (fb) => fb.answers?.would_do_again === "yes"
    ).length;

    const different = feedbacks.filter(
      (fb) => fb.answers?.item_match === "different"
    ).length;

    const bad = feedbacks.filter(
      (fb) => fb.answers?.overall === "bad"
    ).length;

    return {
      total,
      positive,
      wouldDoAgain,
      different,
      bad,
      positiveRate: total ? Math.round((positive / total) * 100) : 0,
      againRate: total ? Math.round((wouldDoAgain / total) * 100) : 0,
    };
  }, [feedbacks]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-bold text-slate-400">Chargement admin...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.20em] text-slate-400">
              Troco Admin
            </p>
            <h1 className="mt-1 text-[28px] font-black tracking-[-0.04em]">
              Feedbacks post-meeting
            </h1>
            <p className="mt-1 text-[13px] font-medium text-slate-400">
              Mise à jour automatique depuis Firestore.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/feed")}
            className="rounded-full bg-white px-4 py-2 text-[13px] font-black text-slate-600 shadow-sm"
          >
            ← Retour
          </button>
        </div>

        {/* Onglets */}
        <div className="mb-6 flex gap-2">
          {[
            { id: "post_meeting", label: `🤝 Post-meeting (${postMeetingFeedbacks.length})` },
            { id: "add_item",     label: `📦 Ajout objet (${addItemFeedbacks.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                "rounded-full px-4 py-2 text-[13px] font-black transition",
                tab === t.id ? "bg-slate-900 text-white" : "bg-white text-slate-600 shadow-sm",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard title="Total" value={stats.total} color="slate" />
          <StatCard title="Satisfaction" value={`${stats.positiveRate} %`} sub={`${stats.positive} positifs`} color="emerald" />
          <StatCard title="Referaient" value={`${stats.againRate} %`} sub={`${stats.wouldDoAgain} / ${stats.total}`} color="sky" />
          <StatCard title="Objet différent" value={stats.different} color="amber" />
          <StatCard title="Difficile" value={stats.bad} color="red" />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { id: "all", label: `Tous (${stats.total})` },
            { id: "positive", label: "😊 Positifs" },
            { id: "negative", label: "😕 Négatifs / OK" },
            { id: "different", label: "⚠️ Objet différent" },
            { id: "again_no", label: "❌ Ne referait pas" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={[
                "rounded-full px-4 py-1.5 text-[13px] font-black transition",
                filter === f.id
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 shadow-sm",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-[20px] bg-white p-8 text-center text-sm font-bold text-slate-400">
            Aucun feedback pour ce filtre.
          </div>
        ) : tab === "add_item" ? (
          <div className="overflow-hidden rounded-[20px] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-[13px]">
                <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Utilisateur</th>
                    <th className="px-4 py-3">Facilité</th>
                    <th className="px-4 py-3">Bloqueur</th>
                    <th className="px-4 py-3">Objet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((fb) => (
                    <tr key={fb.id} className="hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-400">{formatDate(fb.createdAt)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{fb.userName}</td>
                      <td className="px-4 py-3">{SURVEY_LABELS.after_add_item.ease[fb.answers?.ease] || fb.answers?.ease || "—"}</td>
                      <td className="px-4 py-3">{SURVEY_LABELS.after_add_item.blocker[fb.answers?.blocker] || fb.answers?.blocker || "—"}</td>
                      <td className="px-4 py-3">
                        {fb.metadata?.itemId ? (
                          <a href={`/items/${fb.metadata.itemId}`} className="font-black text-emerald-600 hover:underline">Voir →</a>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[20px] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-[13px]">
                <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Auteur</th>
                    <th className="px-4 py-3">Sur</th>
                    <th className="px-4 py-3">Rencontre</th>
                    <th className="px-4 py-3">Autre personne</th>
                    <th className="px-4 py-3">Objet</th>
                    <th className="px-4 py-3">Referait</th>
                    <th className="px-4 py-3">Échange</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {filtered.map((fb) => (
                    <tr key={fb.id} className="hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                        {formatDate(fb.createdAt)}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {fb.userName}
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {fb.otherName}
                      </td>

                      <td className="px-4 py-3">
                        {label("overall", fb.answers?.overall)}
                      </td>

                      <td className="px-4 py-3">
                        {label("other_person", fb.answers?.other_person)}
                      </td>

                      <td className="px-4 py-3">
                        {label("item_match", fb.answers?.item_match)}
                      </td>

                      <td className="px-4 py-3">
                        {label("would_do_again", fb.answers?.would_do_again)}
                      </td>

                      <td className="px-4 py-3">
                        {fb.exchangeId ? (
                          <a
                            href={`/exchanges/${fb.exchangeId}`}
                            className="font-black text-emerald-600 hover:underline"
                          >
                            Voir →
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="mt-4 text-center text-[11px] text-slate-300">
          {filtered.length} feedback{filtered.length > 1 ? "s" : ""} affiché
          {filtered.length > 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}