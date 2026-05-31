import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ArrowLeft, CalendarDays, Clock3, Loader2, MessageCircle, Plus, Trash2 } from "lucide-react";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { TrocoCard, TrocoButton } from "../components/ui";

const DAY_LABELS  = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
const TIME_OPTIONS = ["10h","12h","14h","16h","18h30","19h","20h"];

function buildNextSevenDays() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const value = date.toISOString().slice(0, 10);
    const label = `${DAY_LABELS[date.getDay()]} ${date.getDate()}`;
    return { value, label, day: DAY_LABELS[date.getDay()], date: date.getDate() };
  });
}

function getDayLabel(value, days) {
  return days.find((d) => d.value === value)?.label || value || "";
}

function uniqueSlots(slots) {
  const seen = new Set();
  return slots.filter((s) => {
    const key = `${s.dateValue}-${s.time}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatSlot(slot) {
  if (!slot) return "";
  if (typeof slot === "string") return slot;
  return slot.label || [slot.dayLabel || slot.day, slot.time].filter(Boolean).join(" · ");
}

function getOtherName(exchange, userId) {
  if (!exchange || !userId) return "L'autre personne";
  if (exchange.senderId === userId)
    return exchange.receiverName || exchange.receiverDisplayName || exchange.receiverEmail || "L'autre personne";
  return exchange.senderName || exchange.senderDisplayName || exchange.senderEmail || "L'autre personne";
}

function shortName(v = "") {
  const c = String(v).trim();
  if (!c) return "L'autre personne";
  if (c.includes("@")) return c.split("@")[0];
  const parts = c.split(/\s+/);
  return parts.length <= 1 ? c : `${parts[0]} ${parts[1].charAt(0)}.`;
}

function getAvailabilityCounterCount(exchange) {
  return Number(exchange?.availabilityCounterCount || exchange?.availabilityRoundCount || 0);
}

function getOtherUserId(exchange, userId) {
  if (!exchange || !userId) return "";
  return exchange.senderId === userId ? exchange.receiverId : exchange.senderId;
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function SlotRow({ slot, onRemove }) {
  return (
    <div className="flex items-center justify-between rounded-[14px] border border-[#E4ECE8] bg-white px-4 py-3 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
      <span className="flex items-center gap-2.5 text-[14px] font-bold text-[#102033]">
        <Clock3 size={15} strokeWidth={2.2} className="text-[#1ABEA3]" />
        {formatSlot(slot)}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(slot.id)}
          className="text-slate-300 transition hover:text-rose-400"
          aria-label="Supprimer ce créneau"
        >
          <Trash2 size={15} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

function SlotButton({ slot, onAccept, saving }) {
  return (
    <button
      type="button"
      onClick={() => onAccept(slot)}
      disabled={saving}
      className="flex w-full items-center justify-between rounded-[14px] border border-[#1ABEA3]/30 bg-[#E8F7EF] px-4 py-3.5 text-left transition active:scale-[0.98] disabled:opacity-50"
    >
      <span className="flex items-center gap-2.5 text-[14px] font-bold text-[#102033]">
        <CalendarDays size={15} strokeWidth={2.2} className="text-[#1ABEA3]" />
        {formatSlot(slot)}
      </span>
      <span className="rounded-full bg-[#1ABEA3]/15 px-2.5 py-1 text-[11px] font-bold text-[#0f9f9a]">
        Accepter
      </span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AvailabilityPage() {
  const { id, exchangeId } = useParams();
  const currentExchangeId  = id || exchangeId;
  const navigate           = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const days = useMemo(() => buildNextSevenDays(), []);

  const [exchange, setExchange]               = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [selectedDay, setSelectedDay]         = useState(days[0]?.value || "");
  const [selectedTime, setSelectedTime]       = useState("");
  const [selectedSlots, setSelectedSlots]     = useState([]);
  const [showCounterForm, setShowCounterForm] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) { navigate("/login", { replace: true }); return; }
    async function loadExchange() {
      if (!currentExchangeId) { setLoading(false); return; }
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "exchanges", currentExchangeId));
        setExchange(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch (err) {
        console.error("Erreur chargement disponibilités :", err);
        setExchange(null);
      } finally {
        setLoading(false);
      }
    }
    loadExchange();
  }, [authLoading, currentExchangeId, navigate, user?.uid]);

  const availabilityOptions      = Array.isArray(exchange?.availabilityOptions) ? exchange.availabilityOptions : [];
  const isAvailabilityProposer   = availabilityOptions.length > 0 && exchange?.availabilityProposedBy === user?.uid && !exchange?.selectedAvailability;
  const userMustRespond          = availabilityOptions.length > 0 && exchange?.availabilityProposedBy !== user?.uid && !exchange?.selectedAvailability;
  const availabilityCounterCount = getAvailabilityCounterCount(exchange);
  const canStillCounter          = availabilityCounterCount < 2;
  const canPropose               = !exchange?.selectedAvailability && (!availabilityOptions.length || (userMustRespond && canStillCounter)) && ["accepted","scheduling_time","time_confirmed","choosing_place"].includes(exchange?.status || "accepted");

  function addSlot() {
    if (!selectedDay || !selectedTime) return;
    const dayLabel = getDayLabel(selectedDay, days);
    const slot = { id: `${selectedDay}-${selectedTime}`, dateValue: selectedDay, day: dayLabel, dayLabel, time: selectedTime, label: `${dayLabel} · ${selectedTime}`, proposedBy: user.uid };
    setSelectedSlots((cur) => uniqueSlots([...cur, slot]).slice(0, 3));
    setSelectedTime("");
  }

  function removeSlot(slotId) {
    setSelectedSlots((cur) => cur.filter((s) => s.id !== slotId));
  }

  async function submitAvailability() {
    if (!exchange?.id || !selectedSlots.length) { alert("Ajoute au moins un créneau."); return; }
    setSaving(true);
    try {
      const prevCount = getAvailabilityCounterCount(exchange);
      const isCounter = availabilityOptions.length > 0;
      const nextCount = isCounter ? prevCount + 1 : prevCount;
      const otherId   = getOtherUserId(exchange, user.uid);
      if (isCounter && nextCount > 2) {
        await updateDoc(doc(db, "exchanges", exchange.id), { status: "chat_open", chatOpened: true, chatOpenReason: "availability_negotiation_limit", needsAttentionFor: otherId, lastActionBy: user.uid, notificationType: "chat_open", updatedAt: serverTimestamp() });
        navigate(`/exchanges/${exchange.id}/chat`, { replace: true });
        return;
      }
      await updateDoc(doc(db, "exchanges", exchange.id), { status: "scheduling_time", availabilityOptions: selectedSlots, availabilityProposedBy: user.uid, availabilityProposedByName: user.displayName || user.email || "Utilisateur Troco", availabilityCounterCount: nextCount, availabilityLastCounterAt: serverTimestamp(), needsAttentionFor: otherId, lastActionBy: user.uid, notificationType: isCounter ? "availability_counter_proposed" : "availability_proposed", updatedAt: serverTimestamp() });
      navigate(`/exchanges/${exchange.id}`, { replace: true });
    } catch (err) {
      console.error("Erreur disponibilités :", err);
      alert("Impossible d'envoyer les disponibilités.");
    } finally {
      setSaving(false);
    }
  }

  async function openChatAfterLimit() {
    if (!exchange?.id) return;
    const otherId = getOtherUserId(exchange, user.uid);
    setSaving(true);
    try {
      await updateDoc(doc(db, "exchanges", exchange.id), { status: "chat_open", chatOpened: true, chatOpenReason: "availability_negotiation_limit", needsAttentionFor: otherId, lastActionBy: user.uid, notificationType: "chat_open", updatedAt: serverTimestamp() });
      navigate(`/exchanges/${exchange.id}/chat`, { replace: true });
    } catch (err) {
      alert("Impossible d'ouvrir la messagerie.");
    } finally {
      setSaving(false);
    }
  }

  async function acceptSlot(slot) {
    if (!exchange?.id || !slot) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "exchanges", exchange.id), { status: "choosing_place", selectedAvailability: slot, selectedAvailabilityAt: serverTimestamp(), selectedAvailabilityBy: user.uid, needsAttentionFor: "", lastActionBy: user.uid, notificationType: "availability_confirmed", updatedAt: serverTimestamp() });
      navigate("/choose-place", { replace: true, state: { exchangeId: exchange.id, exchange: { ...exchange, selectedAvailability: slot, status: "choosing_place" } } });
    } catch (err) {
      alert("Impossible de valider ce créneau.");
    } finally {
      setSaving(false);
    }
  }

  const SlotForm = ({ title, onSubmitLabel }) => (
    <div className="mt-4 rounded-[20px] border border-[#E4ECE8] bg-[#FAFAF7] p-4">
      <p className="troco-caption mb-3">{title}</p>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <p className="mb-1.5 text-[11px] font-bold text-slate-500">Jour</p>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="h-11 w-full rounded-[12px] border border-[#E4ECE8] bg-white px-3 text-[13px] font-bold text-[#102033] outline-none"
          >
            {days.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-bold text-slate-500">Heure</p>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="h-11 w-full rounded-[12px] border border-[#E4ECE8] bg-white px-3 text-[13px] font-bold text-[#102033] outline-none"
          >
            <option value="">Choisir</option>
            {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={addSlot}
        disabled={!selectedDay || !selectedTime || selectedSlots.length >= 3}
        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-[12px] border border-[#1ABEA3]/30 bg-[#E8F7EF] text-[13px] font-bold text-[#0f9f9a] transition disabled:opacity-40"
      >
        <Plus size={14} strokeWidth={2.5} />
        Ajouter ce créneau
      </button>

      {selectedSlots.length > 0 && (
        <div className="mt-3 space-y-2">
          {selectedSlots.map((slot) => <SlotRow key={slot.id} slot={slot} onRemove={removeSlot} />)}
        </div>
      )}

      <button
        type="button"
        onClick={submitAvailability}
        disabled={saving || selectedSlots.length === 0}
        className="troco-primary-btn mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full disabled:opacity-40"
      >
        {saving ? <><Loader2 size={16} className="animate-spin" /> Envoi…</> : onSubmitLabel}
      </button>
    </div>
  );

  // ── États de chargement ────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div className="troco-page-narrow text-center text-sm font-bold text-slate-500">
        Chargement…
      </div>
    );
  }

  if (!exchange) {
    return (
      <div className="troco-page-narrow">
        <button type="button" onClick={() => navigate(-1)} className="mb-6 flex h-11 w-11 items-center justify-center rounded-full border border-[#E4ECE8] bg-white shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
          <ArrowLeft size={19} strokeWidth={2.3} className="text-[#102033]" />
        </button>
        <TrocoCard className="p-6 text-center">
          <p className="font-extrabold text-[#102033]">Échange introuvable.</p>
          <button type="button" onClick={() => navigate("/exchanges")} className="troco-primary-btn mt-4">
            Retour aux trocs
          </button>
        </TrocoCard>
      </div>
    );
  }

  const other = shortName(getOtherName(exchange, user.uid));

  const mainContent = (
    <div className="space-y-4">
      {/* Contexte */}
      <TrocoCard className="p-4">
        <p className="text-[13px] font-medium leading-relaxed text-slate-500">
          Troco garde une logique d'aller-retour : chacun peut accepter ou proposer une alternative, avec{" "}
          <span className="font-bold text-[#102033]">deux tours maximum</span>.
        </p>
      </TrocoCard>

      {/* Proposer a déjà envoyé — en attente */}
      {isAvailabilityProposer && (
        <TrocoCard className="p-5">
          <p className="troco-caption mb-1" style={{ color: "#6b9fcf" }}>Disponibilités envoyées</p>
          <h2 className="text-[18px] font-extrabold tracking-[-0.03em] text-[#102033]">En attente de réponse</h2>
          <p className="mt-1 text-[13px] font-medium text-slate-500">
            {other} doit choisir un créneau ou proposer une alternative.
          </p>
          <div className="mt-4 space-y-2">
            {availabilityOptions.map((slot, i) => <SlotRow key={slot.id || i} slot={slot} />)}
          </div>
        </TrocoCard>
      )}

      {/* L'autre a proposé — doit répondre */}
      {userMustRespond && (
        <TrocoCard className="p-5">
          <p className="troco-caption mb-1">Disponibilités reçues</p>
          <h2 className="text-[18px] font-extrabold tracking-[-0.03em] text-[#102033]">Un créneau te convient ?</h2>
          <p className="mt-1 text-[13px] font-medium text-slate-500">
            Tu peux accepter un horaire ou proposer une alternative.
          </p>
          <div className="mt-4 space-y-2">
            {availabilityOptions.map((slot, i) => (
              <SlotButton key={slot.id || i} slot={slot} onAccept={acceptSlot} saving={saving} />
            ))}
          </div>
          {canStillCounter ? (
            !showCounterForm ? (
              <button
                type="button"
                onClick={() => setShowCounterForm(true)}
                className="troco-secondary-btn mt-3 w-full rounded-full"
              >
                Ces horaires ne me conviennent pas
              </button>
            ) : (
              <SlotForm title="Proposer d'autres créneaux" onSubmitLabel="Envoyer ces autres horaires" />
            )
          ) : (
            <div className="mt-3 rounded-[18px] border border-amber-200 bg-amber-50 p-4">
              <p className="mb-1 text-[12px] font-bold text-amber-700">Dernier choix possible</p>
              <p className="mb-3 text-[12px] font-medium text-amber-600">
                Si aucun créneau ne convient, la messagerie prendra le relais.
              </p>
              <button
                type="button"
                onClick={openChatAfterLimit}
                disabled={saving}
                className="troco-primary-btn flex h-11 w-full items-center justify-center gap-2 rounded-full disabled:opacity-40"
              >
                <MessageCircle size={14} strokeWidth={2.2} />
                Continuer par message
              </button>
            </div>
          )}
        </TrocoCard>
      )}

      {/* Premier tour — peut proposer */}
      {canPropose && !isAvailabilityProposer && !userMustRespond && (
        <TrocoCard className="p-5">
          <p className="troco-caption mb-1">Troc accepté 🎉</p>
          <h2 className="text-[18px] font-extrabold tracking-[-0.03em] text-[#102033]">Organise la rencontre</h2>
          <p className="mt-1 text-[13px] font-medium text-slate-500">
            Choisis jusqu'à 3 disponibilités pour vous retrouver.
          </p>
          <SlotForm title="Mes disponibilités" onSubmitLabel={selectedSlots.length > 0 ? "Valider mes disponibilités" : "Choisir mes disponibilités"} />
        </TrocoCard>
      )}

      {/* Disponibilités déjà validées */}
      {!canPropose && !isAvailabilityProposer && !userMustRespond && (
        <TrocoCard className="p-5 text-center">
          <p className="text-[16px] font-extrabold text-[#102033]">Les disponibilités sont validées.</p>
          <button
            type="button"
            onClick={() => navigate(`/exchanges/${exchange.id}`, { state: { exchangeId: exchange.id, exchange } })}
            className="troco-primary-btn mt-4 rounded-full"
          >
            Choisir le lieu
          </button>
        </TrocoCard>
      )}
    </div>
  );

  return (
    <>
      {/* ── Mobile ── */}
      <div className="mx-auto w-full max-w-[430px] px-4 pt-[max(14px,env(safe-area-inset-top))] pb-10 lg:hidden">
        <header className="mb-5 flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E4ECE8] bg-white shadow-[0_6px_16px_rgba(15,23,42,0.05)]" aria-label="Retour">
            <ArrowLeft size={18} strokeWidth={2.3} className="text-[#102033]" />
          </button>
          <div>
            <p className="troco-caption">Disponibilités</p>
            <h1 className="text-[19px] font-extrabold leading-tight tracking-[-0.03em] text-[#102033]">
              Trouver le meilleur moment
            </h1>
          </div>
        </header>
        {mainContent}
      </div>

      {/* ── Desktop ── */}
      <div className="hidden lg:block">
        <div className="mx-auto max-w-5xl px-8 pb-12 pt-8">
          <header className="mb-8 flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E4ECE8] bg-white shadow-[0_6px_16px_rgba(15,23,42,0.05)] transition active:scale-95" aria-label="Retour">
              <ArrowLeft size={19} strokeWidth={2.3} className="text-[#102033]" />
            </button>
            <div>
              <p className="troco-caption">Disponibilités</p>
              <h1 className="text-[28px] font-extrabold tracking-[-0.04em] text-[#102033]">
                Trouver le meilleur moment
              </h1>
            </div>
          </header>

          <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-8">
            <div>{mainContent}</div>
            <aside className="sticky top-8 space-y-4">
              <TrocoCard className="p-5">
                <p className="troco-caption mb-3">Comment ça marche</p>
                <div className="space-y-3">
                  {[
                    { icon: CalendarDays, text: "Propose jusqu'à 3 créneaux disponibles." },
                    { icon: Clock3,       text: "L'autre personne choisit ou contre-propose." },
                    { icon: MessageCircle,text: "Après 2 tours, la messagerie prend le relais." },
                  ].map(({ icon: Icon, text }) => (
                    <p key={text} className="flex items-start gap-2.5 text-[13px] font-medium leading-relaxed text-slate-500">
                      <Icon size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-[#1ABEA3]" />
                      {text}
                    </p>
                  ))}
                </div>
              </TrocoCard>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
