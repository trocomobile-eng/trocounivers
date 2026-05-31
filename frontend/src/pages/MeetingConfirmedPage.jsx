import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  MoreHorizontal,
  Navigation,
  Phone,
  ShieldCheck,
  Star,
  UsersRound,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { TrocoButton, TrocoCard, TrocoPill } from "../components/ui";

function clean(value = "") {
  return String(value).trim().replace(/\s+/g, " ");
}

function formatPhoneNumber(value = "") {
  const digits = String(value).replace(/\D/g, "");

  if (!digits) return "";

  let normalized = digits;

  if (normalized.startsWith("33")) {
    normalized = `0${normalized.slice(2)}`;
  }

  if (normalized.length > 10) {
    normalized = normalized.slice(0, 10);
  }

  return normalized.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

function getOtherParticipant(exchange, currentUserId) {
  if (!exchange || !currentUserId) {
    return {
      name: "Utilisateur Troco",
      photoURL: "",
      phone: "",
      rating: "4,8",
      exchanges: 23,
    };
  }

  const currentUserIsSender = exchange.senderId === currentUserId;

  return {
    name: clean(
      currentUserIsSender
        ? exchange.receiverName ||
            exchange.receiverDisplayName ||
            exchange.receiverEmail ||
            "Utilisateur Troco"
        : exchange.senderName ||
            exchange.senderDisplayName ||
            exchange.senderEmail ||
            "Utilisateur Troco"
    ),
    photoURL: clean(
      currentUserIsSender
        ? exchange.receiverPhotoURL || exchange.receiverAvatar || ""
        : exchange.senderPhotoURL || exchange.senderAvatar || ""
    ),
    phone: clean(
      currentUserIsSender
        ? exchange.receiverPhone || exchange.receiverPhoneNumber || exchange.phone || ""
        : exchange.senderPhone || exchange.senderPhoneNumber || exchange.phone || ""
    ),
    rating: exchange.otherRating || exchange.rating || "4,8",
    exchanges: exchange.otherExchangeCount || exchange.exchangeCount || 23,
  };
}

function getInitial(name = "") {
  return clean(name).charAt(0).toUpperCase() || "T";
}

function formatDayAndMonth(selectedAvailability) {
  if (!selectedAvailability) return { day: "Mardi", date: "17 juin", time: "16h00" };

  if (typeof selectedAvailability === "string") {
    return {
      day: selectedAvailability,
      date: "",
      time: "",
    };
  }

  return {
    day:
      selectedAvailability.shortDay ||
      selectedAvailability.dayShort ||
      selectedAvailability.dayName ||
      selectedAvailability.day ||
      selectedAvailability.weekday ||
      "Mardi",
    date:
      selectedAvailability.dateLabel ||
      selectedAvailability.date ||
      selectedAvailability.fullDate ||
      "17 juin",
    time:
      selectedAvailability.time ||
      selectedAvailability.hour ||
      selectedAvailability.label?.match(/\d{1,2}h(?:\d{2})?/)?.[0] ||
      "16h00",
  };
}

function getPlace(exchange) {
  const place = exchange?.selectedPlace || exchange?.place || exchange?.meetingPlace || {};

  return {
    title: place.title || place.name || "Châtelet",
    address: place.address || place.formattedAddress || "Place du Châtelet, Paris",
    isPartner:
      place.isPartner !== false &&
      (place.isPartner || place.partner || place.type === "partner" || true),
  };
}

function openDirections(address) {
  const query = encodeURIComponent(address);
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
}

function InfoStat({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex min-w-[112px] shrink-0 flex-col items-center justify-center rounded-[24px] border border-slate-100 bg-white/74 px-3 py-3 text-center shadow-[0_8px_22px_rgba(15,23,42,0.035)] backdrop-blur-xl">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Icon size={20} strokeWidth={2.2} />
      </span>

      <p className="mt-2 max-w-full truncate text-[15px] font-black leading-tight text-[#081225]">
        {title}
      </p>

      {subtitle && (
        <p className="mt-0.5 max-w-full truncate text-[12px] font-bold leading-tight text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function MiniMap() {
  return (
    <div className="relative mt-5 h-[170px] overflow-hidden rounded-[24px] border border-slate-100 bg-[#f3f7f3]">
      <div className="absolute inset-0 opacity-80">
        <svg viewBox="0 0 700 320" className="h-full w-full">
          <rect width="700" height="320" fill="#f3f7f3" />
          <path d="M-20 250 C80 230 140 225 230 240 C330 260 390 230 485 205 C575 180 640 200 730 170" stroke="#d9e8df" strokeWidth="38" fill="none" />
          <path d="M-20 95 C80 110 150 150 230 170 C340 200 450 175 545 145 C610 125 665 130 730 150" stroke="#ffffff" strokeWidth="22" fill="none" />
          <path d="M75 -20 L160 340" stroke="#ffffff" strokeWidth="18" />
          <path d="M275 -20 L310 340" stroke="#ffffff" strokeWidth="16" />
          <path d="M500 -20 L455 340" stroke="#ffffff" strokeWidth="18" />
          <path d="M0 170 L700 110" stroke="#ffffff" strokeWidth="14" />
          <path d="M0 225 L700 285" stroke="#ffffff" strokeWidth="14" />
          <path d="M-10 40 L710 20" stroke="#ffffff" strokeWidth="12" />
        </svg>
      </div>

      <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_10px_26px_rgba(5,150,105,0.28)]">
        <MapPin size={30} fill="currentColor" strokeWidth={2.2} />
      </div>
    </div>
  );
}

export default function MeetingConfirmedPage() {
  const { exchangeId, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentId = exchangeId || id;

  useEffect(() => {
    async function loadExchange() {
      if (!currentId) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "exchanges", currentId));
        setExchange(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
      } catch (error) {
        console.error("Erreur chargement rencontre :", error);
        setExchange(null);
      } finally {
        setLoading(false);
      }
    }

    loadExchange();
  }, [currentId]);

  const other = useMemo(
    () => getOtherParticipant(exchange, user?.uid),
    [exchange, user?.uid]
  );

  const availability = formatDayAndMonth(exchange?.selectedAvailability);
  const place = getPlace(exchange);
  const phone = formatPhoneNumber(other.phone || exchange?.phone || "0612525548");

  if (loading) {
    return (
      <div className="troco-page-narrow">
        <TrocoCard className="p-6 text-center text-sm font-bold text-slate-500">
          Chargement de la rencontre...
        </TrocoCard>
      </div>
    );
  }

  return (
    <main className="troco-page-narrow">
        <header className="mb-6 flex h-12 items-center justify-between">
          <TrocoButton variant="plain"
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/86 text-[#081225] shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
            aria-label="Retour"
          >
            <ArrowLeft size={22} strokeWidth={2.4} />
          </TrocoButton>

          <h1 className="text-[19px] font-black tracking-[-0.02em]">
            Détails de la rencontre
          </h1>

          <TrocoButton variant="plain"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/86 text-[#081225] shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
            aria-label="Plus"
          >
            <MoreHorizontal size={23} strokeWidth={2.4} />
          </TrocoButton>
        </header>

        <section className="mb-7 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Check size={38} strokeWidth={2.5} />
          </div>

          <h2 className="mt-5 text-[31px] font-black leading-[1.03] tracking-[-0.055em] text-[#081225]">
            Votre rencontre est confirmée !
          </h2>

          <p className="mx-auto mt-3 max-w-[330px] text-[17px] font-medium leading-relaxed text-slate-500">
            Nous vous souhaitons un excellent moment.
          </p>
        </section>

        <div className="mb-4 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <InfoStat icon={CalendarDays} title={availability.day} subtitle={availability.date} />
          <InfoStat icon={Clock3} title={availability.time} subtitle="Heure" />
          <InfoStat icon={UsersRound} title="Rencontre" subtitle="confirmée" />
        </div>

        <TrocoCard className="overflow-hidden rounded-[32px] bg-white/94 p-0">
          <div className="p-5">
            <TrocoButton variant="plain"
              onClick={() => openDirections(place.address)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <MapPin size={25} strokeWidth={2.25} />
                </span>

                <div className="min-w-0">
                  <p className="truncate text-[22px] font-black tracking-[-0.035em] text-[#081225]">
                    {place.title}
                  </p>

                  <p className="mt-1 text-[15px] font-semibold leading-relaxed text-slate-500">
                    {place.address}
                  </p>

                  {place.isPartner && (
                    <TrocoPill as="span" active className="mt-2 inline-flex bg-emerald-50 text-emerald-700 shadow-none">
                      ☕ Partenaire Troco
                    </TrocoPill>
                  )}
                </div>
              </div>

              <ChevronRight size={21} className="shrink-0 text-slate-400" />
            </TrocoButton>

            <MiniMap />

            <div className="mt-5 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  {other.photoURL ? (
                    <img
                      src={other.photoURL}
                      alt={other.name}
                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1ABEA3] to-[#36C982] text-xl font-black text-white">
                      {getInitial(other.name)}
                    </span>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-[22px] font-black tracking-[-0.035em] text-[#081225]">
                      {other.name}
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-[15px] font-semibold text-slate-500">
                      <Star size={16} className="text-emerald-600" strokeWidth={2.3} />
                      {other.rating} ({other.exchanges} échanges)
                    </p>
                  </div>
                </div>

                <TrocoButton
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/profile")}
                  className="shrink-0 rounded-full border-emerald-100 text-emerald-700"
                >
                  Voir le profil
                </TrocoButton>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <Phone size={24} strokeWidth={2.25} />
                  </span>

                  <p className="truncate text-[22px] font-black tracking-[-0.03em] text-[#081225]">
                    {phone || "Numéro non renseigné"}
                  </p>
                </div>

                {phone && (
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="shrink-0 rounded-full border border-emerald-100 bg-white px-4 py-2 text-[14px] font-black text-emerald-700"
                  >
                    Contacter
                  </a>
                )}
              </div>
            </div>
          </div>
        </TrocoCard>

        <TrocoCard variant="ghost" className="mt-5 flex items-start gap-4 rounded-[28px] border-emerald-50 bg-emerald-50/45 p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/70 text-emerald-700">
            <ShieldCheck size={24} strokeWidth={2.3} />
          </span>

          <p className="text-[14px] font-semibold leading-relaxed text-slate-600">
            Troco encourage les rencontres dans des lieux publics partenaires pour des échanges en toute sécurité.
          </p>
        </TrocoCard>

        <TrocoButton
          onClick={() => openDirections(place.address)}
          className="mt-6 flex h-[54px] w-full items-center justify-center gap-3 rounded-full bg-emerald-600 text-[17px]"
        >
          <Navigation size={20} fill="currentColor" strokeWidth={2.2} />
          Ouvrir l’itinéraire
        </TrocoButton>
    </main>
  );
}
