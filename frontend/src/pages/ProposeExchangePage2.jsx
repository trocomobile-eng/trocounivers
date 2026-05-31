import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { ArrowLeft, Check, MapPin, Repeat2 } from "lucide-react";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import BottomNav from "../components/BottomNav";
import {
  formatLocation,
  getDisplayItemDetails,
  getDisplayItemType,
  getItemImage,
} from "../utils/format";

// ─── helpers ──────────────────────────────────────────────────────────────────
function getOwnerId(item) {
  return item?.ownerId || item?.userId || item?.ownerUid || item?.createdBy || item?.uid || "";
}

function isMyItem(item, user) {
  if (!item || !user?.uid) return false;
  const uid = String(user.uid);
  const email = String(user.email || "").toLowerCase();
  return (
    String(item.ownerId   || "") === uid ||
    String(item.userId    || "") === uid ||
    String(item.ownerUid  || "") === uid ||
    String(item.createdBy || "") === uid ||
    String(item.uid       || "") === uid ||
    (email && String(item.ownerEmail     || "").toLowerCase() === email) ||
    (email && String(item.userEmail      || "").toLowerCase() === email) ||
    (email && String(item.createdByEmail || "").toLowerCase() === email)
  );
}

function getOwnerName(item, ownerProfile) {
  return (
    item?.ownerName ||
    item?.ownerDisplayName ||
    ownerProfile?.displayName ||
    item?.ownerEmail ||
    "Utilisateur Troco"
  );
}

function shortName(name = "") {
  const c = String(name).trim();
  if (!c) return "Utilisateur";
  if (c.includes("@")) return c.split("@")[0];
  const parts = c.split(" ");
  return parts.length <= 1 ? c : `${parts[0]} ${parts[1]?.charAt(0) || ""}.`.trim();
}

function getCurrentUserName(user) {
  return user?.displayName || user?.email || "Utilisateur Troco";
}

