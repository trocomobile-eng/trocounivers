import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

import TrocoPageHeader from "../components/TrocoPageHeader";

const PLACE_OPTIONS = [
  {
    id: "montmartre",
    title: "Montmartre",
    description: "Un lieu vivant, public et facile à identifier.",
    emoji: "🎨",
  },
  {
    id: "chatelet",
    title: "Châtelet",
    description: "Central, pratique et bien desservi.",
    emoji: "🚇",
  },
];

function formatMessageTime(value) {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function canUseChat(exchange) {
  return (
    exchange?.status === "chat_open" ||
    exchange?.status === "meeting_confirmed" ||
    exchange?.meetingConfirmed ||
    exchange?.chatOpened ||
    exchange?.chatOpen
  );
}

function getOtherUserId(exchange, uid) {
  if (!exchange || !uid) return "";
  return exchange.senderId === uid ? exchange.receiverId : exchange.senderId;
}

function getMyName(user) {
  return user?.displayName || user?.email?.split("@")[0] || "Moi";
}

function PlaceButton({ place, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[24px] border border-[#E4ECE8] bg-white/92 p-4 text-left shadow-[0_8px_28px_rgba(15,23,42,0.055)] transition active:scale-[0.985]"
    >
      <p className="text-[15px] font-black text-slate-950">
        {place.emoji} Valider {place.title}
      </p>
      <p className="mt-1 text-[12px] font-medium text-slate-500">
        {place.description}
      </p>
    </button>
  );
}

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [exchange, setExchange] = useState(null);
  const [subMessages, setSubMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      navigate("/login", { replace: true });
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "exchanges", id), (snap) => {
      if (!snap.exists()) {
        setExchange(null);
        return;
      }

      setExchange({ id: snap.id, ...snap.data() });
    });

    return () => unsubscribe();
  }, [id, user?.uid, authLoading, navigate]);

  // Listener sous-collection messages (nouveaux messages)
  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, "exchanges", id, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSubMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [id]);

  // Fusionner legacy chatMessages + sous-collection, trier par date
  const messages = useMemo(() => {
    const legacy = (exchange?.chatMessages || []).map((msg) => ({
      ...msg,
      _source: "legacy",
    }));

    const sub = subMessages.map((msg) => ({ ...msg, _source: "sub" }));

    const all = [...legacy, ...sub].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateA - dateB;
    });

    // Dédupliquer par id
    const seen = new Set();
    return all.filter((msg) => {
      if (!msg.id) return true;
      if (seen.has(msg.id)) return false;
      seen.add(msg.id);
      return true;
    });
  }, [exchange, subMessages]);

  // Scroll auto vers le bas
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function confirmPlaceFromChat(place) {
    if (!exchange?.id || !user?.uid) return;

    const otherUserId = getOtherUserId(exchange, user.uid);

    try {
      await updateDoc(doc(db, "exchanges", exchange.id), {
        status: "meeting_confirmed",
        selectedPlace: place,
        placeSelectedBy: user.uid,
        placeSelectedByName: getMyName(user),
        meetingConfirmed: true,
        confirmedAt: serverTimestamp(),
        chatOpened: true,
        chatOpen: true,
        needsAttentionFor: otherUserId,
        lastActionBy: user.uid,
        notificationType: "meeting_confirmed",
        updatedAt: serverTimestamp(),
      });

      navigate(`/availability/${exchange.id}`, { replace: true });
    } catch (error) {
      console.error("Erreur confirmation lieu chat :", error);
      alert("Impossible de confirmer le lieu.");
    }
  }

  const send = async () => {
    const clean = message.trim();
    if (!clean || !user?.uid || sending || !canUseChat(exchange)) return;

    setSending(true);

    try {
      const otherUserId = getOtherUserId(exchange, user.uid);

      // Écrire dans la sous-collection
      await addDoc(collection(db, "exchanges", id, "messages"), {
        text: clean,
        senderId: user.uid,
        senderName: getMyName(user),
        createdAt: serverTimestamp(),
      });

      // Mettre à jour les métadonnées du document exchange
      await updateDoc(doc(db, "exchanges", id), {
        chatOpened: true,
        chatOpen: true,
        lastChatMessage: clean,
        lastActionBy: user.uid,
        needsAttentionFor: otherUserId || "",
        notificationType: "chat_message",
        updatedAt: serverTimestamp(),
      });

      setMessage("");
    } catch (error) {
      console.error("Erreur message :", error);
      alert("Impossible d’envoyer le message.");
    } finally {
      setSending(false);
    }
  };

  if (authLoading || !exchange) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm font-medium text-slate-400">Chargement...</p>
      </div>
    );
  }

  if (!canUseChat(exchange)) {
    return (
      <>
        <TrocoPageHeader
          title="Messagerie"
          subtitle="La discussion libre n’est pas encore disponible."
          showBack
        />

        <div className="px-5 pb-36">
          <div className="rounded-[20px] bg-white p-6 text-center shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
            <div className="mb-3 text-4xl">🧭</div>

            <p className="text-lg font-black text-slate-950">
              Troco guide encore l’échange
            </p>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              La messagerie s’ouvre seulement en dernier recours ou après confirmation de la rencontre.
            </p>

            <button
              type="button"
              onClick={() => navigate(`/availability/${exchange.id}`)}
              className="btn-primary mt-5 w-full"
            >
              Continuer le parcours guidé
            </button>
          </div>
        </div>

      </>
    );
  }

  return (
    <>
      <TrocoPageHeader
        title="Messagerie"
        subtitle="Une courte discussion pour finaliser les derniers détails."
        showBack
      />

      <div className="space-y-4 px-5 pb-36">
        <div className="rounded-[26px] border border-amber-100 bg-amber-50/70 p-4 shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
          <p className="text-[13px] font-black text-amber-800">
            Messagerie limitée
          </p>

          <p className="mt-1 text-sm text-amber-700">
            Troco privilégie le parcours guidé. Tu peux aussi confirmer un lieu directement.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {PLACE_OPTIONS.map((place) => (
            <PlaceButton
              key={place.id}
              place={place}
              onClick={() => confirmPlaceFromChat(place)}
            />
          ))}
        </div>

        {messages.length === 0 ? (
          <div className="rounded-[20px] bg-white p-6 text-center shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
            <div className="mb-3 text-4xl">💬</div>

            <p className="font-black text-slate-950">
              Aucun message pour l’instant
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Écris un message court pour convenir d’un détail pratique.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((currentMessage) => {
              const mine = currentMessage.senderId === user.uid;

              return (
                <div key={currentMessage.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] rounded-[24px] px-4 py-3 ${
                      mine
                        ? "bg-[#1ABEA3] text-white"
                        : "border border-white/80 bg-white text-slate-800"
                    } shadow-[0_8px_28px_rgba(15,23,42,0.055)]`}
                  >
                    <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">
                      {currentMessage.text}
                    </p>

                    <p className={`mt-1 text-[10px] font-semibold ${mine ? "text-white/70" : "text-slate-500"}`}>
                      {formatMessageTime(currentMessage.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div ref={bottomRef} />

        <div className="fixed inset-x-0 bottom-6 z-40 px-4 lg:pl-[264px]">
          <div className="mx-auto flex max-w-[620px] gap-2 rounded-[28px] border border-[#E4ECE8] bg-white p-2 shadow-[0_4px_20px_rgba(15,23,42,0.10)]">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={1}
              placeholder="Écrire un message court..."
              className="min-h-[46px] flex-1 resize-none rounded-[22px] bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-500"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
            />

            <button
              type="button"
              onClick={send}
              disabled={!message.trim() || sending}
              className="h-[46px] rounded-[22px] bg-gradient-to-r from-[#1ABEA3] to-[#36C982] px-5 text-sm font-black text-white transition active:scale-95 disabled:opacity-40"
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>

    </>
  );
}
