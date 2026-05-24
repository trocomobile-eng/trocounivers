import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, Repeat2 } from "lucide-react";
import { db } from "../firebase";
import BottomNav from "../components/BottomNav";

// ─── helpers ──────────────────────────────────────────────────────────────────
function getImage(exchange, side) {
  if (side === "a") return exchange?.requestedItemImage || exchange?.requestedItemImages?.[0] || exchange?.offeredItemImage || null;
  return exchange?.offeredItemImage || exchange?.offeredItemImages?.[0] || exchange?.requestedItemImage || null;
}
function getTitle(exchange, side) {
  if (side === "a") return exchange?.requestedItemTitle || exchange?.requestedTitle || "Objet";
  return exchange?.offeredItemTitle || exchange?.offeredTitle || "Objet";
}
function getItemId(exchange, side) {
  if (side === "a") return exchange?.requestedItemId || exchange?.itemId || null;
  return exchange?.offeredItemId || exchange?.proposedItemId || null;
}
function shortName(name = "") {
  const c = String(name).trim();
  if (!c) return "Membre Troco";
  if (c.includes("@")) return c.split("@")[0];
  const parts = c.split(" ");
  return parts.length > 1 ? `${parts[0]} ${parts[1].charAt(0)}.` : c;
}
function formatRelativeTime(value) {
  const raw = value?.toDate?.() || (value?.seconds ? new Date(value.seconds * 1000) : value ? new Date(value) : null);
  if (!raw || isNaN(raw)) return "récemment";
  const diff = Date.now() - raw.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} j`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`;
  return raw.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

// ─── carte objet ──────────────────────────────────────────────────────────────
function ObjectCard({ img, title, itemId, accent }) {
  const inner = (
    <div className="group overflow-hidden rounded-[20px] border border-white/80 bg-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {img
          ? <img src={img} alt={title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          : <div className="flex h-full w-full items-center justify-center text-4xl text-slate-200">📦</div>
        }
        {/* badge "voir l'objet" si cliquable */}
        {itemId && (
          <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 transition group-hover:opacity-100">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-slate-700 shadow backdrop-blur-md">
              Voir l'objet →
            </span>
          </div>
        )}
      </div>
      <div className="px-4 py-3">
        <p className="font-black leading-tight tracking-tight text-slate-900" style={{ fontSize: 15 }}>
          {title}
        </p>
        <span className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10.5px] font-bold" style={{ background: `${accent}18`, color: accent }}>
          Échangé ✓
        </span>
      </div>
    </div>
  );

  if (itemId) {
    return <Link to={`/items/${itemId}`} className="block">{inner}</Link>;
  }
  return <div>{inner}</div>;
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function ExchangeShowcasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "exchanges", id)).then((snap) => {
      setExchange(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    }).catch(() => { setExchange(null); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="troco-screen min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm font-medium">Chargement…</p>
      </div>
    );
  }

  if (!exchange) {
    return (
      <div className="troco-screen min-h-screen px-4 pt-[max(14px,env(safe-area-inset-top))]">
        <button type="button" onClick={() => navigate(-1)} className="troco-floating-action mb-6 flex h-10 w-10 items-center justify-center">
          <ArrowLeft size={17} className="text-slate-700" />
        </button>
        <p className="text-center text-slate-500">Cet échange n'existe plus.</p>
      </div>
    );
  }

  const imgA    = getImage(exchange, "a");
  const imgB    = getImage(exchange, "b");
  const titleA  = getTitle(exchange, "a");
  const titleB  = getTitle(exchange, "b");
  const itemIdA = getItemId(exchange, "a");
  const itemIdB = getItemId(exchange, "b");
  const sender  = shortName(exchange.senderName || exchange.senderDisplayName);
  const receiver = shortName(exchange.receiverName || exchange.receiverDisplayName);
  const when    = formatRelativeTime(exchange.updatedAt || exchange.completedAt || exchange.createdAt);

  // couleur accent depuis le premier univers dispo
  const accent = "#1a7a4a";

  return (
    <div className="troco-screen min-h-screen pb-28">
      <main className="mx-auto w-full max-w-[480px] px-4 pt-[max(14px,env(safe-area-inset-top))]">

        {/* header */}
        <header className="mb-6 flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="troco-floating-action flex h-10 w-10 shrink-0 items-center justify-center">
            <ArrowLeft size={17} className="text-slate-700" />
          </button>
          <div>
            <p className="troco-caption">Troc réalisé</p>
            <h1 className="text-[20px] font-black leading-tight tracking-[-0.04em] text-slate-900">
              Un échange a eu lieu
            </h1>
          </div>
        </header>

        {/* participants */}
        <div className="mb-5 flex items-center justify-center gap-2 text-[13px] font-semibold text-slate-500">
          <span className="font-black text-slate-800">{sender}</span>
          <Repeat2 size={16} strokeWidth={2.2} className="text-emerald-500" />
          <span className="font-black text-slate-800">{receiver || "un membre"}</span>
          <span className="text-slate-400">· {when}</span>
        </div>

        {/* les deux objets */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <ObjectCard img={imgA} title={titleA} itemId={itemIdA} accent={accent} />
          <ObjectCard img={imgB} title={titleB} itemId={itemIdB} accent={accent} />
        </div>

        {/* message inspirant */}
        <div className="rounded-[22px] border border-white/80 bg-white/72 px-5 py-4 text-center shadow-[0_10px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl">
          <p className="text-[13px] font-semibold leading-relaxed text-slate-600">
            Ces deux objets ont trouvé un nouveau foyer grâce à Troco.
            <br />
            <span className="font-black text-slate-800">Et toi, qu'as-tu à échanger ?</span>
          </p>
          <Link
            to="/feed"
            className="mt-3 inline-block rounded-full px-5 py-2.5 text-[13px] font-black text-white shadow-[0_8px_20px_rgba(26,122,74,0.2)] transition active:scale-95"
            style={{ background: "#1a7a4a" }}
          >
            Explorer les objets →
          </Link>
        </div>

      </main>
      <BottomNav />
    </div>
  );
}
