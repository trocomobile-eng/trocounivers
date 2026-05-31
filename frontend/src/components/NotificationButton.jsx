import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, MapPin, MessageCircle, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

function clean(v = "") { return String(v || "").trim(); }
function shortName(v = "") {
  const c = clean(v);
  if (!c) return "quelqu'un";
  if (c.includes("@")) return c.split("@")[0];
  const p = c.split(/\s+/);
  return p.length <= 1 ? c : `${p[0]} ${p[1].charAt(0)}.`;
}
function getOtherName(ex, uid) {
  if (!ex || !uid) return "l'autre personne";
  return ex.senderId === uid
    ? ex.receiverName || ex.receiverDisplayName || ex.receiverEmail || "l'autre personne"
    : ex.senderName  || ex.senderDisplayName  || ex.senderEmail  || "l'autre personne";
}
function getExchangeTitle(ex) {
  return ex?.requestedItemTitle || ex?.itemTitle || ex?.offeredItemTitle || "Troc en cours";
}

function getPreciseNotification(ex, uid) {
  const name  = shortName(getOtherName(ex, uid));
  const title = getExchangeTitle(ex);

  if (ex?.availabilityOptions?.length > 0 && ex?.availabilityProposedBy !== uid && !ex?.selectedAvailability)
    return { icon: CalendarDays, title: `${name} propose des horaires`, text: title, to: `/availability/${ex.id}` };

  if (ex?.placeOptions?.length > 0 && ex?.placeProposedBy !== uid && !ex?.selectedPlace)
    return { icon: MapPin, title: `${name} propose un lieu`, text: title, to: "/choose-place", state: { exchangeId: ex.id, exchange: ex } };

  if (ex?.status === "chat_open" || ex?.chatOpened)
    return { icon: MessageCircle, title: "Message à finaliser", text: title, to: `/exchanges/${ex.id}/chat` };

  if (ex?.status === "meeting_confirmed" || ex?.meetingConfirmed)
    return { icon: CheckCircle2, title: "Rencontre confirmée ✓", text: title, to: `/exchanges/${ex.id}` };

  if (ex?.status === "accepted")
    return { icon: CheckCircle2, title: `${name} a accepté ton troc !`, text: title, to: `/exchanges/${ex.id}` };

  if (ex?.status === "pending" && ex?.receiverId === uid)
    return { icon: MessageCircle, title: `${name} te propose un troc`, text: title, to: `/exchanges/${ex.id}` };

  return null;
}

function getNeedsAttention(ex, uid) {
  if (!ex || !uid) return false;
  if (ex?.needsAttentionFor === uid) return true;
  if (Array.isArray(ex?.needsAttentionFor) && ex.needsAttentionFor.includes(uid)) return true;
  if (ex?.availabilityOptions?.length > 0 && ex?.availabilityProposedBy !== uid && !ex?.selectedAvailability) return true;
  if (ex?.placeOptions?.length > 0 && ex?.placeProposedBy !== uid && !ex?.selectedPlace) return true;
  return false;
}

function NotificationRow({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onNavigate}
      className="flex w-full items-start gap-3 rounded-[16px] bg-[#F5F5F3] p-3 text-left transition hover:bg-[#F0FAF7] active:scale-[0.99]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0FAF7] text-[#1ABEA3]">
        <Icon size={17} strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-extrabold leading-tight text-[#0d1b2a]">{item.title}</span>
        <span className="mt-0.5 line-clamp-1 block text-[12px] font-medium text-slate-500">{item.text}</span>
      </span>
    </button>
  );
}

export default function NotificationButton({ className = "" }) {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [open, setOpen]         = useState(false);
  const [exchanges, setExchanges] = useState([]);

  // ── Temps réel avec onSnapshot ──────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) { setExchanges([]); return; }

    const q = query(
      collection(db, "exchanges"),
      where("participants", "array-contains", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      setExchanges(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Erreur notifications :", err);
    });

    return () => unsub();
  }, [user?.uid]);

  const notifications = useMemo(() => {
    return exchanges
      .filter((ex) => getNeedsAttention(ex, user?.uid))
      .map((ex)   => getPreciseNotification(ex, user?.uid))
      .filter(Boolean)
      .slice(0, 6);
  }, [exchanges, user?.uid]);

  const count = notifications.length;

  function goTo(item) {
    setOpen(false);
    item.state ? navigate(item.to, { state: item.state }) : navigate(item.to);
  }

  return (
    <div className={["relative", className].join(" ")}>
      {/* Bouton cloche */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E4ECE8] bg-white text-[#0d1b2a] shadow-[0_2px_8px_rgba(15,23,42,0.07)] transition active:scale-95"
        aria-label="Notifications"
      >
        <Bell size={17} strokeWidth={2.1} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1ABEA3] px-1 text-[10px] font-black text-white shadow-[0_2px_6px_rgba(26,190,163,0.4)]">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Panneau */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-[320px] rounded-[20px] border border-[#E4ECE8] bg-white p-3 shadow-[0_8px_32px_rgba(15,23,42,0.12)]">
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="text-[14px] font-extrabold text-[#0d1b2a]">Notifications</p>
                <p className="text-[11px] font-medium text-slate-400">
                  {count > 0 ? `${count} action${count > 1 ? "s" : ""} en attente` : "Tout est à jour"}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F3] text-slate-500">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-1.5">
              {count === 0 ? (
                <div className="rounded-[14px] bg-[#F0FAF7] p-4 text-[13px] font-medium text-[#0f9f9a]">
                  Aucune action en attente. Tes prochains trocs apparaîtront ici.
                </div>
              ) : (
                notifications.map((item, i) => (
                  <NotificationRow key={i} item={item} onNavigate={() => goTo(item)} />
                ))
              )}
            </div>

            <Link
              to="/exchanges"
              onClick={() => setOpen(false)}
              className="troco-primary-btn mt-3 flex h-10 w-full items-center justify-center rounded-full text-[13px]"
            >
              Voir tous les trocs
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
