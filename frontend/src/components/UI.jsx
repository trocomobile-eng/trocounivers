import { X } from "lucide-react";

export function TrocoCard({
  children,
  className = "",
  as: Component = "div",
  variant = "default",
  ...props
}) {
  const variantClass =
    variant === "strong"
      ? "troco-card-strong"
      : variant === "ghost"
        ? "rounded-[26px] border border-white/65 bg-white/46 shadow-[0_8px_24px_rgba(15,23,42,0.025)] backdrop-blur-xl"
        : variant === "plain"
          ? ""
          : "troco-card";

  return (
    <Component className={[variantClass, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Component>
  );
}

export function TrocoButton({
  children,
  variant = "primary",
  size = "default",
  className = "",
  type = "button",
  ...props
}) {
  const variantClass =
    variant === "secondary"
      ? "troco-secondary-btn"
      : variant === "ghost"
        ? "rounded-[18px] font-black text-slate-600 transition active:scale-95"
        : variant === "pill"
          ? "rounded-full border border-teal-100/70 bg-white/62 font-black text-slate-600 shadow-[0_6px_18px_rgba(15,23,42,0.025)] backdrop-blur-xl transition active:scale-95"
          : variant === "plain"
            ? ""
            : "troco-primary-btn";

  const sizeClass =
    variant === "plain"
      ? ""
      : size === "sm"
        ? "px-3 py-1.5 text-[12px]"
        : size === "lg"
          ? "px-5 py-3.5 text-[15px]"
          : "px-4 py-2.5 text-[14px]";

  return (
    <button
      type={type}
      className={[variantClass, sizeClass, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

export function TrocoBadge({ children, className = "" }) {
  return <span className={["troco-badge", className].join(" ")}>{children}</span>;
}

export function TrocoPill({
  children,
  active = false,
  className = "",
  as: Component = "button",
  type = "button",
  ...props
}) {
  const base =
    "inline-flex h-7 items-center justify-center rounded-full px-3 text-[12px] font-bold transition active:scale-[0.98]";

  const state = active
    ? "troco-active-gradient"
    : "border border-teal-200/45 bg-white/55 text-[#2f6f68] hover:bg-white/78";

  const componentProps = Component === "button" ? { type } : {};

  return (
    <Component
      className={[base, state, className].filter(Boolean).join(" ")}
      {...componentProps}
      {...props}
    >
      {children}
    </Component>
  );
}

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
        "flex h-[46px] items-center rounded-[18px] border border-teal-200/45 bg-white/72 px-3.5 shadow-[0_10px_30px_rgba(20,184,166,0.06)] backdrop-blur-xl",
        className,
      ].filter(Boolean).join(" ")}
    >
      {icon && <span className="mr-3 shrink-0 text-[#16a39a]">{icon}</span>}

      <input
        className={[
          "min-w-0 flex-1 bg-transparent text-[14px] font-medium text-slate-700 outline-none placeholder:text-slate-400",
          inputClassName,
        ].filter(Boolean).join(" ")}
        {...props}
      />

      {rightIcon && <span className="ml-3 shrink-0 text-[#24746f]">{rightIcon}</span>}
    </label>
  );
}

export function TrocoSheet({
  open,
  title,
  children,
  onClose,
  footer,
  className = "",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/18 px-3 pb-3 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <TrocoCard
        as="section"
        variant="plain"
        className={[
          "relative z-10 w-full max-w-[520px] rounded-[34px] border border-white/80 bg-white/92 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.16)] backdrop-blur-2xl",
          className,
        ].filter(Boolean).join(" ")}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && (
            <h2 className="text-[22px] font-black leading-tight tracking-[-0.04em] text-[#081225]">
              {title}
            </h2>
          )}

          {onClose && (
            <TrocoButton
              variant="plain"
              onClick={onClose}
              className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
              aria-label="Fermer"
            >
              <X size={18} strokeWidth={2.4} />
            </TrocoButton>
          )}
        </div>

        <div>{children}</div>

        {footer && <div className="mt-5">{footer}</div>}
      </TrocoCard>
    </div>
  );
}

export function TrocoModal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
  className = "",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/22 px-4 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <TrocoCard
        as="section"
        variant="plain"
        className={[
          "relative z-10 w-full max-w-[420px] rounded-[32px] border border-white/80 bg-white/94 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.16)] backdrop-blur-2xl",
          className,
        ].filter(Boolean).join(" ")}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-[24px] font-black leading-tight tracking-[-0.045em] text-[#081225]">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-2 text-[14px] font-medium leading-relaxed text-slate-500">
                {description}
              </p>
            )}
          </div>

          {onClose && (
            <TrocoButton
              variant="plain"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
              aria-label="Fermer"
            >
              <X size={18} strokeWidth={2.4} />
            </TrocoButton>
          )}
        </div>

        {children && <div className="mt-5">{children}</div>}
        {footer && <div className="mt-6">{footer}</div>}
      </TrocoCard>
    </div>
  );
}

export const Card = TrocoCard;
export const Button = TrocoButton;
export const Badge = TrocoBadge;
