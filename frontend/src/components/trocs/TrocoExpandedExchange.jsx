import { CalendarDays, MapPin, MessageCircle, UsersRound } from "lucide-react";

import { TrocoButton } from "../UI";
import {
  getConversationSnippet,
  getParticipantCount,
  getPlaceSubtitle,
  getPlaceTitle,
  getTimeLabel,
} from "./trocoExchangeUtils";

function ChatBubble({ children, align = "left" }) {
  return (
    <div className={align === "right" ? "flex justify-end" : "flex justify-start"}>
      <div
        className={[
          "max-w-[86%] rounded-[22px] px-4 py-3 text-[13.5px] font-medium leading-relaxed",
          align === "right"
            ? "bg-gradient-to-br from-[#35d18f] to-[#21c7ff] text-white"
            : "bg-white/78 text-[#0f766e]",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

export default function TrocoExpandedExchange({ exchange, onContact, onSeePlace }) {
  const placeTitle = getPlaceTitle(exchange);
  const placeSubtitle = getPlaceSubtitle(exchange);
  const timeLabel = getTimeLabel(exchange);
  const participantCount = getParticipantCount(exchange);
  const message =
    getConversationSnippet(exchange) ||
    `On peut se retrouver ${timeLabel.toLowerCase()} ☕️`;

  return (
    <div className="border-t border-teal-50/80 px-4 pb-4 pt-4">
      <div className="space-y-3 rounded-[26px] bg-white/46 p-3.5">
        <div className="flex items-start gap-2.5 rounded-[22px] bg-white/70 p-3.5">
          <MapPin size={17} className="mt-0.5 shrink-0 text-[#0f9f9a]" />
          <div>
            <p className="text-[14px] font-black text-[#081225]">
              {placeTitle}
            </p>
            <p className="mt-0.5 text-[12.5px] font-semibold text-slate-500">
              {placeSubtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-[12px] font-bold text-slate-600">
            <CalendarDays size={14} className="text-[#0f9f9a]" />
            {timeLabel}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-[12px] font-bold text-slate-600">
            <UsersRound size={14} className="text-[#0f9f9a]" />
            {participantCount} participants
          </span>
        </div>

        <div className="space-y-2.5 pt-1">
          <ChatBubble>{message}</ChatBubble>
          {exchange?.replyPreview && (
            <ChatBubble align="right">{exchange.replyPreview}</ChatBubble>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <TrocoButton
          variant="plain"
          onClick={onContact}
          className="flex h-12 items-center justify-center gap-2 rounded-[18px] border border-teal-200/60 bg-white text-[13px] font-black text-[#0f9f9a]"
        >
          <MessageCircle size={16} />
          Message
        </TrocoButton>

        <TrocoButton
          onClick={onSeePlace}
          className="flex h-12 items-center justify-center gap-2 rounded-[18px] text-[13px] font-black"
        >
          <MapPin size={16} />
          Voir le lieu
        </TrocoButton>
      </div>
    </div>
  );
}
