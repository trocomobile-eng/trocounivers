export default function TrocoDesktopHero({
  eyebrow,
  title,
  subtitle,
  rightSlot,
}) {
  return (
    <header className="mb-7 flex items-start justify-between gap-6">
      <div className="max-w-[720px]">
        <p className="mb-2 text-[12px] font-black uppercase tracking-[0.24em] text-[#0f9f9a]">
          {eyebrow}
        </p>

        <h1 className="text-[58px] font-black leading-[0.92] tracking-[-0.07em] text-[#081225]">
          {title}
        </h1>

        <p className="mt-3 max-w-[640px] text-[16px] leading-relaxed text-[#607087]">
          {subtitle}
        </p>
      </div>

      {rightSlot}
    </header>
  );
}