// ─── mini-card objet cible ─────────────────────────────────────────────────────
function TargetItemPreview({ item }) {
  const img    = getItemImage(item);
  const title  = getDisplayItemType(item);
  const detail = getDisplayItemDetails(item);
  const loc    = formatLocation(item);

  return (
    <div
      className="flex items-center gap-4 rounded-[16px] p-4"
      style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="h-20 w-20 shrink-0 rounded-[12px] overflow-hidden bg-[#222]">
        {img
          ? <img src={img} alt={title} className="h-full w-full object-cover" />
          : <div className="h-full w-full flex items-center justify-center text-2xl text-white/10">📦</div>
        }
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#8ec9d4" }}>
          Objet demandé
        </p>
        <h2 className="text-white font-black leading-tight line-clamp-2"
            style={{ fontSize: 17, letterSpacing: "-0.03em" }}>
          {title}
        </h2>
        {detail && (
          <p className="text-[12px] font-medium mt-0.5 line-clamp-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            {detail}
          </p>
        )}
        {loc && (
          <div className="mt-1.5 flex items-center gap-1">
            <MapPin size={10} strokeWidth={2.5} style={{ color: "#5dcaa5" }} />
            <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>{loc}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── card objet sélectionnable ────────────────────────────────────────────────
function SelectableItemCard({ item, selected, onSelect }) {
  const img   = getItemImage(item);
  const title = getDisplayItemType(item);

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className="relative text-left rounded-[14px] overflow-hidden transition-all active:scale-[0.97]"
      style={{
        background: selected ? "#1a2e20" : "#1a1a1a",
        border: selected
          ? "1.5px solid rgba(93,202,165,0.6)"
          : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* photo */}
      <div className="relative aspect-[1/1] overflow-hidden bg-[#222]">
        {img
          ? <img src={img} alt={title} className="w-full h-full object-cover" style={{ opacity: 0.85 }} />
          : <div className="w-full h-full flex items-center justify-center text-2xl text-white/10">📦</div>
        }
        {/* check badge */}
        {selected && (
          <div
            className="absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center"
            style={{ background: "#5dcaa5" }}
          >
            <Check size={14} strokeWidth={3} className="text-white" />
          </div>
        )}
      </div>
      {/* titre */}
      <div className="p-2.5">
        <p
          className="text-[12px] font-black leading-tight line-clamp-2"
          style={{ color: selected ? "#5dcaa5" : "rgba(255,255,255,0.75)", letterSpacing: "-0.01em" }}
        >
          {title}
        </p>
      </div>
    </button>
  );
}

// ─── page principale ───────────────────────────────────────────────────────────
export default function ProposeExchangePage() {
  const { itemId, id } = useParams();
  const requestedItemId = itemId || id;
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [requestedItem, setRequestedItem] = useState(null);
  const [ownerProfile, setOwnerProfile]   = useState(null);
  const [myItems, setMyItems]             = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [message, setMessage]             = useState("");
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) { navigate("/login", { replace: true }); return; }

    async function loadData() {
      setLoading(true);
      try {
        const reqSnap = await getDoc(doc(db, "items", requestedItemId));
        if (!reqSnap.exists()) { setRequestedItem(null); return; }

        const reqData = { id: reqSnap.id, ...reqSnap.data() };
        setRequestedItem(reqData);

        const ownerId = getOwnerId(reqData);
        if (ownerId) {
          try {
            const ownerSnap = await getDoc(doc(db, "users", ownerId));
            if (ownerSnap.exists()) setOwnerProfile(ownerSnap.data());
          } catch { /* silently fail */ }
        }

        // charger mes objets
        const q = query(collection(db, "items"), where("ownerId", "==", user.uid));
        const mySnap = await getDocs(q);
        let list = mySnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (list.length === 0) {
          const all = await getDocs(collection(db, "items"));
          list = all.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((it) => getOwnerId(it) === user.uid);
        }

        setMyItems(
          list.filter((it) => it.id !== requestedItemId && (it.status || "active") !== "deleted")
        );
      } catch (err) {
        console.error("Erreur chargement proposition :", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [authLoading, user?.uid, requestedItemId, navigate]);

  const selectedItems = useMemo(
    () => myItems.filter((it) => selectedItemIds.includes(it.id)),
    [myItems, selectedItemIds]
  );

  const ownerId    = getOwnerId(requestedItem);
  const ownerName  = getOwnerName(requestedItem, ownerProfile);
  const canSend    = requestedItem && ownerId && user?.uid &&
                     !isMyItem(requestedItem, user) &&
                     selectedItemIds.length > 0 && selectedItemIds.length <= 2 && !sending;

  function toggleItem(itemIdToToggle) {
    setSelectedItemIds((cur) => {
      if (cur.includes(itemIdToToggle)) return cur.filter((i) => i !== itemIdToToggle);
      if (cur.length >= 2) return cur;
      return [...cur, itemIdToToggle];
    });
  }

  async function sendProposal() {
    if (isMyItem(requestedItem, user)) {
      alert("Tu ne peux pas proposer un troc sur ton propre objet.");
      navigate(`/items/${requestedItem.id}`, { replace: true });
      return;
    }
    if (!canSend) { alert("Sélectionne un ou deux objets à proposer."); return; }

    setSending(true);
    try {
      const offeredTitles  = selectedItems.map((it) => getDisplayItemType(it));
      const requestedTitle = getDisplayItemType(requestedItem);

      await addDoc(collection(db, "exchanges"), {
        status: "pending",
        counterStatus: "",
        availabilityStatus: "not_started",
        chatOpen: false,

        requestedItemId: requestedItem.id,
        requestedItemTitle: requestedTitle,
        requestedItemImage: getItemImage(requestedItem),

        offeredItemIds:    selectedItemIds,
        offeredItemId:     selectedItemIds[0] || "",
        offeredItemTitles: offeredTitles,
        offeredItemTitle:  offeredTitles[0] || "",
        offeredItemImages: selectedItems.map((it) => getItemImage(it)),
        offeredItemImage:  getItemImage(selectedItems[0]),

        senderId:    user.uid,
        senderName:  getCurrentUserName(user),
        senderEmail: user.email || "",

        receiverId:    ownerId,
        receiverName:  ownerName,
        receiverEmail: requestedItem.ownerEmail || "",

        participants:      [user.uid, ownerId],
        needsAttentionFor: ownerId,
        lastActionBy:      user.uid,
        notificationType:  "new_proposal",

        message: message.trim(),
        chatMessages: message.trim()
          ? [{ senderId: user.uid, senderName: getCurrentUserName(user), text: message.trim(), createdAt: new Date().toISOString() }]
          : [],

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate("/exchanges", { replace: true });
    } catch (err) {
      console.error("Erreur envoi proposition :", err);
      alert("Impossible d'envoyer la proposition.");
    } finally {
      setSending(false);
    }
  }

  // ── loading ────────────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen pb-28" style={{ background: "#0d0d0d" }}>
        <div className="flex items-center justify-center pt-32 text-white/30 text-sm font-bold">
          Chargement…
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── not found ──────────────────────────────────────────────────────────────
  if (!requestedItem) {
    return (
      <div className="min-h-screen pb-28" style={{ background: "#0d0d0d" }}>
        <div className="px-4 pt-[max(14px,env(safe-area-inset-top))]">
          <button
            type="button" onClick={() => navigate(-1)}
            className="h-9 w-9 flex items-center justify-center rounded-full mb-6"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
          >
            <ArrowLeft size={16} className="text-white/70" />
          </button>
          <div className="rounded-[18px] p-6 text-center" style={{ background: "#1a1a1a" }}>
            <p className="text-white font-black">Cet objet n'existe plus.</p>
            <button
              type="button" onClick={() => navigate("/feed")}
              className="mt-4 px-5 py-2.5 rounded-full text-sm font-black text-white"
              style={{ background: "#1a4d2e" }}
            >
              Retour au feed
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── own item guard ─────────────────────────────────────────────────────────
  if (isMyItem(requestedItem, user)) {
    return (
      <div className="min-h-screen pb-28" style={{ background: "#0d0d0d" }}>
        <div className="px-4 pt-[max(14px,env(safe-area-inset-top))]">
          <button
            type="button" onClick={() => navigate(-1)}
            className="h-9 w-9 flex items-center justify-center rounded-full mb-6"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
          >
            <ArrowLeft size={16} className="text-white/70" />
          </button>
          <div className="rounded-[18px] p-6 text-center" style={{ background: "#1a1a1a" }}>
            <p className="text-white font-black">C'est ton propre objet.</p>
            <button
              type="button" onClick={() => navigate(`/items/${requestedItem.id}`)}
              className="mt-4 px-5 py-2.5 rounded-full text-sm font-black text-white"
              style={{ background: "#1a4d2e" }}
            >
              Retour à l'objet
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-36" style={{ background: "#0d0d0d" }}>
      <div className="mx-auto w-full max-w-[430px] px-4 pt-[max(14px,env(safe-area-inset-top))]">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <header className="flex items-center gap-3 mb-5">
          <button
            type="button" onClick={() => navigate(-1)}
            className="h-9 w-9 flex items-center justify-center rounded-full shrink-0"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            aria-label="Retour"
          >
            <ArrowLeft size={16} className="text-white/70" />
          </button>
          <div>
            <h1 className="text-white font-black leading-tight"
                style={{ fontSize: 19, letterSpacing: "-0.03em" }}>
              Proposer un troc
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Choisis ce que tu proposes à {shortName(ownerName)}
            </p>
          </div>
        </header>

        {/* ── Objet cible ────────────────────────────────────────────────────── */}
        <TargetItemPreview item={requestedItem} />

        {/* séparateur ⇄ */}
        <div className="flex items-center gap-3 my-4 px-2">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#1a2e20", border: "1px solid rgba(93,202,165,0.3)" }}
          >
            <Repeat2 size={14} style={{ color: "#5dcaa5" }} strokeWidth={2.2} />
          </div>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* ── Sélection mes objets ───────────────────────────────────────────── */}
        <div
          className="rounded-[18px] p-4 mb-4"
          style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest mb-1"
             style={{ color: "#5dcaa5" }}>
            Ton offre
          </p>
          <h2 className="text-white font-black mb-1"
              style={{ fontSize: 17, letterSpacing: "-0.03em" }}>
            Sélectionne 1 ou 2 objets
          </h2>
          <p className="text-[12px] font-medium mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
            Tu peux combiner deux objets pour équilibrer l'échange.
          </p>

          {myItems.length === 0 ? (
            <div className="rounded-[14px] p-5 text-center" style={{ background: "#1a1a1a" }}>
              <p className="text-white font-black text-sm">Ta bibliothèque est vide.</p>
              <p className="text-white/35 text-xs mt-1 mb-3">
                Ajoute un objet pour pouvoir proposer un troc.
              </p>
              <button
                type="button" onClick={() => navigate("/add")}
                className="px-4 py-2 rounded-full text-sm font-black text-white"
                style={{ background: "#1a4d2e" }}
              >
                Ajouter un objet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {myItems.map((item) => (
                <SelectableItemCard
                  key={item.id}
                  item={item}
                  selected={selectedItemIds.includes(item.id)}
                  onSelect={toggleItem}
                />
              ))}
            </div>
          )}

          {/* résumé sélection */}
          {selectedItemIds.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {selectedItems.map((it) => (
                <span
                  key={it.id}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(93,202,165,0.15)", color: "#5dcaa5" }}
                >
                  ✓ {getDisplayItemType(it)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Message ────────────────────────────────────────────────────────── */}
        <div
          className="rounded-[18px] p-4 mb-4"
          style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3"
             style={{ color: "rgba(255,255,255,0.35)" }}>
            Message (optionnel)
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder={`Ajoute un mot pour ${shortName(ownerName)}…`}
            className="w-full resize-none rounded-[12px] px-3 py-3 text-[13px] font-medium outline-none"
            style={{
              background: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.75)",
              caretColor: "#5dcaa5",
            }}
          />
        </div>

        {/* ── CTA ────────────────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={sendProposal}
          disabled={!canSend}
          className="w-full h-14 flex items-center justify-center gap-2 rounded-full text-[15px] font-black text-white transition active:scale-[0.98] disabled:opacity-40"
          style={{ background: canSend ? "#1a4d2e" : "#1a1a1a" }}
        >
          <Repeat2 size={18} strokeWidth={2.4} />
          {sending ? "Envoi en cours…" : "Envoyer la proposition"}
        </button>

      </div>
      <BottomNav />
    </div>
  );
}
