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
        "min-h-screen overflow-x-hidden bg-[#F7F3EC] text-[#081225]",
        withBottomNav ? "pb-[88px]" : "pb-8",
        className,
      ].join(" ")}
    >
      <main
        className={[
          "mx-auto w-full max-w-[760px]",
          "px-[9px] pt-[max(8px,env(safe-area-inset-top))]",
          contentClassName,
        ].join(" ")}
      >
        {children}
      </main>

      {withBottomNav && <BottomNav />}
    </div>
  );
}
