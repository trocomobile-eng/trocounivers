import { CalendarDays, Heart, MapPin } from "lucide-react";

import { getLocation, getMemberSince } from "./profileUtils";

function ContextItem({ icon: Icon, title, subtitle }) {
  return (
    <div className="min-w-0">
      <Icon size={18} className="text-[#4B9D8D]" />
      <p className="mt-3 text-[15px] font-black text-[#081225]">
        {title}
      </p>
      <p className="mt-1 text-[13px] font-medium text-slate-500">
        {subtitle}
      </p>
    </div>
  );
}

export default function ProfileAboutSection({ profile }) {
  return (
    <section className="rounded-[36px] border border-[#ECF4F0] bg-white/[0.92] p-6 shadow-[0_16px_46px_rgba(15,23,42,0.055)]">
      <h2 className="text-[22px] font-black tracking-[-0.04em] text-[#081225]">
        Contexte
      </h2>

      <div className="mt-6 grid gap-8 md:grid-cols-3">
        <ContextItem
          icon={CalendarDays}
          title={getMemberSince(profile)}
          subtitle="sur Troco"
        />

        <ContextItem
          icon={Heart}
          title="Univers personnel"
          subtitle="objets choisis"
        />

        <ContextItem
          icon={MapPin}
          title={getLocation(profile)}
          subtitle="rencontre locale"
        />
      </div>
    </section>
  );
}
