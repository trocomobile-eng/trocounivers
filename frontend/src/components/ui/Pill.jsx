export default function Pill({
  active = false,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type={props.type || "button"}
      className={["troco-pill", active ? "is-active" : "", className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
