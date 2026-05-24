import { ITEM_CONDITIONS } from "../constants/itemConditions";

export default function ItemConditionSelector({ value, onChange }) {
  return (
    <section className="rounded-[34px] border border-white/80 bg-white/78 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.07)] backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">
          État
        </p>

        <h2 className="mt-2 text-[24px] font-black tracking-[-0.04em] text-slate-950">
          Dans quel état est l’objet ?
        </h2>

        <p className="mt-2 text-[14px] font-medium leading-relaxed text-slate-500">
          Cette information aide à créer des échanges plus justes.
        </p>
      </div>

      <div className="grid gap-2">
        {ITEM_CONDITIONS.map((condition) => {
          const active = value === condition.value;

          return (
            <button
              key={condition.value}
              type="button"
              onClick={() => onChange(condition.value)}
              className={`rounded-[24px] border p-4 text-left transition active:scale-[0.99] ${
                active
                  ? "border-emerald-200 bg-emerald-50/80 shadow-[0_12px_28px_rgba(16,185,129,0.10)]"
                  : "border-white/80 bg-white/75 shadow-[0_10px_24px_rgba(15,23,42,0.045)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{condition.emoji}</span>

                <span className="min-w-0">
                  <span className="block text-[15px] font-black tracking-[-0.02em] text-slate-950">
                    {condition.label}
                  </span>

                  <span className="mt-1 block text-[13px] font-medium leading-relaxed text-slate-500">
                    {condition.description}
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
