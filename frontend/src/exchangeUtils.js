/**
 * exchangeUtils.js
 * Source unique pour la logique d'état des échanges.
 * Importé par ExchangeDetailPage, ExchangesPage, AvailabilityPage, BottomNav.
 *
 * Stages possibles :
 *  "loading"       — exchange non chargé
 *  "pending"       — proposition en attente de réponse
 *  "start_time"    — troc accepté, doit proposer des créneaux
 *  "respond_time"  — créneaux reçus, l'utilisateur doit répondre
 *  "waiting_time"  — créneaux envoyés, en attente de l'autre
 *  "start_place"   — créneau validé, doit proposer un lieu
 *  "respond_place" — lieu reçu, l'utilisateur doit répondre
 *  "waiting_place" — lieu envoyé, en attente de l'autre
 *  "confirmed"     — rencontre confirmée (horaire + lieu validés)
 *  "chat"          — messagerie ouverte (limite de tours atteinte)
 *  "completed"     — troc terminé
 *  "declined"      — troc refusé
 *  "cancelled"     — troc annulé
 */
export function getExchangeStage(exchange, currentUserId) {
  if (!exchange) return "loading";

  const status = exchange.status || "pending";

  const hasTimeOptions =
    Array.isArray(exchange.availabilityOptions) &&
    exchange.availabilityOptions.length > 0 &&
    !exchange.selectedAvailability;

  const hasPlaceOptions =
    Array.isArray(exchange.placeOptions) &&
    exchange.placeOptions.length > 0 &&
    !exchange.selectedPlace;

  if (status === "completed") return "completed";
  if (status === "declined") return "declined";
  if (status === "cancelled") return "cancelled";

  if (
    status === "meeting_confirmed" ||
    exchange.meetingConfirmed ||
    (exchange.selectedAvailability && exchange.selectedPlace)
  ) {
    return "confirmed";
  }

  if (status === "chat_open" || exchange.chatOpened || exchange.chatOpen) {
    return "chat";
  }

  if (hasPlaceOptions && exchange.placeProposedBy !== currentUserId) {
    return "respond_place";
  }

  if (hasPlaceOptions && exchange.placeProposedBy === currentUserId) {
    return "waiting_place";
  }

  if (exchange.selectedAvailability && !exchange.selectedPlace) {
    return "start_place";
  }

  if (hasTimeOptions && exchange.availabilityProposedBy !== currentUserId) {
    return "respond_time";
  }

  if (hasTimeOptions && exchange.availabilityProposedBy === currentUserId) {
    return "waiting_time";
  }

  if (
    status === "accepted" ||
    status === "scheduling_time" ||
    status === "time_confirmed" ||
    status === "choosing_place"
  ) {
    return "start_time";
  }

  return "pending";
}

/**
 * Retourne true si l'échange nécessite une action de currentUserId.
 */
export function exchangeNeedsAttention(exchange, currentUserId) {
  if (!exchange || !currentUserId) return false;

  const stage = getExchangeStage(exchange, currentUserId);
  const status = exchange.status || "";

  if (["completed", "declined", "cancelled"].includes(status)) return false;

  return (
    exchange.needsAttentionFor === currentUserId ||
    stage === "respond_time" ||
    stage === "respond_place" ||
    (stage === "pending" && exchange.receiverId === currentUserId)
  );
}

/**
 * Priorité de tri pour la liste des échanges.
 * Plus le score est bas, plus l'échange remonte.
 */
export function getExchangePriority(exchange, currentUserId) {
  const stage = getExchangeStage(exchange, currentUserId);
  const needsMe = exchangeNeedsAttention(exchange, currentUserId);

  if (needsMe) return 0;
  if (["start_time", "start_place"].includes(stage)) return 1;
  if (["waiting_time", "waiting_place"].includes(stage)) return 2;
  if (stage === "pending") return 3;
  if (stage === "confirmed") return 4;
  if (stage === "chat") return 5;
  if (["completed", "declined", "cancelled"].includes(stage)) return 6;
  return 7;
}
