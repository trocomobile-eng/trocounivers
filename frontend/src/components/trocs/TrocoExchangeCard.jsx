import { ChevronDown, ChevronUp } from "lucide-react";

import { TrocoCard } from "../UI";
import TrocoConversationPreview from "./TrocoConversationPreview";
import TrocoExpandedExchange from "./TrocoExpandedExchange";
import {
  getActivityLabel,
  getConversationSnippet,
  getExchangeObjects,
  getInitial,
  getOtherId,
  getOtherName,
  getOtherPhoto,
  getStatus,
  shortName,
} from "./trocoExchangeUtils";

function statusClass(tone) {
  if (tone === "green") return "bg-emerald-50 text-emerald-700";
  if (tone === "amber") return "bg-amber-50 text-amber-700";
  if (tone === "blue") return "bg-cyan-50 text-cyan-700";
  return "bg-slate-50 text-slate-500";
}

function ObjectThumb({ item }) {
  return (
    <div className="relative h-[76px] w-[76px] overflow-hidden rounded-[22px] bg-slate-100 shadow-[0_10px_20px_rgba(15,23,42,0.06)]">
      {item?.image ? (
        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-cyan-50 text-2xl">
          📦
        </div>
      )}
    </div>
  );
}

function Participant({ exchange, userId, navigate }) {
  const name = shortName(getOtherName(exchange, userId));
  const photo = getOtherPhoto(exchange, userId);
  const otherId = getOtherId(exchange, userId);

  function openProfile(event) {
    event.stopPropagation();
    if (otherId) navigate(`/users/${otherId}`);
  }

  return (
    <button
      type="button"
      onClick={openProfile}
      className="flex min-w-0 items-center gap-3 text-left"
    >
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#21c7ff] via-[#14b8a6] to-[#35d18f] text-white shadow-[0_8px_18px_rgba(20,184,166,0.10)]">
        {photo ? (
          <img src={photo} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[13px] font-black">
            {getInitial(name)}
          </div>
        )}
      </div>

      <span className="min-w-0">
        <span className="block truncate text-[15px] font-black text-[#081225]">
          {name}
        </span>
        <span className="block text-[12px] font-semibold text-[#6b8a86]">
          Actif {getActivityLabel(exchange)}
        </span>
      </span>
    </button>
  );
}

export default function TrocoExchangeCard({
  exchange,
  userId,
  expanded,
  onToggle,
  navigate,
}) {
  const status = getStatus(exchange, userId);
  const objects = getExchangeObjects(exchange, userId);
  const message =
    getConversationSnippet(exchange) ||
    "L’échange avance tranquillement.";
  const time = getActivityLabel(exchange);
  const otherName = shortName(getOtherName(exchange, userId));

  function openChat(event) {
    event.stopPropagation();
    navigate(`/exchanges/${exchange.id}/chat`);
  }

  function openPlace(event) {
    event.stopPropagation();
    navigate("/choose-place", {
      state: {
        exchangeId: exchange.id,
        exchange,
      },
    });
  }

  return (
    <TrocoCard
      variant="plain"
      className="overflow-hidden rounded-[32px] border border-white/75 bg-white/76 shadow-[0_16px_40px_rgba(20,184,166,0.06)] backdrop-blur-xl transition-all duration-300"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Participant exchange={exchange} userId={userId} navigate={navigate} />

          <div className="flex shrink-0 items-center gap-2">
            <span className={["rounded-full px-3 py-1.5 text-[11px] font-black", statusClass(status.tone)].join(" ")}>
              {status.label}
            </span>

            <button
              type="button"
              onClick={onToggle}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/72 text-slate-700 shadow-[0_7px_18px_rgba(15,23,42,0.035)] transition active:scale-95"
              aria-label={expanded ? "Réduire" : "Développer"}
            >
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          <ObjectThumb item={objects.mine} />
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[17px] font-black text-[#0f9f9a]">
            ⇄
          </span>
          <ObjectThumb item={objects.theirs} />
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-2 text-center">
          <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-slate-500">
            Tu proposes <span className="font-black text-[#081225]">{objects.mine?.title || "un objet"}</span>
          </p>

          <span />

          <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-slate-500">
            {otherName} propose <span className="font-black text-[#081225]">{objects.theirs?.title || "un objet"}</span>
          </p>
        </div>

        <TrocoConversationPreview message={message} time={time} />
      </div>

      <div
        className={[
          "grid transition-all duration-300 ease-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <TrocoExpandedExchange
            exchange={exchange}
            onContact={openChat}
            onSeePlace={openPlace}
          />
        </div>
      </div>
    </TrocoCard>
  );
}
