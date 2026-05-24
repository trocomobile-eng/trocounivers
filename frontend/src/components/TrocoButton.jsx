export default function TrocoButton({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base = "inline-flex items-center justify-center rounded-[20px] px-4 py-3 text-sm font-black transition active:scale-95 disabled:opacity-50";
  const styles =
    variant === "secondary"
      ? "border border-white/80 bg-white/85 text-[#071124] shadow-[0_8px_22px_rgba(15,23,42,0.045)]"
      : "bg-gradient-to-r from-cyan-500 to-emerald-400 text-white shadow-[0_12px_30px_rgba(14,165,233,0.18)]";

  return (
    <button className={[base, styles, className].join(" ")} {...props}>
      {children}
    </button>
  );
}
