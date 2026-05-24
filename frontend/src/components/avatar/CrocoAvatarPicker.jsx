import CrocoAvatar from "./CrocoAvatar";
import {
  CROCO_COLOR_OPTIONS,
  CROCO_EYE_OPTIONS,
  CROCO_SHAPE_OPTIONS,
  CROCO_SPIKE_OPTIONS,
  DEFAULT_CROCO_AVATAR,
} from "../../utils/crocoAvatarOptions";

function Section({ title, subtitle, children }) {
  return (
    <section className="rounded-[28px] border border-white/85 bg-white/86 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] backdrop-blur-xl">
      <div className="mb-3">
        <h2 className="text-[16px] font-black tracking-[-0.03em] text-[#081225]">{title}</h2>
        {subtitle && <p className="mt-1 text-[12px] font-medium text-[#64748B]">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export default function CrocoAvatarPicker({ value = DEFAULT_CROCO_AVATAR, onChange }) {
  const avatar = { ...DEFAULT_CROCO_AVATAR, ...value };

  function update(partial) {
    onChange?.({ ...avatar, ...partial });
  }

  return (
    <div className="space-y-4">
      <Section title="Choisis ta forme" subtitle="La silhouette de base de ton compagnon Troco.">
        <div className="grid grid-cols-3 gap-3">
          {CROCO_SHAPE_OPTIONS.map((shape) => {
            const active = avatar.shape === shape.id;

            return (
              <button
                key={shape.id}
                type="button"
                onClick={() => update({ shape: shape.id })}
                className={[
                  "rounded-[22px] border bg-white/90 p-2 text-center transition active:scale-[0.98]",
                  active ? "border-[#2ECC8A] ring-2 ring-[#2ECC8A]/20" : "border-white/80",
                ].join(" ")}
              >
                <CrocoAvatar avatar={{ ...avatar, shape: shape.id }} size={78} />
                <span className="mt-1 block text-[11px] font-black text-[#081225]">{shape.label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Choisis ta couleur" subtitle="Tu pourras toujours la modifier plus tard.">
        <div className="grid grid-cols-5 gap-3">
          {CROCO_COLOR_OPTIONS.map((color) => {
            const active = avatar.color === color.id;

            return (
              <button
                key={color.id}
                type="button"
                onClick={() => update({ color: color.id })}
                className={[
                  "flex flex-col items-center gap-1 rounded-[18px] border bg-white/85 p-2 transition active:scale-[0.98]",
                  active ? "border-[#2ECC8A] ring-2 ring-[#2ECC8A]/20" : "border-white/80",
                ].join(" ")}
              >
                <span
                  className="h-8 w-8 rounded-full shadow-[0_6px_14px_rgba(15,23,42,0.08)]"
                  style={{ background: color.color }}
                />
                <span className="text-[10px] font-bold text-slate-500">{color.label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Personnalise les détails" subtitle="Simple, subtil, pas trop cartoon.">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#0f9f9a]">Yeux</p>
            <div className="grid grid-cols-4 gap-2">
              {CROCO_EYE_OPTIONS.map((eye) => (
                <button
                  key={eye.id}
                  type="button"
                  onClick={() => update({ eyes: eye.id })}
                  className={[
                    "rounded-[16px] border px-3 py-2 text-[12px] font-black transition active:scale-[0.98]",
                    avatar.eyes === eye.id ? "border-[#2ECC8A] bg-[#E8F7EF] text-[#22a06b]" : "border-white/80 bg-white/85 text-slate-500",
                  ].join(" ")}
                >
                  {eye.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#0f9f9a]">Écailles</p>
            <div className="grid grid-cols-3 gap-2">
              {CROCO_SPIKE_OPTIONS.map((spike) => (
                <button
                  key={spike.id}
                  type="button"
                  onClick={() => update({ spikes: spike.id })}
                  className={[
                    "rounded-[16px] border px-3 py-2 text-[12px] font-black transition active:scale-[0.98]",
                    avatar.spikes === spike.id ? "border-[#2ECC8A] bg-[#E8F7EF] text-[#22a06b]" : "border-white/80 bg-white/85 text-slate-500",
                  ].join(" ")}
                >
                  {spike.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => update({ cheeks: !avatar.cheeks })}
            className={[
              "w-full rounded-[18px] border px-4 py-3 text-[13px] font-black transition active:scale-[0.98]",
              avatar.cheeks ? "border-[#2ECC8A] bg-[#E8F7EF] text-[#22a06b]" : "border-white/80 bg-white/85 text-slate-500",
            ].join(" ")}
          >
            {avatar.cheeks ? "Joues activées" : "Ajouter des joues"}
          </button>
        </div>
      </Section>
    </div>
  );
}
