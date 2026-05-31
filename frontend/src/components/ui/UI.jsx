import { X } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TrocoCard — boîte premium réutilisable
//
// variant="default"   → card blanche standard, ombre légère  (la plus utilisée)
// variant="raised"    → card blanche avec ombre plus marquée (hero, mise en avant)
// variant="subtle"    → card fond gris très clair            (sections secondaires)
// variant="outline"   → card blanche avec bordure visible    (formulaires, inputs)
// variant="ghost"     → fond transparent, juste une bordure  (sections intégrées)
// variant="plain"     → aucun style                          (composition libre)
// ─────────────────────────────────────────────────────────────────────────────

export function TrocoCard({
  children,
  className = "",
  as: Component = "div",
  variant = "default",
  padding = true,
  hover = false,
  ...props
}) {
  const base = "rounded-[20px] transition";

  const variants = {
    default: "bg-white shadow-[0_2px_12px_rgba(15,23,42,0.07)]",
    raised:  "bg-white shadow-[0_8px_32px_rgba(15,23,42,0.10)]",
    subtle:  "bg-[#F0F0EE]",
    outline: "bg-white border border-[#E4ECE8]",
    ghost:   "border border-[#E4ECE8] bg-transparent",
    plain:   "",
  };

  const hoverClass = hover
    ? "cursor-pointer hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.10)] active:scale-[0.99]"
    : "";

  const paddingClass = padding && variant !== "plain" ? "p-5" : "";

  return (
    <Component
      className={[
        base,
        variants[variant] || variants.default,
        hoverClass,
        paddingClass,
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TrocoButton
//
// variant="primary"   → gradient vert principal
// variant="secondary" → blanc avec bordure
// variant="ghost"     → texte seul
// variant="danger"    → rouge discret
// variant="plain"     → aucun style
// ─────────────────────────────────────────────────────────────────────────────

export function TrocoButton({
  children,
  variant = "primary",
  size = "default",
  className = "",
  type = "button",
  ...props
}) {
  const base = "inline-flex items-center justify-center font-bold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary:   "troco-primary-btn",
    secondary: "rounded-[16px] border border-[#E4ECE8] bg-white text-[#0d1b2a] shadow-[0_2px_8px_rgba(15,23,42,0.06)]",
    ghost:     "rounded-[16px] text-[#0d1b2a] hover:bg-[#F0F0EE]",
    danger:    "rounded-[16px] border border-rose-200 bg-rose-50 text-rose-600",
    plain:     "",
  };

  const sizes = {
    sm:      "h-9 gap-1.5 px-3 text-[12px]",
    default: "h-11 gap-2 px-4 text-[14px]",
    lg:      "h-13 gap-2.5 px-5 text-[15px]",
  };

  const sizeClass = variant === "plain" ? "" : (sizes[size] || sizes.default);

  return (
    <button
      type={type}
      className={[base, variants[variant] || variants.primary, sizeClass, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TrocoInput
// ─────────────────────────────────────────────────────────────────────────────

export function TrocoInput({
  icon,
  rightIcon,
  className = "",
  inputClassName = "",
  ...props
}) {
  return (
    <label
      className={[
        "flex h-[48px] items-center rounded-[14px] bg-white px-4 shadow-[0_1px_4px_rgba(15,23,42,0.08)]",
        className,
      ].filter(Boolean).join(" ")}
    >
      {icon && <span className="mr-3 shrink-0 text-[#94a3b8]">{icon}</span>}
      <input
        className={[
          "min-w-0 flex-1 bg-transparent text-[14px] font-medium text-[#0d1b2a] outline-none placeholder:text-[#94a3b8]",
          inputClassName,
        ].filter(Boolean).join(" ")}
        {...props}
      />
      {rightIcon && <span className="ml-3 shrink-0 text-[#94a3b8]">{rightIcon}</span>}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TrocoBadge
// ─────────────────────────────────────────────────────────────────────────────

export function TrocoBadge({
  children,
  variant = "default",
  className = "",
}) {
  const variants = {
    default: "bg-[#F0FAF7] text-[#1ABEA3]",
    amber:   "bg-amber-50 text-amber-700",
    rose:    "bg-rose-50 text-rose-600",
    sky:     "bg-sky-50 text-sky-600",
    slate:   "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold",
        variants[variant] || variants.default,
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TrocoPill
// ─────────────────────────────────────────────────────────────────────────────

export function TrocoPill({
  children,
  active = false,
  className = "",
  as: Component = "button",
  type = "button",
  ...props
}) {
  const componentProps = Component === "button" ? { type } : {};

  return (
    <Component
      className={[
        "inline-flex h-8 items-center justify-center rounded-full px-3.5 text-[13px] font-semibold transition active:scale-[0.98]",
        active
          ? "bg-gradient-to-r from-[#1ABEA3] to-[#36C982] text-white shadow-[0_4px_12px_rgba(26,190,163,0.20)]"
          : "bg-white border border-[#E4ECE8] text-[#4a5568]",
        className,
      ].filter(Boolean).join(" ")}
      {...componentProps}
      {...props}
    >
      {children}
    </Component>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TrocoSheet — bottom sheet mobile
// ─────────────────────────────────────────────────────────────────────────────

export function TrocoSheet({ open, title, children, onClose, footer, className = "" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 pb-0">
      <button type="button" aria-label="Fermer" className="absolute inset-0 cursor-default" onClick={onClose} />
      <section
        className={[
          "relative z-10 w-full max-w-[520px] rounded-t-[28px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-5 shadow-[0_-8px_40px_rgba(15,23,42,0.12)]",
          className,
        ].filter(Boolean).join(" ")}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#D1D5DB]" />
        {(title || onClose) && (
          <div className="mb-4 flex items-center justify-between gap-4">
            {title && <h2 className="text-[20px] font-extrabold tracking-[-0.03em] text-[#0d1b2a]">{title}</h2>}
            {onClose && (
              <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0F0EE] text-[#4a5568]" aria-label="Fermer">
                <X size={16} strokeWidth={2.4} />
              </button>
            )}
          </div>
        )}
        <div>{children}</div>
        {footer && <div className="mt-5">{footer}</div>}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TrocoModal — modale centrée
// ─────────────────────────────────────────────────────────────────────────────

export function TrocoModal({ open, title, description, children, onClose, footer, className = "" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <button type="button" aria-label="Fermer" className="absolute inset-0 cursor-default" onClick={onClose} />
      <section
        className={[
          "relative z-10 w-full max-w-[400px] rounded-[24px] bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.16)]",
          className,
        ].filter(Boolean).join(" ")}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-[22px] font-extrabold tracking-[-0.04em] text-[#0d1b2a]">{title}</h2>}
            {description && <p className="mt-1.5 text-[14px] font-medium leading-relaxed text-[#64748b]">{description}</p>}
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0F0EE] text-[#4a5568]" aria-label="Fermer">
              <X size={16} strokeWidth={2.4} />
            </button>
          )}
        </div>
        {children && <div className="mt-5">{children}</div>}
        {footer && <div className="mt-5">{footer}</div>}
      </section>
    </div>
  );
}

// Alias pour compatibilité
export const Card   = TrocoCard;
export const Button = TrocoButton;
export const Badge  = TrocoBadge;
