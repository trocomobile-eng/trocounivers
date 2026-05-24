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
        "troco-app-bg min-h-screen overflow-x-hidden text-[#081225]",
        withBottomNav ? "pb-[88px]" : "pb-8",
        className,
      ].join(" ")}
    >
      <main
        className={[
          "mx-auto w-full max-w-[640px]",
          "px-[14px] pt-[max(10px,env(safe-area-inset-top))]",
          contentClassName,
        ].join(" ")}
      >
        {children}
      </main>

      {withBottomNav && <BottomNav />}
    </div>
  );
}
