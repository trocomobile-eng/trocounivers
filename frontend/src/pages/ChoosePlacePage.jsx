import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import PlaceCard from "../components/PlaceCard";
import { MOCK_PLACES, MIDDLE_POINTS, OTHER_PLACE } from "../data/mockPlaces";

function normalizePlace(place) {
  if (!place) return null;

  return {
    id: place.id || place.placeId || place.title || place.name,
    title: place.title || place.name || "Lieu de rencontre",
    name: place.name || place.title || "Lieu de rencontre",
    address: place.address || place.location || place.subtitle || "",
    imageUrl: place.imageUrl || place.image || "",
    isPartner: place.isPartner ?? place.partner ?? false,
  };
}

function getOtherId(exchange, userId) {
  if (!exchange || !userId) return "";
  return exchange.senderId === userId ? exchange.receiverId : exchange.senderId;
}

function getOtherName(exchange, userId) {
  if (!exchange || !userId) return "L’autre personne";

  if (exchange.senderId === userId) {
    return (
      exchange.receiverName ||
      exchange.receiverDisplayName ||
      exchange.receiverEmail ||
      "L’autre personne"
    );
  }

  return (
    exchange.senderName ||
    exchange.senderDisplayName ||
    exchange.senderEmail ||
    "L’autre personne"
  );
}

function shortName(value = "") {
  const cleaned = String(value).trim();

  if (!cleaned) return "L’autre personne";
  if (cleaned.includes("@")) return cleaned.split("@")[0];

  const parts = cleaned.split(/\s+/);
  if (parts.length <= 1) return cleaned;

  return `${parts[0]} ${parts[1].charAt(0)}.`;
}

function getPlaceCounterCount(exchange) {
  return Number(exchange?.placeCounterCount || exchange?.placeRoundCount || 0);
}

function getPlaceNotificationType(isCounterProposal) {
  return isCounterProposal ? "place_counter_proposed" : "place_proposed";
}

