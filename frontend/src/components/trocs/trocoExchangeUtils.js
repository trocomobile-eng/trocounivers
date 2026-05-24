export function clean(value = "") {
  return String(value || "").trim();
}

export function shortName(value = "") {
  const cleaned = clean(value);
  if (!cleaned) return "Utilisateur";
  if (cleaned.includes("@")) return cleaned.split("@")[0];

  const parts = cleaned.split(/\s+/);
  if (parts.length <= 1) return cleaned;

  return `${parts[0]} ${parts[1].charAt(0)}.`;
}

export function getInitial(value = "") {
  return clean(value).charAt(0).toUpperCase() || "U";
}

export function formatRelativeTime(value) {
  const raw =
    value?.toDate?.() ||
    (value?.seconds ? new Date(value.seconds * 1000) : null) ||
    (value ? new Date(value) : null);

  if (!raw || Number.isNaN(raw.getTime())) return "";

  const diff = Date.now() - raw.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 2) return "à l’instant";
  if (minutes < 60) return `il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} j`;

  return raw.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function unique(values = []) {
  return [...new Set(values.filter(Boolean).map(String))];
}

export function getOtherName(exchange, userId) {
  if (!exchange || !userId) return "l’autre personne";

  if (exchange.senderId === userId) {
    return (
      exchange.receiverName ||
      exchange.receiverDisplayName ||
      exchange.receiverEmail ||
      "l’autre personne"
    );
  }

  return (
    exchange.senderName ||
    exchange.senderDisplayName ||
    exchange.senderEmail ||
    "l’autre personne"
  );
}

export function getOtherId(exchange, userId) {
  if (!exchange || !userId) return "";

  if (exchange.senderId === userId) {
    return exchange.receiverId || exchange.toUserId || exchange.ownerId || "";
  }

  return exchange.senderId || exchange.fromUserId || "";
}

export function getOtherPhoto(exchange, userId) {
  if (!exchange || !userId) return "";

  if (exchange.senderId === userId) {
    return (
      exchange.receiverPhotoURL ||
      exchange.receiverAvatar ||
      exchange.receiverUserPhoto ||
      exchange.receiverProfilePhoto ||
      ""
    );
  }

  return (
    exchange.senderPhotoURL ||
    exchange.senderAvatar ||
    exchange.senderUserPhoto ||
    exchange.senderProfilePhoto ||
    ""
  );
}

export function getRequestedItem(exchange) {
  return {
    id:
      exchange?.requestedItemId ||
      exchange?.requestedId ||
      exchange?.itemId ||
      exchange?.targetItemId ||
      "requested",
    title:
      exchange?.requestedItemTitle ||
      exchange?.requestedTitle ||
      exchange?.itemTitle ||
      exchange?.targetItemTitle ||
      "Objet demandé",
    image:
      exchange?.requestedItemImage ||
      exchange?.requestedImage ||
      exchange?.itemImage ||
      exchange?.targetItemImage ||
      exchange?.requestedItemImages?.[0] ||
      exchange?.images?.[0] ||
      "",
  };
}

export function getOfferedItems(exchange) {
  const embedded = [
    ...(Array.isArray(exchange?.offeredItems) ? exchange.offeredItems : []),
    ...(Array.isArray(exchange?.proposedItems) ? exchange.proposedItems : []),
    ...(Array.isArray(exchange?.selectedItems) ? exchange.selectedItems : []),
  ].filter(Boolean);

  if (embedded.length) {
    return embedded.map((item, index) => ({
      id: item.id || item.itemId || `embedded-${index}`,
      title:
        item.title ||
        item.itemType ||
        item.generatedTitle ||
        item.name ||
        "Objet proposé",
      image:
        item.imageUrl ||
        item.photoUrl ||
        item.images?.[0] ||
        item.image ||
        "",
    }));
  }

  const ids = unique([
    ...(exchange?.finalOfferedItemIds || []),
    ...(exchange?.offeredItemIds || []),
    ...(exchange?.offeredItemsIds || []),
    ...(exchange?.selectedItemIds || []),
    ...(exchange?.proposedItemIds || []),
    exchange?.offeredItemId,
    exchange?.offeredId,
    exchange?.proposedItemId,
    exchange?.senderItemId,
  ]);

  const titles = [
    ...(exchange?.offeredItemTitles || []),
    ...(exchange?.offeredItemsTitles || []),
    ...(exchange?.proposedItemTitles || []),
    exchange?.offeredItemTitle,
    exchange?.offeredTitle,
    exchange?.proposedItemTitle,
  ].filter(Boolean);

  const images = [
    ...(exchange?.offeredItemImages || []),
    ...(exchange?.offeredImages || []),
    exchange?.offeredItemImage,
    exchange?.offeredImage,
    exchange?.proposedItemImage,
  ].filter(Boolean);

  const max = Math.max(ids.length, titles.length, images.length, 1);

  return Array.from({ length: max }).map((_, index) => ({
    id: ids[index] || `offered-${index}`,
    title: titles[index] || titles[0] || "Objet proposé",
    image: images[index] || images[0] || "",
  }));
}

