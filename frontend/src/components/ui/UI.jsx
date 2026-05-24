export function Card({ children, className = "", as: Component = "div", ...props }) {
  return (
    <Component className={["troco-card", className].join(" ")} {...props}>
      {children}
    </Component>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const cls = variant === "secondary" ? "troco-secondary-btn" : "troco-primary-btn";
  return (
    <button type="button" className={[cls, className].join(" ")} {...props}>
      {children}
    </button>
  );
}

export function Badge({ children, className = "" }) {
  return <span className={["troco-badge", className].join(" ")}>{children}</span>;
}