export default function ChoosePlacePage() {
  const { id, exchangeId } = useParams();

  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const currentExchangeId =
    id || exchangeId || location.state?.exchangeId || location.state?.exchange?.id;

  const allPlaces = useMemo(
    () => [...MOCK_PLACES, ...MIDDLE_POINTS, OTHER_PLACE],
    []
  );

  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedPlace, setSelectedPlace] = useState(MOCK_PLACES[0]);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      navigate("/login", { replace: true });
      return;
    }

    async function loadExchange() {
      if (!currentExchangeId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const snapshot = await getDoc(doc(db, "exchanges", currentExchangeId));

        if (!snapshot.exists()) {
          setExchange(null);
          return;
        }

        const loadedExchange = {
          id: snapshot.id,
          ...snapshot.data(),
        };

        setExchange(loadedExchange);

        const existingPlace = loadedExchange.placeOptions?.[0] || loadedExchange.selectedPlace;
        if (existingPlace) {
          setSelectedPlace(existingPlace);
        }
      } catch (error) {
        console.error("Erreur chargement lieu :", error);
        setExchange(null);
      } finally {
        setLoading(false);
      }
    }

    loadExchange();
  }, [authLoading, currentExchangeId, navigate, user?.uid]);

  const placeOptions = Array.isArray(exchange?.placeOptions)
    ? exchange.placeOptions
    : [];

  const placeCounterCount = getPlaceCounterCount(exchange);
  const canStillCounterPlace = placeCounterCount < 2;
  const placeNegotiationBlocked =
    placeOptions.length > 0 &&
    !exchange?.selectedPlace &&
    placeCounterCount >= 2;

  const isPlaceProposer =
    placeOptions.length > 0 &&
    exchange?.placeProposedBy === user?.uid &&
    !exchange?.selectedPlace;

  const userMustRespond =
    placeOptions.length > 0 &&
    exchange?.placeProposedBy !== user?.uid &&
    !exchange?.selectedPlace;

  const canPropose =
    !exchange?.selectedPlace &&
    Boolean(exchange?.selectedAvailability) &&
    canStillCounterPlace &&
    (
      placeOptions.length === 0 ||
      exchange?.status === "choosing_place" ||
      exchange?.status === "time_confirmed"
    );

  const selectedLabel = useMemo(() => {
    if (!selectedPlace) return "";
    const place = normalizePlace(selectedPlace);
    return [place.name || place.title, place.address].filter(Boolean).join(" · ");
  }, [selectedPlace]);

  async function proposePlace(place = selectedPlace) {
    if (!exchange?.id || !place) return;

    const normalizedPlace = normalizePlace(place);
    const otherId = getOtherId(exchange, user.uid);
    const previousCount = getPlaceCounterCount(exchange);
    const nextCount = previousCount + 1;
    const isCounterProposal = previousCount > 0 || placeOptions.length > 0;

    setSaving(true);

    try {
      if (nextCount > 2) {
        await updateDoc(doc(db, "exchanges", exchange.id), {
          status: "chat_open",
          chatOpened: true,
          chatOpenReason: "place_negotiation_limit",
          needsAttentionFor: otherId,
          lastActionBy: user.uid,
          notificationType: "chat_open",
          updatedAt: serverTimestamp(),
        });

        navigate(`/exchanges/${exchange.id}/chat`, { replace: true });
        return;
      }

      await updateDoc(doc(db, "exchanges", exchange.id), {
        status: "choosing_place",
        placeOptions: [normalizedPlace],
        placeProposedBy: user.uid,
        placeProposedByName: user.displayName || user.email || "Utilisateur Troco",
        placeCounterCount: nextCount,
        placeLastCounterAt: serverTimestamp(),
        needsAttentionFor: otherId,
        lastActionBy: user.uid,
        notificationType: getPlaceNotificationType(isCounterProposal),
        updatedAt: serverTimestamp(),
      });

      navigate(`/exchanges/${exchange.id}`, { replace: true });
    } catch (error) {
      console.error("Erreur proposition lieu :", error);
      alert("Impossible d’envoyer ce lieu.");
    } finally {
      setSaving(false);
    }
  }

  async function openChatAfterPlaceLimit() {
    if (!exchange?.id) return;

    const otherId = getOtherId(exchange, user.uid);

    setSaving(true);

    try {
      await updateDoc(doc(db, "exchanges", exchange.id), {
        status: "chat_open",
        chatOpened: true,
        chatOpenReason: "place_negotiation_limit",
        needsAttentionFor: otherId,
        lastActionBy: user.uid,
        notificationType: "chat_open",
        updatedAt: serverTimestamp(),
      });

      navigate(`/exchanges/${exchange.id}/chat`, { replace: true });
    } catch (error) {
      console.error("Erreur ouverture messagerie :", error);
      alert("Impossible d’ouvrir la messagerie.");
    } finally {
      setSaving(false);
    }
  }

  async function acceptPlace(place) {
    if (!exchange?.id || !place) return;

    const normalizedPlace = normalizePlace(place);

    setSaving(true);

    try {
      await updateDoc(doc(db, "exchanges", exchange.id), {
        status: "meeting_confirmed",
        selectedPlace: normalizedPlace,
        selectedPlaceAt: serverTimestamp(),
        selectedPlaceBy: user.uid,
        meetingConfirmed: true,
        needsAttentionFor: "",
        lastActionBy: user.uid,
        notificationType: "meeting_confirmed",
        updatedAt: serverTimestamp(),
      });

      // Rediriger vers MeetingConfirmedPage avec l'id dans l'URL (pas de state perdu au refresh)
      navigate(`/exchanges/${exchange.id}/meeting`, { replace: true });
    } catch (error) {
      console.error("Erreur validation lieu :", error);
      alert("Impossible de valider ce lieu.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="troco-page-narrow">
        <div className="rounded-[28px] border border-[#E4ECE8] bg-white p-7 text-center text-sm font-bold text-slate-500">
          Chargement...
        </div>
      </div>
    );
  }

  if (!exchange) {
    return (
      <div className="troco-page-narrow">
        <button type="button" onClick={() => navigate(-1)} className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-[#E4ECE8] bg-white shadow-[0_6px_16px_rgba(15,23,42,0.05)]" aria-label="Retour">
          <span className="text-lg text-[#102033]">‹</span>
        </button>
        <div className="rounded-[28px] border border-[#E4ECE8] bg-white p-7 text-center">
          <p className="text-lg font-extrabold text-[#102033]">Échange introuvable.</p>
          <button type="button" onClick={() => navigate("/exchanges")} className="troco-primary-btn mt-5 rounded-full">
            Retour aux trocs
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile ── */}
      <main className="mx-auto w-full max-w-[520px] px-5 pb-10 pt-[max(14px,env(safe-area-inset-top))] lg:max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.06)]"
          >
            ‹
          </button>

          <p className="text-[15px] font-black text-slate-950">
            Choisir un lieu
          </p>

          <div className="h-11 w-11" />
        </header>

        {isPlaceProposer ? (
          <section className="rounded-[34px] border border-[#E4ECE8] bg-white/86 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.045)]">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
              Lieu envoyé
            </p>

            <h1 className="mt-2 text-[32px] font-black leading-[0.98] tracking-[-0.055em] text-slate-950">
              En attente de réponse
            </h1>

            <p className="mt-3 text-[14px] font-medium leading-relaxed text-slate-500">
              {shortName(getOtherName(exchange, user.uid))} doit accepter ce lieu ou proposer une alternative. {placeCounterCount >= 2 ? "Si aucun accord n’est trouvé, la messagerie prendra le relais." : ""}
            </p>

            <div className="mt-5 rounded-[24px] bg-white/82 p-4">
              <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#0f9f9a]">
                Lieu de rencontre
              </p>
              <p className="mt-1 text-sm font-bold text-slate-700">
                {placeOptions[0]?.title || placeOptions[0]?.name || "Lieu de rencontre"} · {placeOptions[0]?.address || ""}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/exchanges/${currentExchangeId}`)}
              className="mt-5 flex h-[50px] w-full items-center justify-center rounded-[20px] border border-[#E4ECE8] bg-white/88 text-[14px] font-black text-[#0f9f9a]"
            >
              Retour à l'échange
            </button>
          </section>
        ) : userMustRespond ? (
          <>
            <section className="rounded-[34px] border border-[#E4ECE8] bg-white/90 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.045)] backdrop-blur-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
                Lieu de rencontre
              </p>

              <h1 className="mt-2 max-w-[320px] text-[34px] font-black leading-[0.96] tracking-[-0.055em] text-slate-950">
                {shortName(getOtherName(exchange, user.uid))} propose ce lieu
              </h1>

              <p className="mt-3 text-[14px] font-medium leading-relaxed text-slate-500">
                Tu peux accepter ou proposer une alternative. {placeCounterCount === 1 ? "C’est le dernier aller-retour possible avant ouverture de la messagerie." : ""}
              </p>
            </section>

            <div className="mt-5 space-y-3">
              {placeOptions.map((place, index) => (
                <button
                  key={place.id || index}
                  type="button"
                  onClick={() => acceptPlace(place)}
                  disabled={saving}
                  className="w-full rounded-[28px] border border-[#E4ECE8] bg-white/94 p-4 text-left shadow-[0_10px_26px_rgba(15,23,42,0.04)] disabled:opacity-50"
                >
                  <p className="text-[17px] font-black text-slate-950">
                    {place.title || place.name || "Lieu de rencontre"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {place.address || "Adresse à confirmer"}
                  </p>
                  <p className="mt-3 text-sm font-black text-[#0f9f9a]">
                    Accepter ce lieu
                  </p>
                </button>
              ))}
            </div>

            {canStillCounterPlace ? (
              <section className="mt-7 rounded-[28px] border border-[#E4ECE8] bg-white/86 p-4">
                <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#0f9f9a]">
                  Proposer une alternative
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Choisis un autre lieu ci-dessous, puis envoie-le à l’autre personne.
                </p>
              </section>
            ) : (
              <section className="mt-7 rounded-[28px] border border-sky-100 bg-sky-50/70 p-4">
                <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#0f9f9a]">
                  Dernière réponse
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Tu peux accepter ce lieu. Si ce lieu ne convient pas, la messagerie prendra le relais.
                </p>

                <button
                  type="button"
                  onClick={openChatAfterPlaceLimit}
                  disabled={saving}
                  className="mt-4 h-[50px] w-full rounded-[18px] bg-gradient-to-r from-[#1ABEA3] to-[#36C982] text-sm font-black text-white disabled:opacity-40"
                >
                  Continuer par message
                </button>
              </section>
            )}
          </>
        ) : (
          <section className="rounded-[34px] border border-[#E4ECE8] bg-white/90 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.045)] backdrop-blur-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
              Lieu
            </p>

            <h1 className="mt-2 max-w-[320px] text-[34px] font-black leading-[0.96] tracking-[-0.055em] text-slate-950">
              Proposez un lieu de rencontre
            </h1>

            <p className="mt-3 text-[14px] font-medium leading-relaxed text-slate-500">
              L’autre personne devra accepter ce lieu ou proposer une alternative.
            </p>
          </section>
        )}

        {placeNegotiationBlocked && (
          <section className="mt-6 rounded-[28px] border border-orange-100 bg-orange-50/70 p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
            <p className="text-[12px] font-black uppercase tracking-[0.16em] text-orange-700">
              Deux propositions déjà échangées
            </p>

            <h2 className="mt-2 text-[24px] font-black tracking-[-0.04em] text-slate-950">
              Continuez par message
            </h2>

            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
              Vous avez déjà fait deux allers-retours sur le lieu. Pour éviter une boucle, Troco ouvre la messagerie afin de finaliser plus simplement.
            </p>

            <button
              type="button"
              onClick={openChatAfterPlaceLimit}
              disabled={saving}
              className="mt-5 h-[52px] w-full rounded-[20px] bg-gradient-to-r from-[#1ABEA3] to-[#36C982] px-5 py-4 text-sm font-black text-white disabled:opacity-40"
            >
              Ouvrir la messagerie
            </button>
          </section>
        )}

        {canPropose && (
          <>
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[16px] font-black text-slate-950">
                  Cafés partenaires
                </h2>

                <button
                  type="button"
                  className="text-[12px] font-black text-[#0f9f9a]"
                >
                  Voir tous
                </button>
              </div>

              <div className="space-y-4">
                {MOCK_PLACES.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    selected={selectedPlace?.id === place.id}
                    onSelect={setSelectedPlace}
                  />
                ))}
              </div>
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-[16px] font-black text-slate-950">
                Le milieu
              </h2>

              <div className="space-y-3">
                {MIDDLE_POINTS.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    selected={selectedPlace?.id === place.id}
                    onSelect={setSelectedPlace}
                    compact
                  />
                ))}
              </div>
            </section>

            <section className="mt-7">
              <h2 className="mb-3 text-[16px] font-black text-slate-950">
                Autre lieu
              </h2>

              <PlaceCard
                place={OTHER_PLACE}
                selected={selectedPlace?.id === OTHER_PLACE.id}
                onSelect={setSelectedPlace}
                compact
              />
            </section>

            {selectedPlace && (
              <div className="mt-6 rounded-[24px] border border-[#E4ECE8] bg-white/88 p-4">
                <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#0f9f9a]">
                  Lieu sélectionné
                </p>

                <p className="mt-1 text-sm font-bold text-slate-700">
                  {selectedLabel}
                </p>
              </div>
            )}

            <button
              type="button"
              disabled={!selectedPlace || saving}
              onClick={() => proposePlace(selectedPlace)}
              className="mt-7 h-14 w-full rounded-[22px] bg-gradient-to-r from-[#1ABEA3] to-[#36C982] text-[15px] font-black text-white shadow-[0_18px_38px_rgba(18,77,50,0.18)] transition active:scale-[0.985] disabled:opacity-40"
            >
              {userMustRespond ? "Proposer ce lieu à la place" : placeCounterCount > 0 ? "Envoyer cette alternative" : "Envoyer ce lieu"}
            </button>
          </>
        )}

        {exchange?.selectedPlace && (
          <section className="mt-6 rounded-[28px] border border-white/70 bg-white/90 p-5 text-center shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
            <p className="text-lg font-black text-slate-950">
              Le lieu est déjà confirmé.
            </p>

            <button
              type="button"
              onClick={() => navigate(`/exchanges/${exchange.id}/meeting`)}
              className="mt-5 rounded-full bg-gradient-to-r from-[#1ABEA3] to-[#36C982] px-5 py-3 text-sm font-black text-white"
            >
              Voir la rencontre confirmée
            </button>
          </section>
        )}
      </main>

      {/* ── Desktop ── */}
    </>
  );
}