export function getExchangeObjects(exchange, userId) {
  const requested = getRequestedItem(exchange);
  const offered = getOfferedItems(exchange);
  const userIsSender = exchange?.senderId === userId;

  if (userIsSender) {
    return {
      mine: offered[0] || { title: "Votre objet", image: "" },
      theirs: requested,
      extra: offered.slice(1),
    };
  }

  return {
    mine: requested,
    theirs: offered[0] || { title: "Objet proposé", image: "" },
    extra: offered.slice(1),
  };
}

export function formatAvailability(value) {
  if (!value) return "";

  if (typeof value === "string") return value;

  return (
    value.label ||
    [value.dayLabel || value.day, value.time].filter(Boolean).join(" · ") ||
    value.dateLabel ||
    ""
  );
}

export function getTimeLabel(exchange) {
  return (
    formatAvailability(exchange?.selectedAvailability) ||
    formatAvailability(exchange?.availabilityOptions?.[0]) ||
    "Horaire à organiser"
  );
}

export function getPlace(exchange) {
  return exchange?.selectedPlace || exchange?.placeOptions?.[0] || exchange?.place || {};
}

export function getPlaceTitle(exchange) {
  const place = getPlace(exchange);
  return place.title || place.name || place.address || "Lieu à confirmer";
}

export function getPlaceSubtitle(exchange) {
  const place = getPlace(exchange);

  if (place.isPartner || place.partner || place.type === "partner") {
    return place.area || place.district || place.city || "Café partenaire";
  }

  return place.address || place.area || place.district || exchange?.location || "Lieu local";
}

export function getConversationSnippet(exchange) {
  return (
    exchange?.lastMessageSnippet ||
    exchange?.lastMessage ||
    exchange?.messagePreview ||
    exchange?.note ||
    exchange?.meetingNote ||
    exchange?.placeNote ||
    exchange?.selectedPlace?.note ||
    exchange?.placeOptions?.[0]?.note ||
    ""
  );
}

export function getParticipantCount(exchange) {
  if (Array.isArray(exchange?.participants)) return exchange.participants.length;
  if (exchange?.senderId && exchange?.receiverId) return 2;
  return 2;
}

export function getStatus(exchange, userId) {
  const status = exchange?.status || "pending";

  if (status === "completed") {
    return { label: "Terminé", tone: "green" };
  }

  if (status === "cancelled" || status === "declined") {
    return { label: "Annulé", tone: "slate" };
  }

  if (
    status === "meeting_confirmed" ||
    exchange?.meetingConfirmed ||
    (exchange?.selectedAvailability && exchange?.selectedPlace)
  ) {
    return { label: "Confirmé", tone: "green" };
  }

  const needsAttention =
    exchange?.needsAttentionFor === userId ||
    (Array.isArray(exchange?.needsAttentionFor) && exchange.needsAttentionFor.includes(userId));

  if (
    needsAttention ||
    (exchange?.availabilityOptions?.length && exchange.availabilityProposedBy !== userId && !exchange.selectedAvailability) ||
    (exchange?.placeOptions?.length && exchange.placeProposedBy !== userId && !exchange.selectedPlace)
  ) {
    return { label: "À répondre", tone: "amber" };
  }

  if (status === "chat_open" || exchange?.chatOpened || exchange?.chatOpen) {
    return { label: "Discussion", tone: "blue" };
  }

  if (status === "accepted" || status === "scheduling_time" || status === "time_confirmed" || status === "choosing_place") {
    return { label: "En cours", tone: "blue" };
  }

  return { label: "En attente", tone: "blue" };
}

export function getActivityLabel(exchange) {
  const relative =
    formatRelativeTime(exchange?.lastMessageAt) ||
    formatRelativeTime(exchange?.updatedAt) ||
    formatRelativeTime(exchange?.createdAt);

  if (!relative) return "activité récente";

  if (exchange?.lastMessageSnippet || exchange?.lastMessage) {
    return relative;
  }

  if (
    exchange?.availabilityOptions?.length > 0 &&
    !exchange?.selectedAvailability
  ) {
    return `horaires proposés ${relative}`;
  }

  if (
    exchange?.placeOptions?.length > 0 &&
    !exchange?.selectedPlace
  ) {
    return `lieu proposé ${relative}`;
  }

  return relative;
}

export function matchesExchange(exchange, search, userId) {
  if (!search.trim()) return true;

  const needle = search.toLowerCase();
  const objects = getExchangeObjects(exchange, userId);

  return [
    objects.mine?.title,
    objects.theirs?.title,
    getOtherName(exchange, userId),
    getPlaceTitle(exchange),
    getPlaceSubtitle(exchange),
    exchange.status,
    getConversationSnippet(exchange),
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}
