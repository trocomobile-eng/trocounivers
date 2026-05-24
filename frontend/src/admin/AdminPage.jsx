import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// ⚠️ Remplace par ton propre uid Firebase
// Tu le trouves dans Firebase Console → Authentication → Users
const ADMIN_UID = "wXeLxwSQaqPjvyzsWTjvftYvt972";

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
    slate: "bg-slate-50 text-slate-600",
  };
  return (
    <div className={`rounded-[20px] p-4 ${colors[color]}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-70">{title}</p>
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

    async function loadFeedbacks() {
      try {
        const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Enrichir avec les noms des utilisateurs
        const enriched = await Promise.all(
          raw.map(async (fb) => {
            let userName = fb.userId?.slice(0, 8) || "—";
            let otherName = fb.otherUserId?.slice(0, 8) || "—";

            try {
              if (fb.userId) {
                const userSnap = await getDoc(doc(db, "users", fb.userId));
                if (userSnap.exists()) {
                  userName = userSnap.data()?.displayName || userSnap.data()?.email || userName;
                }
              }
              if (fb.otherUserId) {
                const otherSnap = await getDoc(doc(db, "users", fb.otherUserId));
                if (otherSnap.exists()) {
                  otherName = otherSnap.data()?.displayName || otherSnap.data()?.email || otherName;
                }
              }
            } catch {
              // silencieux
            }

            return { ...fb, userName, otherName };
          })
        );

        setFeedbacks(enriched);
      } catch (error) {
        console.error("Erreur chargement feedbacks :", error);
      } finally {
        setLoading(false);
      }
    }

    loadFeedbacks();
  }, [authLoading, user?.uid, navigate]);

  const filtered = feedbacks.filter((fb) => {
    if (filter === "positive") return fb.answers?.overall === "excellent" || fb.answers?.overall === "good";
    if (filter === "negative") return fb.answers?.overall === "bad" || fb.answers?.overall === "ok";
    if (filter === "again_no") return fb.answers?.would_do_again === "no";
    return true;
  });

  // Stats globales
  const total = feedbacks.length;
  const positive = feedbacks.filter((fb) => fb.answers?.overall === "excellent" || fb.answers?.overall === "good").length;
  const wouldDoAgain = feedbacks.filter((fb) => fb.answers?.would_do_again === "yes").length;
  const different = feedbacks.filter((fb) => fb.answers?.item_match === "different").length;
  const positiveRate = total ? Math.round((positive / total) * 100) : 0;

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-bold text-slate-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.20em] text-slate-400">
              Troco Admin
            </p>
            <h1 className="mt-1 text-[28px] font-black tracking-[-0.04em]">
              Feedbacks post-meeting
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/feed")}
            className="rounded-full bg-white px-4 py-2 text-[13px] font-black text-slate-600 shadow-sm"
          >
            ← Retour à l'app
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard title="Total feedbacks" value={total} color="slate" />
          <StatCard title="Satisfaction" value={`${positiveRate} %`} sub={`${positive} positifs`} color="emerald" />
          <StatCard title="Referaient un troc" value={`${total ? Math.round((wouldDoAgain / total) * 100) : 0} %`} sub={`${wouldDoAgain} / ${total}`} color="sky" />
          <StatCard title="Objet non conforme" value={different} sub="différent de l'annonce" color="amber" />
        </div>

        {/* Filtres */}
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { id: "all", label: "Tous" },
            { id: "positive", label: "😊 Positifs" },
            { id: "negative", label: "😕 Négatifs / OK" },
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
              {f.label} {f.id === "all" ? `(${total})` : ""}
            </button>
          ))}
        </div>

        {/* Tableau */}
        {filtered.length === 0 ? (
          <div className="rounded-[20px] bg-white p-8 text-center text-sm font-bold text-slate-400">
            Aucun feedback pour l'instant.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[20px] bg-white shadow-sm">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Auteur</th>
                  <th className="px-4 py-3">Sujet</th>
                  <th className="px-4 py-3">Rencontre</th>
                  <th className="px-4 py-3">Autre personne</th>
                  <th className="px-4 py-3">Objet conforme</th>
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
                      <a
                        href={`/exchanges/${fb.exchangeId}`}
                        className="font-black text-emerald-600 hover:underline"
                      >
                        Voir →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-center text-[11px] text-slate-300">
          {filtered.length} feedback{filtered.length > 1 ? "s" : ""} affichés
        </p>
      </div>
    </div>
  );
}
