import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationButton from "../components/NotificationButton";
import DesktopSidebar from "./DesktopSidebar";

function getPhoto(user) {
  return user?.photoURL || user?.photoUrl || user?.avatarUrl || "";
}

function getInitial(user) {
  return (user?.displayName || user?.email || "U").charAt(0).toUpperCase();
}

function DesktopTopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const photo = getPhoto(user);

  return (
    <div className="sticky top-0 z-30 flex h-[56px] items-center justify-end gap-2.5 bg-[#F5F5F3] px-8">
      <NotificationButton />

      <button
        type="button"
        onClick={() => navigate("/profile")}
        className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-white shadow-[0_4px_12px_rgba(15,23,42,0.10)] transition active:scale-95"
        aria-label="Profil"
      >
        {photo ? (
          <img
            src={photo}
            alt="Profil"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#1ABEA3] text-[12px] font-black text-white">
            {getInitial(user)}
          </div>
        )}
      </button>
    </div>
  );
}

export default function DesktopLayout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--troco-bg)] text-[#0d1b2a]">
      <div className="flex min-h-screen">
        <DesktopSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <DesktopTopBar />

          {/* Zone contenu */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
