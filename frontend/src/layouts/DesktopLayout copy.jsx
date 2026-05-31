import DesktopSidebar from "./DesktopSidebar";

export default function DesktopLayout({
  children,
  className = "",
  contentClassName = "",
}) {
  return (
    <div
      className={[
        "min-h-screen overflow-x-hidden bg-[#F6FAF8] text-[#102033]",
        className,
      ].join(" ")}
    >
      <div className="flex min-h-screen">
        <DesktopSidebar />

        <main
          className={[
            "min-w-0 flex-1",
            contentClassName,
          ].join(" ")}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
