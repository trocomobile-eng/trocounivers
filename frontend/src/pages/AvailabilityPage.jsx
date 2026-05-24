import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Loader2,
  MessageCircle,
  Plus,
  Trash2,
} from "lucide-react";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import BottomNav from "../components/BottomNav";

// ─── constantes ───────────────────────────────────────────────────────────────
const DAY_LABELS = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
const TIME_OPTIONS = ["10h","12h","14h","16h","18h30","19h","20h"];

// ─── helpers (identiques à l'original) ────────────────────────────────────────
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

// ─── sous-composants ──────────────────────────────────────────────────────────
function SlotRow({ slot, onRemove }) {
  return (
    <div
      className="flex items-center justify-between rounded-[12px] px-4 py-3"
      style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <span className="flex items-center gap-3 text-[14px] font-bold text-white">
        <Clock3 size={15} style={{ color: "#5dcaa5" }} strokeWidth={2.2} />
        {formatSlot(slot)}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(slot.id)}
          className="text-white/25 hover:text-white/60 transition"
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
      className="w-full flex items-center justify-between rounded-[14px] px-4 py-3.5 text-left transition active:scale-[0.97] disabled:opacity-50"
      style={{ background: "#1a2e20", border: "1px solid rgba(93,202,165,0.25)" }}
    >
      <span className="flex items-center gap-3 text-[14px] font-bold text-white">
        <CalendarDays size={15} style={{ color: "#5dcaa5" }} strokeWidth={2.2} />
        {formatSlot(slot)}
      </span>
      <span
        className="text-[11px] font-bold px-2.5 py-1 rounded-full"
        style={{ background: "rgba(93,202,165,0.15)", color: "#5dcaa5" }}
      >
        Accepter
      </span>
    </button>
  );
}

