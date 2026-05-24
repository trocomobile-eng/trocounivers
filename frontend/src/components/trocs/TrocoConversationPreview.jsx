import { MessageCircle } from "lucide-react";

export default function TrocoConversationPreview({ message, time }) {
  return (
    <div className="mt-4 rounded-[24px] bg-gradient-to-br from-emerald-50/80 to-cyan-50/45 px-4 py-3.5">
      <div className="flex gap-2.5">
        <MessageCircle size={17} className="mt-0.5 shrink-0 text-[#0f9f9a]" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-[14px] font-semibold leading-relaxed text-[#0f766e]">
            “{message}”
          </p>

          {time && (
            <p className="mt-1 text-[11.5px] font-bold text-[#7aa6a0]">
              {time}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
