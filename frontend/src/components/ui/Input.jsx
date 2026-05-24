export default function Input({
  icon,
  rightIcon,
  className = "",
  inputClassName = "",
  ...props
}) {
  return (
    <label className={["troco-desktop-search flex items-center gap-3", className].filter(Boolean).join(" ")}>
      {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
      <input
        className={["min-w-0 flex-1 bg-transparent outline-none", inputClassName].filter(Boolean).join(" ")}
        {...props}
      />
      {rightIcon && <span className="shrink-0 text-slate-400">{rightIcon}</span>}
    </label>
  );
}