// ─── page principale ───────────────────────────────────────────────────────────
export default function AvailabilityPage() {
  const { id, exchangeId } = useParams();
  const currentExchangeId = id || exchangeId;
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const days = useMemo(() => buildNextSevenDays(), []);

  const [exchange, setExchange]             = useState(null);
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [selectedDay, setSelectedDay]       = useState(days[0]?.value || "");
  const [selectedTime, setSelectedTime]     = useState("");
  const [selectedSlots, setSelectedSlots]   = useState([]);
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

  const availabilityOptions = Array.isArray(exchange?.availabilityOptions) ? exchange.availabilityOptions : [];
  const isAvailabilityProposer = availabilityOptions.length > 0 && exchange?.availabilityProposedBy === user?.uid && !exchange?.selectedAvailability;
  const userMustRespond        = availabilityOptions.length > 0 && exchange?.availabilityProposedBy !== user?.uid && !exchange?.selectedAvailability;
  const availabilityCounterCount = getAvailabilityCounterCount(exchange);
  const canStillCounter          = availabilityCounterCount < 2;
  const canPropose = !exchange?.selectedAvailability && (!availabilityOptions.length || (userMustRespond && canStillCounter)) && ["accepted","scheduling_time","time_confirmed","choosing_place"].includes(exchange?.status || "accepted");

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
      const prevCount  = getAvailabilityCounterCount(exchange);
      const isCounter  = availabilityOptions.length > 0;
      const nextCount  = isCounter ? prevCount + 1 : prevCount;
      const otherId    = getOtherUserId(exchange, user.uid);

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
      console.error("Erreur messagerie :", err);
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
      console.error("Erreur créneau :", err);
      alert("Impossible de valider ce créneau.");
    } finally {
      setSaving(false);
    }
  }

  // ── formulaire de création de créneaux ──────────────────────────────────────
  const SlotForm = ({ title, onSubmitLabel }) => (
    <div
      className="rounded-[18px] p-4 mt-4"
      style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#5dcaa5" }}>
        {title}
      </p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-[11px] font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Jour</p>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="w-full h-11 rounded-[10px] px-3 text-[13px] font-bold outline-none"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
          >
            {days.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[11px] font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Heure</p>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full h-11 rounded-[10px] px-3 text-[13px] font-bold outline-none"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
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
        className="w-full h-10 flex items-center justify-center gap-2 rounded-[10px] text-[13px] font-bold transition disabled:opacity-40"
        style={{ background: "rgba(93,202,165,0.12)", color: "#5dcaa5", border: "1px solid rgba(93,202,165,0.2)" }}
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
        className="mt-4 w-full h-12 flex items-center justify-center gap-2 rounded-full text-[14px] font-black text-white transition active:scale-[0.98] disabled:opacity-40"
        style={{ background: selectedSlots.length > 0 ? "#1a4d2e" : "#1a1a1a" }}
      >
        {saving ? <><Loader2 size={16} className="animate-spin" /> Envoi…</> : onSubmitLabel}
      </button>
    </div>
  );

  // ── états de chargement / erreur ───────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen pb-28" style={{ background: "#0d0d0d" }}>
        <div className="flex items-center justify-center pt-32 text-white/30 text-sm font-bold">Chargement…</div>
        <BottomNav />
      </div>
    );
  }

  if (!exchange) {
    return (
      <div className="min-h-screen pb-28" style={{ background: "#0d0d0d" }}>
        <div className="px-4 pt-[max(14px,env(safe-area-inset-top))]">
          <button type="button" onClick={() => navigate(-1)} className="h-9 w-9 flex items-center justify-center rounded-full mb-6" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
            <ArrowLeft size={16} className="text-white/70" />
          </button>
          <div className="rounded-[18px] p-6 text-center" style={{ background: "#141414" }}>
            <p className="text-white font-black">Échange introuvable.</p>
            <button type="button" onClick={() => navigate("/exchanges")} className="mt-4 px-5 py-2.5 rounded-full text-sm font-black text-white" style={{ background: "#1a4d2e" }}>
              Retour aux trocs
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const other = shortName(getOtherName(exchange, user.uid));

  return (
    <div className="min-h-screen pb-32" style={{ background: "#0d0d0d" }}>
      <div className="mx-auto w-full max-w-[430px] px-4 pt-[max(14px,env(safe-area-inset-top))]">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <header className="flex items-center gap-3 mb-5">
          <button type="button" onClick={() => navigate(-1)} className="h-9 w-9 flex items-center justify-center rounded-full shrink-0" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }} aria-label="Retour">
            <ArrowLeft size={16} className="text-white/70" />
          </button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#5dcaa5" }}>Disponibilités</p>
            <h1 className="text-white font-black leading-tight" style={{ fontSize: 19, letterSpacing: "-0.03em" }}>
              Trouver le meilleur moment
            </h1>
          </div>
        </header>

        {/* ── Contexte ──────────────────────────────────────────────────────── */}
        <div className="rounded-[18px] p-4 mb-4" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[13px] font-medium leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Troco garde une logique d'aller-retour : chacun peut accepter ou proposer une alternative, avec{" "}
            <span className="text-white font-bold">deux tours maximum</span>.
          </p>
        </div>

        {/* ── États ─────────────────────────────────────────────────────────── */}

        {/* Proposer a déjà envoyé — en attente */}
        {isAvailabilityProposer && (
          <div className="rounded-[18px] p-5" style={{ background: "rgba(55,138,221,0.08)", border: "1px solid rgba(55,138,221,0.15)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#85b7eb" }}>
              Disponibilités envoyées
            </p>
            <h2 className="text-white font-black mb-1" style={{ fontSize: 18, letterSpacing: "-0.03em" }}>
              En attente de réponse
            </h2>
            <p className="text-[13px] font-medium mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
              {other} doit choisir un créneau ou proposer une alternative.
            </p>
            <div className="space-y-2">
              {availabilityOptions.map((slot, i) => (
                <SlotRow key={slot.id || i} slot={slot} />
              ))}
            </div>
          </div>
        )}

        {/* L'autre a proposé — doit répondre */}
        {userMustRespond && (
          <div className="rounded-[18px] p-5" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#5dcaa5" }}>
              Disponibilités reçues
            </p>
            <h2 className="text-white font-black mb-1" style={{ fontSize: 18, letterSpacing: "-0.03em" }}>
              Un créneau te convient ?
            </h2>
            <p className="text-[13px] font-medium mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
              Tu peux accepter un horaire ou proposer une alternative.
            </p>

            <div className="space-y-2 mb-4">
              {availabilityOptions.map((slot, i) => (
                <SlotButton key={slot.id || i} slot={slot} onAccept={acceptSlot} saving={saving} />
              ))}
            </div>

            {canStillCounter ? (
              <>
                {!showCounterForm ? (
                  <button
                    type="button"
                    onClick={() => setShowCounterForm(true)}
                    className="w-full h-11 rounded-full text-[13px] font-bold transition"
                    style={{ background: "#1a1a1a", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    Ces horaires ne me conviennent pas
                  </button>
                ) : (
                  <SlotForm title="Proposer d'autres créneaux" onSubmitLabel="Envoyer ces autres horaires" />
                )}
              </>
            ) : (
              <div className="rounded-[14px] p-4 mt-2" style={{ background: "rgba(239,159,39,0.08)", border: "1px solid rgba(239,159,39,0.15)" }}>
                <p className="text-[12px] font-bold mb-1" style={{ color: "#fac775" }}>Dernier choix possible</p>
                <p className="text-[12px] font-medium mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Si aucun créneau ne convient, la messagerie prendra le relais.
                </p>
                <button
                  type="button"
                  onClick={openChatAfterLimit}
                  disabled={saving}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-full text-[13px] font-bold text-white disabled:opacity-40"
                  style={{ background: "#1a4d2e" }}
                >
                  <MessageCircle size={14} strokeWidth={2.2} />
                  Continuer par message
                </button>
              </div>
            )}
          </div>
        )}

        {/* Peut proposer — premier tour */}
        {canPropose && !isAvailabilityProposer && !userMustRespond && (
          <div className="rounded-[18px] p-5" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#5dcaa5" }}>
              Troc accepté 🎉
            </p>
            <h2 className="text-white font-black mb-1" style={{ fontSize: 18, letterSpacing: "-0.03em" }}>
              Organise la rencontre
            </h2>
            <p className="text-[13px] font-medium mb-0" style={{ color: "rgba(255,255,255,0.4)" }}>
              Choisis jusqu'à 3 disponibilités pour vous retrouver.
            </p>
            <SlotForm title="Mes disponibilités" onSubmitLabel={selectedSlots.length > 0 ? "Valider mes disponibilités" : "Choisir mes disponibilités"} />
          </div>
        )}

        {/* Disponibilités déjà validées */}
        {!canPropose && !isAvailabilityProposer && !userMustRespond && (
          <div className="rounded-[18px] p-5 text-center" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-white font-black mb-1" style={{ fontSize: 16 }}>
              Les disponibilités sont validées.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/exchanges/${exchange.id}`, { state: { exchangeId: exchange.id, exchange } })}
              className="mt-4 px-5 py-2.5 rounded-full text-[13px] font-black text-white"
              style={{ background: "#1a4d2e" }}
            >
              Choisir le lieu
            </button>
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  );
}
