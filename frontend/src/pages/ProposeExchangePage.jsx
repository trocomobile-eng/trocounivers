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
import { ArrowLeft, Check, MapPin, Plus, Repeat2, Send } from "lucide-react";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  formatLocation,
  getDisplayItemDetails,
  getDisplayItemType,
  getItemImage,
} from "../utils/format";

function clean(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function getOwnerId(item) {
  return item?.ownerId || item?.userId || item?.ownerUid || item?.createdBy || item?.uid || "";
}

function isMyItem(item, user) {
  if (!item || !user?.uid) return false;

  const uid = String(user.uid);
  const email = String(user.email || "").toLowerCase();

  return (
    String(item.ownerId || "") === uid ||
    String(item.userId || "") === uid ||
    String(item.ownerUid || "") === uid ||
    String(item.createdBy || "") === uid ||
    String(item.uid || "") === uid ||
    (email && String(item.ownerEmail || "").toLowerCase() === email) ||
    (email && String(item.userEmail || "").toLowerCase() === email) ||
    (email && String(item.createdByEmail || "").toLowerCase() === email)
  );
}

function getOwnerName(item, ownerProfile) {
  return (
    clean(item?.ownerName) ||
    clean(item?.ownerDisplayName) ||
    clean(ownerProfile?.displayName) ||
    clean(item?.ownerEmail) ||
    "Utilisateur Troco"
  );
}

function shortName(name = "") {
  const c = clean(name);
  if (!c) return "Utilisateur";
  if (c.includes("@")) return c.split("@")[0];

  const parts = c.split(" ");
  return parts.length <= 1 ? c : `${parts[0]} ${parts[1]?.charAt(0) || ""}.`.trim();
}

function getCurrentUserName(user) {
  return user?.displayName || user?.email || "Utilisateur Troco";
}

function TargetItemPreview({ item }) {
  const image = getItemImage(item);
  const title = getDisplayItemType(item);
  const detail = getDisplayItemDetails(item);
  const location = formatLocation(item);

  return (
    <section className="relative overflow-hidden rounded-[32px] bg-white shadow-[0_20px_56px_rgba(15,23,42,0.085)] ring-1 ring-black/[0.025]">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#E8F7EF]" />
      <div className="absolute -left-12 bottom-4 h-28 w-28 rounded-full bg-[#FFF3D8]" />

      <div className="relative p-3">
        <div className="relative overflow-hidden rounded-[26px] bg-[#F2EFE8]">
          <div className="aspect-[1.25/1]">
            {image ? (
              <img src={image} alt={title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-5xl text-slate-300">
                📦
              </div>
            )}
          </div>

          <div className="absolute left-3 top-3 rounded-full bg-white/94 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#087E72] shadow-[0_8px_20px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            Objet demandé
          </div>
        </div>

        <div className="px-1 pb-1 pt-4">
          <h2 className="line-clamp-2 text-[26px] font-black leading-[0.96] tracking-[-0.055em] text-[#081225]">
            {title}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {detail ? (
              <span className="rounded-full bg-[#E8F7EF] px-3 py-1.5 text-[13px] font-black text-[#087E72]">
                {detail}
              </span>
            ) : null}

            {location ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[13px] font-bold text-slate-500">
                <MapPin size={14} strokeWidth={2.35} className="text-[#087E72]" />
                {location}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function LibraryItemCard({ item, selected, onSelect }) {
  const image = getItemImage(item);
  const title = getDisplayItemType(item);
  const detail = getDisplayItemDetails(item);

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={[
        "group relative overflow-hidden rounded-[20px] bg-white text-left transition active:scale-[0.985]",
        selected
          ? "ring-2 ring-[#087E72] shadow-[0_16px_34px_rgba(8,126,114,0.20)]"
          : "ring-1 ring-black/[0.035] shadow-[0_10px_24px_rgba(15,23,42,0.055)]",
      ].join(" ")}
    >
      <div className="relative aspect-[0.92/1] overflow-hidden bg-[#F2EFE8]">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-active:scale-[0.99]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-slate-300">
            📦
          </div>
        )}

        <span
          className={[
            "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]",
            selected ? "bg-[#087E72] text-white" : "bg-white/86 text-transparent",
          ].join(" ")}
        >
          <Check size={14} strokeWidth={3} />
        </span>
      </div>

      <div className="p-2.5">
        <p className="line-clamp-2 text-[12px] font-black leading-tight tracking-[-0.025em] text-[#081225]">
          {title}
        </p>

        {detail ? (
          <p className="mt-1 line-clamp-1 text-[10.5px] font-semibold text-slate-500">
            {detail}
          </p>
        ) : null}
      </div>
    </button>
  );
}

function SelectedSummary({ selectedItems }) {
  if (selectedItems.length === 0) return null;

  return (
    <div className="mt-4 rounded-[22px] bg-[#EEF8F4] p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#087E72]">
        Sélection
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {selectedItems.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-black text-[#087E72] shadow-[0_8px_18px_rgba(15,23,42,0.035)]"
          >
            <Check size={12} strokeWidth={3} />
            {getDisplayItemType(item)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ProposeExchangePage() {
  const { itemId, id } = useParams();
  const requestedItemId = itemId || id;
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [requestedItem, setRequestedItem] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      navigate("/login", { replace: true });
      return;
    }

    async function loadData() {
      setLoading(true);

      try {
        const reqSnap = await getDoc(doc(db, "items", requestedItemId));

        if (!reqSnap.exists()) {
          setRequestedItem(null);
          return;
        }

        const reqData = { id: reqSnap.id, ...reqSnap.data() };
        setRequestedItem(reqData);

        const ownerId = getOwnerId(reqData);

        if (ownerId) {
          try {
            const ownerSnap = await getDoc(doc(db, "users", ownerId));
            if (ownerSnap.exists()) setOwnerProfile(ownerSnap.data());
          } catch {
            setOwnerProfile(null);
          }
        }

        // Charger ma bibliothèque avec plusieurs champs possibles.
        // Selon les anciennes pages Troco, les objets peuvent avoir ownerId, userId,
        // ownerUid, createdBy ou uid. On fusionne tout pour éviter une bibliothèque vide.
        const ownershipFields = ["ownerId", "userId", "ownerUid", "createdBy", "uid"];
        const found = new Map();

        await Promise.all(
          ownershipFields.map(async (field) => {
            try {
              const ownedQuery = query(collection(db, "items"), where(field, "==", user.uid));
              const ownedSnapshot = await getDocs(ownedQuery);

              ownedSnapshot.docs.forEach((document) => {
                found.set(document.id, { id: document.id, ...document.data() });
              });
            } catch (error) {
              console.warn(`Impossible de charger les objets via ${field}:`, error);
            }
          })
        );

        // Fallback complet : utile si certains objets ont une structure ancienne ou irrégulière.
        if (found.size === 0) {
          const allSnapshot = await getDocs(collection(db, "items"));

          allSnapshot.docs.forEach((document) => {
            const data = { id: document.id, ...document.data() };

            if (isMyItem(data, user) || getOwnerId(data) === user.uid) {
              found.set(document.id, data);
            }
          });
        }

        const list = Array.from(found.values());

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
    () => myItems.filter((item) => selectedItemIds.includes(item.id)),
    [myItems, selectedItemIds]
  );

  const ownerId = getOwnerId(requestedItem);
  const ownerName = getOwnerName(requestedItem, ownerProfile);

  const canSend =
    requestedItem &&
    ownerId &&
    user?.uid &&
    !isMyItem(requestedItem, user) &&
    selectedItemIds.length > 0 &&
    selectedItemIds.length <= 2 &&
    !sending;

  function toggleItem(itemIdToToggle) {
    setSelectedItemIds((current) => {
      if (current.includes(itemIdToToggle)) {
        return current.filter((itemId) => itemId !== itemIdToToggle);
      }

      if (current.length >= 2) return current;

      return [...current, itemIdToToggle];
    });
  }

  async function sendProposal() {
    if (isMyItem(requestedItem, user)) {
      alert("Tu ne peux pas proposer un troc sur ton propre objet.");
      navigate(`/items/${requestedItem.id}`, { replace: true });
      return;
    }

    if (!canSend) {
      alert("Sélectionne un ou deux objets à proposer.");
      return;
    }

    setSending(true);

    try {
      const offeredTitles = selectedItems.map((item) => getDisplayItemType(item));
      const requestedTitle = getDisplayItemType(requestedItem);

      await addDoc(collection(db, "exchanges"), {
        status: "pending",
        counterStatus: "",
        availabilityStatus: "not_started",
        chatOpen: false,

        requestedItemId: requestedItem.id,
        requestedItemTitle: requestedTitle,
        requestedItemImage: getItemImage(requestedItem),

        offeredItemIds: selectedItemIds,
        offeredItemId: selectedItemIds[0] || "",
        offeredItemTitles: offeredTitles,
        offeredItemTitle: offeredTitles[0] || "",
        offeredItemImages: selectedItems.map((item) => getItemImage(item)),
        offeredItemImage: getItemImage(selectedItems[0]),

        senderId: user.uid,
        senderName: getCurrentUserName(user),
        senderEmail: user.email || "",

        receiverId: ownerId,
        receiverName: ownerName,
        receiverEmail: requestedItem.ownerEmail || "",

        participants: [user.uid, ownerId],
        needsAttentionFor: ownerId,
        lastActionBy: user.uid,
        notificationType: "new_proposal",

        message: message.trim(),
        chatMessages: message.trim()
          ? [
              {
                senderId: user.uid,
                senderName: getCurrentUserName(user),
                text: message.trim(),
                createdAt: new Date().toISOString(),
              },
            ]
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

  if (authLoading || loading) {
    return (
      <>
        <div className="flex min-h-[60vh] items-center justify-center px-5">
          <div className="rounded-[24px] bg-white px-7 py-6 text-center text-sm font-bold text-slate-500 shadow-[0_18px_50px_rgba(15,23,42,0.055)]">
            Chargement…
          </div>
        </div>
      </>
    );
  }

  if (!requestedItem) {
    return (
      <>
        <div className="mx-auto max-w-[430px] px-4 pt-[max(14px,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#081225] shadow-[0_10px_26px_rgba(15,23,42,0.07)]"
            aria-label="Retour"
          >
            <ArrowLeft size={18} strokeWidth={2.35} />
          </button>

          <div className="rounded-[24px] bg-white p-7 text-center shadow-[0_16px_44px_rgba(15,23,42,0.055)]">
            <p className="text-lg font-black text-[#081225]">Cet objet n’existe plus.</p>

            <button
              type="button"
              onClick={() => navigate("/feed")}
              className="mt-5 rounded-full bg-[#087E72] px-5 py-3 text-sm font-black text-white"
            >
              Retour au feed
            </button>
          </div>
        </div>

      </>
    );
  }

  if (isMyItem(requestedItem, user)) {
    return (
      <>
        <div className="mx-auto max-w-[430px] px-4 pt-[max(14px,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#081225] shadow-[0_10px_26px_rgba(15,23,42,0.07)]"
            aria-label="Retour"
          >
            <ArrowLeft size={18} strokeWidth={2.35} />
          </button>

          <div className="rounded-[24px] bg-white p-7 text-center shadow-[0_16px_44px_rgba(15,23,42,0.055)]">
            <p className="text-lg font-black text-[#081225]">C’est ton propre objet.</p>

            <button
              type="button"
              onClick={() => navigate(`/items/${requestedItem.id}`)}
              className="mt-5 rounded-full bg-[#087E72] px-5 py-3 text-sm font-black text-white"
            >
              Retour à l’objet
            </button>
          </div>
        </div>

      </>
    );
  }

  // ─── Contenu partagé mobile + desktop ──────────────────────────────────────

  const headerBlock = (
    <header className="mb-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#081225] shadow-[0_10px_26px_rgba(15,23,42,0.07)]"
          aria-label="Retour"
        >
          <ArrowLeft size={19} strokeWidth={2.4} />
        </button>
        <span className="rounded-full bg-white px-4 py-2 text-[12px] font-black text-[#087E72] shadow-[0_10px_24px_rgba(15,23,42,0.045)]">
          {selectedItemIds.length}/2 objets
        </span>
      </div>
      <div className="mt-5">
        <p className="inline-flex rounded-full bg-[#E8F7EF] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#087E72]">
          Échange
        </p>
        <h1 className="mt-3 max-w-[330px] text-[34px] font-black leading-[0.92] tracking-[-0.065em] text-[#081225]">
          Propose ton échange
        </h1>
        <p className="mt-3 max-w-[340px] text-[14px] font-semibold leading-relaxed text-slate-500">
          Choisis dans ta bibliothèque ce que tu aimerais proposer à {shortName(ownerName)}.
        </p>
      </div>
    </header>
  );

  const leftBlock = (
    <>
      <TargetItemPreview item={requestedItem} />
      <div className="my-6 flex items-center gap-3 px-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#087E72] text-white shadow-[0_16px_34px_rgba(8,126,114,0.28)]">
          <Repeat2 size={20} strokeWidth={2.6} />
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-200 to-transparent" />
      </div>
      <section className="rounded-[32px] bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.025]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
            Message optionnel
          </p>
          <span className="rounded-full bg-[#FFF3D8] px-3 py-1 text-[11px] font-black text-[#B77900]">
            + humain
          </span>
        </div>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          placeholder={`Ajoute un mot pour ${shortName(ownerName)}\u2026`}
          className="mt-3 w-full resize-none rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-3 text-[14px] font-medium text-[#081225] outline-none placeholder:text-slate-400 focus:border-[#087E72]/35 focus:bg-white"
        />
      </section>
    </>
  );

  const rightBlock = (
    <section className="relative rounded-[32px] bg-white p-4 shadow-[0_20px_56px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.025]">
      <div className="absolute -top-3 right-5 rounded-full bg-[#087E72] px-3 py-1.5 text-[12px] font-black text-white shadow-[0_10px_24px_rgba(8,126,114,0.22)]">
        {selectedItemIds.length}/2 sélectionnés
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#087E72]">
        Ta bibliothèque
      </p>
      <h2 className="mt-1 text-[24px] font-black leading-tight tracking-[-0.05em] text-[#081225]">
        Choisis ton offre
      </h2>
      <p className="mt-2 text-[13px] font-medium leading-relaxed text-slate-500">
        Sélectionne 1 ou 2 objets. Troco prépare ensuite la proposition pour {shortName(ownerName)}.
      </p>
      {myItems.length === 0 ? (
        <div className="mt-5 rounded-[24px] bg-slate-50 p-6 text-center">
          <p className="text-sm font-black text-[#081225]">Aucun objet dans ta bibliothèque.</p>
          <p className="mb-4 mt-1 text-xs font-medium text-slate-500">
            Ajoute un objet pour proposer un troc.
          </p>
          <button
            type="button"
            onClick={() => navigate("/add")}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#087E72] px-5 text-sm font-black text-white"
          >
            <Plus size={16} strokeWidth={2.4} />
            Ajouter un objet
          </button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {myItems.map((item) => (
            <LibraryItemCard
              key={item.id}
              item={item}
              selected={selectedItemIds.includes(item.id)}
              onSelect={toggleItem}
            />
          ))}
        </div>
      )}
      <SelectedSummary selectedItems={selectedItems} />
      <button
        type="button"
        onClick={sendProposal}
        disabled={!canSend}
        className="mt-6 flex h-[58px] w-full items-center justify-center gap-2 rounded-full bg-[#087E72] text-[16px] font-black text-white shadow-[0_20px_44px_rgba(8,126,114,0.30)] transition active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none"
      >
        <Send size={19} strokeWidth={2.5} />
        {sending ? "Envoi en cours\u2026" : "Envoyer ma proposition"}
      </button>
    </section>
  );

  return (
    <>
      {/* ── Mobile ── */}
      <div className="mx-auto w-full max-w-[430px] px-4 pt-[max(14px,env(safe-area-inset-top))] lg:hidden">
        {headerBlock}
        {leftBlock}
        <div className="mt-5">{rightBlock}</div>
        <div className="h-10" />
      </div>

      {/* ── Desktop ── */}
      <div className="hidden lg:block">
        <div className="mx-auto max-w-7xl px-8 pb-12 pt-8">
          {headerBlock}
          <div className="grid grid-cols-2 items-start gap-8 xl:grid-cols-[480px_minmax(0,1fr)]">
            <div>{leftBlock}</div>
            <div className="sticky top-8">{rightBlock}</div>
          </div>
        </div>
      </div>
    </>
  );
}
