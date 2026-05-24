import DesktopSidebar from "./DesktopSidebar";

export default function DesktopLayout({ children }) {
  return (
    <div className="troco-desktop-shell min-h-screen text-[#102033]">
      <div className="flex min-h-screen">
        <DesktopSidebar />

        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
