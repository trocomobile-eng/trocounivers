import { CalendarDays, Clock3, Hourglass } from "lucide-react";

function Pill({ icon: Icon, children }) {
  return (
    <span className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-teal-200/35 bg-white/64 px-3.5 text-[13px] font-black text-[#0f8f86] shadow-[0_8px_22px_rgba(20,184,166,0.045)] backdrop-blur-xl">
      <Icon size={15} strokeWidth={2.2} />
      {children}
    </span>
  );
}

export default function TrocoStatPills({ activeCount, toAnswerCount, todayCount }) {
  return (
    <div className="-mx-5 overflow-hidden px-5">
      <div className="flex gap-2 overflow-x-auto pb-1 pr-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Pill icon={CalendarDays}>{activeCount} actifs</Pill>
        <Pill icon={Hourglass}>{toAnswerCount} à répondre</Pill>
        <Pill icon={Clock3}>{todayCount} aujourd’hui</Pill>
      </div>
    </div>
  );
}
