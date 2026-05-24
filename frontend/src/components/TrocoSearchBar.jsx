import { Search, SlidersHorizontal } from "lucide-react";

export default function TrocoSearchBar({
  value,
  onChange,
  placeholder = "Rechercher un objet...",
  onFilter,
  className = "",
}) {
  return (
    <div className={["flex h-[54px] items-center gap-3 rounded-full border border-white/75 bg-white/90 px-5 shadow-[0_10px_28px_rgba(15,23,42,0.045)] backdrop-blur-[14px]", className].join(" ")}>
      <Search size={20} strokeWidth={2.05} className="shrink-0 text-[#081225]" />

      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[#081225] outline-none placeholder:text-slate-500"
      />

      <button
        type="button"
        onClick={onFilter}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#081225] shadow-[0_6px_14px_rgba(15,23,42,0.035)] transition active:scale-95"
        aria-label="Filtres"
      >
        <SlidersHorizontal size={17} strokeWidth={2} />
      </button>
    </div>
  );
}
