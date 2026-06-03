export default function AmbassadorBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 ${className}`}
    >
      🌱 Ambassadeur
    </span>
  );
}
