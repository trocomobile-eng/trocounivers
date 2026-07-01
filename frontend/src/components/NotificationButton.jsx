import { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, CalendarDays, CheckCircle2, MapPin, MessageCircle, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { usePushNotifications } from "../hooks/usePushNotifications";

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

  if (ex?.status === "chat_open" || ex?.chatOpened || ex?.chatOpen)
    return { icon: MessageCircle, title: "Message à finaliser", text: title, to: `/exchanges/${ex.id}/chat` };

  if (ex?.status === "meeting_confirmed" || ex?.meetingConfirmed || (ex?.selectedAvailability && ex?.selectedPlace))
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
      className="relative flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition hover:bg-[#F6F9F8] active:scale-[0.99]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F0FAF7] text-[#22C58B]">
        <Icon size={15} strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-bold leading-tight text-[#17212B]">{item.title}</span>
        <span className="mt-0.5 block truncate text-[11.5px] font-medium text-[#6F7782]">{item.text}</span>
      </span>
    </button>
  );
}

export default function NotificationButton({ className = "" }) {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { pushStatus, enablePushNotifications } = usePushNotifications(user?.uid);

  const [open, setOpen]         = useState(false);
  const [exchanges, setExchanges] = useState([]);
  const [enabling, setEnabling] = useState(false);

  async function handleEnablePush() {
    setEnabling(true);
    await enablePushNotifications();
    setEnabling(false);
  }

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

      {/* Panneau — popover unifié mobile + desktop */}
      {open && (
        <>
          {/* Overlay transparent pour fermer au clic extérieur */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Popover — positionné par rapport à la cloche */}
          <div
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[320px] max-w-[calc(100vw-24px)] rounded-[22px] border border-[#E7ECEB] bg-white shadow-[0_12px_48px_rgba(15,23,42,0.14)]"
            style={{ animation: "notifSlideDown 0.20s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <style>{`
              @keyframes notifSlideDown {
                from { opacity: 0; transform: translateY(-6px) scale(0.98); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F0F3F2] px-4 py-3.5">
              <div>
                <p className="text-[13.5px] font-black text-[#17212B]">Notifications</p>
                <p className="text-[11px] font-medium text-[#6F7782]">
                  {count > 0 ? `${count} action${count > 1 ? "s" : ""} en attente` : "Tout est à jour"}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F6F9F8] text-[#6F7782] transition hover:bg-[#E7ECEB]">
                <X size={13} />
              </button>
            </div>

            {/* Push notif banner */}
            {pushStatus !== "granted" && pushStatus !== "unsupported" && (
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={enabling || pushStatus === "denied"}
                className="flex w-full items-center gap-3 border-b border-[#F0F3F2] px-4 py-3 text-left transition hover:bg-[#F6F9F8] active:scale-[0.99] disabled:opacity-50"
              >
                <BellOff size={14} strokeWidth={2.3} className="shrink-0 text-[#22C58B]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-[#17212B]">
                    {pushStatus === "denied" ? "Notifications bloquées" : enabling ? "Activation…" : "Activer les notifications"}
                  </p>
                  <p className="text-[10.5px] font-medium text-[#6F7782]">
                    {pushStatus === "denied" ? "Autorise dans les réglages" : "Alertes en temps réel"}
                  </p>
                </div>
              </button>
            )}

            {/* Rows */}
            <div className="py-1.5">
              {count === 0 ? (
                <div className="px-4 py-4 text-[12.5px] font-medium text-[#6F7782]">
                  Aucune action en attente. Tes prochains trocs apparaîtront ici.
                </div>
              ) : (
                notifications.map((item, i) => (
                  <NotificationRow key={i} item={item} onNavigate={() => goTo(item)} />
                ))
              )}
            </div>

            {/* Footer CTA */}
            <div className="border-t border-[#F0F3F2] p-3">
              <Link
                to="/exchanges"
                onClick={() => setOpen(false)}
                className="flex h-10 w-full items-center justify-center rounded-[14px] bg-[#22C58B] text-[13px] font-black text-white shadow-[0_4px_12px_rgba(34,197,139,0.22)] transition active:scale-[0.97]"
              >
                Voir tous les trocs
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
