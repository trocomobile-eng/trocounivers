export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  const variants = {
    primary: "troco-btn troco-btn-primary",
    quiet: "troco-btn troco-btn-quiet",
    plain: "",
  };

  return (
    <button
      type={props.type || "button"}
      className={[variants[variant] || variants.primary, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
