import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import NotificationButton from "./NotificationButton";

function getInitial(user) {
  return (user?.displayName || user?.email || "U").charAt(0).toUpperCase();
}

function getPhoto(user) {
  return user?.photoURL || user?.photoUrl || user?.avatarUrl || user?.avatar || "";
}

function AvatarButton({ user: userProp }) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const resolvedUser = userProp || authUser;
  const photo = getPhoto(resolvedUser);

  return (
    <button
      type="button"
      onClick={() => navigate("/profile")}
      className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-[2px] border-white bg-white shadow-[0_8px_22px_rgba(15,23,42,0.07)] transition active:scale-95"
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
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1ABEA3] to-[#36C982] text-[15px] font-black text-white">
          {getInitial(resolvedUser)}
        </div>
      )}
    </button>
  );
}

export default function TrocoPageHeader({
  title,
  subtitle,
  eyebrow,
  showBack = false,
  showAvatar = true,
  showNotifications = true,
  compact = false,
  className = "",
  right,
  actions,
  user,
  onBack,
}) {
  const navigate = useNavigate();

  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }

    if (window.history.length > 1) navigate(-1);
    else navigate("/feed");
  }

  return (
    <header className={["troco-page-header", compact ? "mb-5" : "mb-7", className].join(" ")}>
      <div className="flex min-h-[52px] items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-3">
            {showBack && (
              <button
                type="button"
                onClick={handleBack}
                className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/85 bg-white/92 text-[#102033] shadow-[0_8px_22px_rgba(15,23,42,0.055)] transition active:scale-95"
                aria-label="Retour"
              >
                <ArrowLeft size={20} strokeWidth={2.25} />
              </button>
            )}

            <div className="min-w-0">
              {eyebrow && (
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#18A98E]">
                  {eyebrow}
                </p>
              )}

              {title && (
                <h1 className="troco-soft-title mt-1 text-[34px] font-extrabold leading-[0.96] tracking-[-0.045em] text-[#102033] md:text-[38px]">
                  {title}
                </h1>
              )}

              {subtitle && (
                <p className="troco-soft-muted mt-2 max-w-[680px] text-[14.5px] font-medium leading-relaxed text-[#66758A]">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 pt-1">
          {right || (
            <>
              {actions}

              {showNotifications && (
                <div className="[&_button]:h-12 [&_button]:w-12 [&_button]:rounded-full [&_button]:border-white/85 [&_button]:bg-white/92 [&_button]:text-[#18A98E] [&_button]:shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
                  <NotificationButton />
                </div>
              )}

              {showAvatar && <AvatarButton user={user} />}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
