export default function Badge({ children, className = "" }) {
  return (
    <span className={["troco-badge", className].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}
