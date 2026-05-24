import { X } from "lucide-react";
import Card from "./Card";
import Button from "./Button";

export default function Modal({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-4 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <Card
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
            <Button
              variant="plain"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
              aria-label="Fermer"
            >
              <X size={18} strokeWidth={2.4} />
            </Button>
          )}
        </div>

        {children && <div className="mt-5">{children}</div>}
        {footer && <div className="mt-6">{footer}</div>}
      </Card>
    </div>
  );
}
