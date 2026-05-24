import { Heart, Sparkles, Zap } from "lucide-react";

const ICONS = [Sparkles, Zap, Heart];

export default function ProfileActivitySection({ activities = [] }) {
  if (!activities.length) return null;

  return (
    <section className="rounded-[36px] border border-[#ECF4F0] bg-white/[0.92] p-6 shadow-[0_16px_46px_rgba(15,23,42,0.055)]">
      <h2 className="text-[22px] font-black tracking-[-0.04em] text-[#081225]">
        Activité récente
      </h2>

      <div className="mt-5 space-y-4">
        {activities.map((activity, index) => {
          const Icon = ICONS[index % ICONS.length];

          return (
            <div
              key={`${activity.label}-${index}`}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Icon size={18} className="shrink-0 text-[#4B9D8D]" />
                <p className="truncate text-[15px] font-bold text-[#081225]">
                  {activity.label}
                </p>
              </div>

              {activity.time && (
                <p className="shrink-0 text-[13px] font-medium text-slate-400">
                  {activity.time}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
