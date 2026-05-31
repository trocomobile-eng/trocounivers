import BottomNav from "../components/BottomNav";

export default function MobileLayout({
  children,
  className = "",
  contentClassName = "",
  withBottomNav = true,
}) {
  return (
    <div
      className={[
        "min-h-screen bg-[var(--troco-bg)]",
        withBottomNav ? "pb-[84px]" : "pb-6",
        className,
      ].join(" ")}
    >
      <main
        className={[
          "mx-auto w-full max-w-[520px]",
          "px-3 pt-[max(10px,env(safe-area-inset-top))]",
          contentClassName,
        ].join(" ")}
      >
        {children}
      </main>

      {withBottomNav && <BottomNav />}
    </div>
  );
}
