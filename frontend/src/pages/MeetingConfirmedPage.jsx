import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowLeftRight,
  ChevronRight,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// ─── helpers ──────────────────────────────────────────────────────────────────

function clean(value = "") {
  return String(value).trim().replace(/\s+/g, " ");
}

function formatPhoneNumber(value = "") {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  let normalized = digits;
  if (normalized.startsWith("33")) normalized = `0${normalized.slice(2)}`;
  if (normalized.length > 10) normalized = normalized.slice(0, 10);
  return normalized.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

function getInitial(name = "") {
  return clean(name).charAt(0).toUpperCase() || "T";
}

function getOtherParticipant(exchange, currentUserId) {
  if (!exchange || !currentUserId) {
    return { name: "Utilisateur Troco", photoURL: "", phone: "", rating: null, exchanges: null, uid: "" };
  }
  const isSender = exchange.senderId === currentUserId;
  return {
    name: clean(isSender
      ? exchange.receiverName || exchange.receiverDisplayName || exchange.receiverEmail || "Utilisateur"
      : exchange.senderName || exchange.senderDisplayName || exchange.senderEmail || "Utilisateur"),
    photoURL: clean(isSender
      ? exchange.receiverPhotoURL || exchange.receiverAvatar || ""
      : exchange.senderPhotoURL || exchange.senderAvatar || ""),
    phone: clean(isSender
      ? exchange.receiverPhone || exchange.receiverPhoneNumber || exchange.phone || ""
      : exchange.senderPhone || exchange.senderPhoneNumber || exchange.phone || ""),
    rating: exchange.otherRating || exchange.rating || null,
    exchanges: exchange.otherExchangeCount || exchange.exchangeCount || null,
    uid: isSender ? (exchange.receiverId || "") : (exchange.senderId || ""),
  };
}

function formatDateTime(selectedAvailability) {
  if (!selectedAvailability) return { day: "", date: "", time: "" };
  if (typeof selectedAvailability === "string") return { day: selectedAvailability, date: "", time: "" };
  return {
    day: selectedAvailability.shortDay || selectedAvailability.dayShort || selectedAvailability.dayName || selectedAvailability.day || selectedAvailability.weekday || "",
    date: selectedAvailability.dateLabel || selectedAvailability.date || selectedAvailability.fullDate || "",
    time: selectedAvailability.time || selectedAvailability.hour || selectedAvailability.label?.match(/\d{1,2}h(?:\d{2})?/)?.[0] || "",
  };
}

function getPlace(exchange) {
  const place = exchange?.selectedPlace || exchange?.place || exchange?.meetingPlace || {};
  return {
    title: place.title || place.name || "",
    address: place.address || place.formattedAddress || "",
    isPartner: place.isPartner !== false && (place.isPartner || place.partner || place.type === "partner"),
  };
}

function getItemData(exchange, role) {
  if (role === "mine") {
    return {
      title: exchange?.proposedItemTitle || exchange?.senderItemTitle || exchange?.myItemTitle || "",
      image: exchange?.proposedItemImage || exchange?.senderItemImage ||
        (exchange?.proposedItemImages?.[0]) || (exchange?.senderItemImages?.[0]) || "",
    };
  }
  return {
    title: exchange?.requestedItemTitle || exchange?.receiverItemTitle || exchange?.itemTitle || "",
    image: exchange?.requestedItemImage || exchange?.receiverItemImage ||
      (exchange?.requestedItemImages?.[0]) || (exchange?.itemImages?.[0]) || "",
  };
}

function openDirections(address) {
  if (!address) return;
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank");
}

// ─── MiniMap SVG ──────────────────────────────────────────────────────────────

function MiniMap({ address }) {
  return (
    <div className="relative h-[140px] overflow-hidden rounded-[16px] bg-[#e8f5ee]">
      <svg viewBox="0 0 700 280" className="h-full w-full opacity-70">
        <rect width="700" height="280" fill="#e8f5ee" />
        <path d="M-20 200 C80 180 140 175 230 190 C330 210 390 180 485 155 C575 130 640 150 730 120" stroke="#c3e8d8" strokeWidth="44" fill="none" />
        <path d="M-20 75 C80 90 150 120 230 140 C340 165 450 140 545 110 C610 95 665 100 730 115" stroke="#ffffff" strokeWidth="26" fill="none" />
        <path d="M75 -10 L160 290" stroke="#ffffff" strokeWidth="20" />
        <path d="M275 -10 L310 290" stroke="#ffffff" strokeWidth="18" />
        <path d="M500 -10 L455 290" stroke="#ffffff" strokeWidth="20" />
        <path d="M0 145 L700 85" stroke="#ffffff" strokeWidth="16" />
        <path d="M0 200 L700 250" stroke="#ffffff" strokeWidth="16" />
      </svg>

      {/* Pin */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#22C58B] shadow-[0_6px_18px_rgba(34,197,139,0.4)] text-white">
          <MapPin size={20} fill="white" strokeWidth={1.5} />
        </div>
        <div className="absolute left-1/2 top-full h-2 w-0.5 -translate-x-1/2 bg-[#22C58B]" />
      </div>

      {address && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#344256] shadow-sm backdrop-blur-sm">
          {address.split(",")[0]}
        </div>
      )}
    </div>
  );
}

// ─── Ticket ───────────────────────────────────────────────────────────────────

function TicketDivider() {
  return (
    <div className="relative flex flex-col items-center py-5">
      {/* Notch top */}
      <div className="h-5 w-5 -translate-y-2.5 rounded-full bg-[var(--troco-bg)]" />
      {/* Dashed line */}
      <div className="flex-1 border-l-2 border-dashed border-[#D8EDE6]" style={{ minHeight: 180 }} />
      {/* Exchange medallion */}
      <div className="absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#22C58B] text-white shadow-[0_4px_14px_rgba(34,197,139,0.35)]">
        <ArrowLeftRight size={16} strokeWidth={2.5} />
      </div>
      {/* Notch bottom */}
      <div className="h-5 w-5 translate-y-2.5 rounded-full bg-[var(--troco-bg)]" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MeetingConfirmedPage() {
  const { exchangeId, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentId = exchangeId || id;

  useEffect(() => {
    async function load() {
      if (!currentId) { setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, "exchanges", currentId));
        setExchange(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch (e) {
        console.error("Erreur chargement rencontre:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentId]);

  const other = useMemo(() => getOtherParticipant(exchange, user?.uid), [exchange, user?.uid]);
  const dt = formatDateTime(exchange?.selectedAvailability);
  const place = getPlace(exchange);
  const phone = formatPhoneNumber(other.phone || exchange?.phone || "");

  const isSender = exchange?.senderId === user?.uid;
  const myItem = getItemData(exchange, "mine");
  const theirItem = getItemData(exchange, "theirs");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[14px] font-bold text-slate-400">Chargement…</p>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[900px] px-6 py-8">

      {/* ── Back ── */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0d1b2a] shadow-[0_2px_10px_rgba(15,23,42,0.08)] transition hover:bg-[#F4F8F6] active:scale-95"
        aria-label="Retour"
      >
        <ArrowLeft size={19} strokeWidth={2.3} />
      </button>

      {/* ── Hero ── */}
      <div className="relative mb-8 text-center">
        {/* Accent lines */}
        <svg className="pointer-events-none absolute -left-4 top-0 h-16 w-16 opacity-40" viewBox="0 0 60 60" fill="none">
          <path d="M10 50 C20 30 40 20 55 10" stroke="#22C58B" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M5 35 C12 28 20 25 30 22" stroke="#1ABEA3" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="pointer-events-none absolute -right-4 top-0 h-16 w-16 opacity-40" viewBox="0 0 60 60" fill="none">
          <path d="M50 50 C40 30 20 20 5 10" stroke="#22C58B" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M55 35 C48 28 40 25 30 22" stroke="#1ABEA3" strokeWidth="2" strokeLinecap="round" />
        </svg>

        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1ABEA3]">
          Détails de la rencontre
        </p>
        <h1 className="troco-soft-title mt-3 text-[38px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#0d1b2a] lg:text-[44px]">
          Tout est prêt pour votre échange !
        </h1>
        <p className="mt-2 text-[14.5px] font-medium text-[#6F7782]">
          Deux objets, une belle rencontre.<br />
          On a hâte que votre échange ait lieu !
        </p>
      </div>

      {/* ── Ticket ── */}
      <div className="relative overflow-hidden rounded-[24px] bg-white shadow-[0_4px_28px_rgba(15,23,42,0.09)]">
        <div className="flex flex-col lg:flex-row">

          {/* ── LEFT — Rencontre ── */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F0FAF7]">
                <MapPin size={13} strokeWidth={2.3} className="text-[#1ABEA3]" />
              </span>
              <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#1ABEA3]">
                Votre rencontre
              </p>
            </div>

            {/* Time */}
            {dt.time && (
              <p className="text-[58px] font-extrabold leading-none tracking-[-0.05em] text-[#0d1b2a] lg:text-[70px]">
                {dt.time.replace("h", ":")}
              </p>
            )}
            {(dt.day || dt.date) && (
              <p className="mt-1 text-[18px] font-bold text-[#344256]">
                {[dt.day, dt.date].filter(Boolean).join(" ")}
              </p>
            )}

            {/* Address */}
            {place.address && (
              <p className="mt-3 flex items-start gap-1.5 text-[13.5px] font-medium text-[#6F7782]">
                <MapPin size={13} strokeWidth={2.2} className="mt-0.5 shrink-0 text-[#22C58B]" />
                {place.address}
              </p>
            )}

            {/* Itinerary CTA */}
            <button
              type="button"
              onClick={() => openDirections(place.address)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#22C58B] px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(34,197,139,0.28)] transition hover:opacity-90 active:scale-95"
            >
              <Navigation size={13} strokeWidth={2.3} />
              Ouvrir l'itinéraire
            </button>

            {/* MiniMap */}
            <div className="mt-5">
              <MiniMap address={place.address} />
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div className="hidden lg:flex">
            <TicketDivider />
          </div>
          <div className="mx-6 h-px bg-dashed-divider border-t-2 border-dashed border-[#D8EDE6] lg:hidden" />

          {/* ── RIGHT — Interlocuteur ── */}
          <div className="flex flex-1 flex-col p-6 lg:p-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F0FAF7]">
                <UserRound size={13} strokeWidth={2.3} className="text-[#1ABEA3]" />
              </span>
              <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#1ABEA3]">
                Votre interlocuteur
              </p>
            </div>

            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              {other.photoURL ? (
                <img
                  src={other.photoURL}
                  alt={other.name}
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-white shadow-md"
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1ABEA3] to-[#36C982] text-[22px] font-black text-white ring-2 ring-white shadow-md">
                  {getInitial(other.name)}
                </span>
              )}
              <div>
                <p className="text-[22px] font-extrabold leading-tight tracking-[-0.03em] text-[#0d1b2a]">
                  {other.name}
                </p>
                {(other.rating !== null || other.exchanges !== null) && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#6F7782]">
                    {other.rating !== null && (
                      <>
                        <Star size={13} strokeWidth={2} className="text-[#22C58B]" fill="#22C58B" />
                        {other.rating}
                      </>
                    )}
                    {other.rating !== null && other.exchanges !== null && (
                      <span className="text-[#DDE8E4]">·</span>
                    )}
                    {other.exchanges !== null && `${other.exchanges} échange${other.exchanges !== 1 ? "s" : ""}`}
                  </p>
                )}
              </div>
            </div>

            {/* Phone */}
            {phone && (
              <div className="mt-5 flex items-center gap-3 rounded-[14px] bg-[#F4FBF8] px-4 py-3">
                <Phone size={16} strokeWidth={2.2} className="shrink-0 text-[#1ABEA3]" />
                <p className="text-[17px] font-bold tracking-[0.03em] text-[#0d1b2a]">{phone}</p>
              </div>
            )}

            {/* CTAs */}
            <div className="mt-4 flex flex-wrap gap-3">
              {phone && (
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#22C58B] px-5 py-3 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(34,197,139,0.25)] transition hover:opacity-90"
                >
                  <Phone size={14} strokeWidth={2.3} />
                  Contacter
                </a>
              )}
              {other.uid && (
                <button
                  type="button"
                  onClick={() => navigate(`/users/${other.uid}`)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#E4ECE8] bg-white px-5 py-3 text-[13px] font-bold text-[#344256] transition hover:border-[#1ABEA3] hover:text-[#1ABEA3]"
                >
                  <UserRound size={14} strokeWidth={2.3} />
                  Voir le profil
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Exchange items ── */}
      {(myItem.title || theirItem.title) && (
        <div className="mt-6 overflow-hidden rounded-[24px] bg-white p-6 shadow-[0_4px_28px_rgba(15,23,42,0.07)] lg:p-8">
          <div className="mb-6 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F0FAF7]">
              <ArrowLeftRight size={13} strokeWidth={2.3} className="text-[#1ABEA3]" />
            </span>
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#1ABEA3]">Votre échange</p>
              <p className="text-[12px] font-medium text-[#6F7782]">Ces deux objets vont bientôt changer de maison !</p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            {/* My item */}
            <ExchangeItemCard title={myItem.title} image={myItem.image} label="Mon objet" />

            {/* Arrow */}
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0FAF7] text-[#22C58B]">
                <ArrowLeftRight size={18} strokeWidth={2.3} />
              </div>
              <svg width="40" height="8" className="opacity-30">
                <path d="M0 4 Q10 0 20 4 Q30 8 40 4" stroke="#22C58B" strokeWidth="1.5" fill="none" />
              </svg>
            </div>

            {/* Their item */}
            <ExchangeItemCard title={theirItem.title} image={theirItem.image} label="Son objet" />
          </div>
        </div>
      )}

      {/* ── Security banner ── */}
      <div className="mt-5 flex items-center gap-3 rounded-[16px] bg-[#F4FBF8] px-5 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F7EF] text-[#22C58B]">
          <ShieldCheck size={18} strokeWidth={2.2} />
        </span>
        <p className="flex-1 text-[12.5px] font-medium leading-relaxed text-[#344256]">
          Troco encourage les rencontres dans des lieux publics partenaires pour des échanges en toute sécurité.
        </p>
        <ChevronRight size={16} strokeWidth={2.2} className="shrink-0 text-[#94a3b8]" />
      </div>

    </main>
  );
}

// ─── ExchangeItemCard ─────────────────────────────────────────────────────────

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23F0F5F3'/%3E%3Cpath d='M160 155h80a10 10 0 0 1 10 10v70a10 10 0 0 1-10 10h-80a10 10 0 0 1-10-10v-70a10 10 0 0 1 10-10Zm55 15-20 25-13-16-22 30h70Zm-28-8a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z' fill='%23C8D8D2'/%3E%3C/svg%3E";

function ExchangeItemCard({ title, image, label }) {
  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <div className="aspect-square w-full max-w-[200px] overflow-hidden rounded-[18px] bg-[#F2F4F3] shadow-[0_4px_18px_rgba(15,23,42,0.10)]">
        <img
          src={image || PLACEHOLDER}
          alt={title || "Objet"}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      {title && (
        <p className="mt-3 text-[14px] font-bold leading-snug text-[#0d1b2a]">{title}</p>
      )}
      <p className="mt-0.5 text-[11.5px] font-medium text-[#94a3b8]">{label}</p>
    </div>
  );
}
