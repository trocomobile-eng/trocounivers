export default function TrocoCard({
  children,
  className = "",
  as: Component = "div",
  soft = false,
  interactive = false,
  ...props
}) {
  return (
    <Component
      className={[
        soft ? "troco-soft-card" : "troco-card",
        interactive ? "troco-hover-lift troco-press" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}
