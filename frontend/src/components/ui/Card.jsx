export default function Card({
  as: Component = "div",
  variant = "default",
  className = "",
  children,
  ...props
}) {
  const variants = {
    default: "troco-panel",
    strong: "troco-panel-strong",
    row: "troco-row-card",
    plain: "",
  };

  return (
    <Component
      className={[variants[variant] || variants.default, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}
