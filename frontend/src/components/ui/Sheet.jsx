import { X } from "lucide-react";
import Card from "./Card";
import Button from "./Button";

export default function Sheet({
  open,
  title,
  children,
  onClose,
  footer,
  className = "",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/20 px-3 pb-3 backdrop-blur-[2px]">
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
            <Button
              variant="plain"
              onClick={onClose}
              className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
              aria-label="Fermer"
            >
              <X size={18} strokeWidth={2.4} />
            </Button>
          )}
        </div>

        <div>{children}</div>

        {footer && <div className="mt-5">{footer}</div>}
      </Card>
    </div>
  );
}
