import BottomNav from "./BottomNav";

export default function TrocoPage({
  children,
  className = "",
  contentClassName = "",
  withBottomNav = true,
}) {
  return (
    <div
      className={[
        "troco-page-bg min-h-screen overflow-x-hidden text-[#081225]",
        "troco-page-enter",
        withBottomNav ? "pb-[96px] lg:pb-10" : "pb-8",
        className,
      ].join(" ")}
    >
      <main
        className={[
          "troco-mobile-container mx-auto w-full",
          "px-4 pt-[max(14px,env(safe-area-inset-top))]",
          "lg:max-w-7xl lg:px-8 lg:pt-8",
          contentClassName,
        ].join(" ")}
      >
        {children}
      </main>

      {withBottomNav && <BottomNav />}
    </div>
  );
}
