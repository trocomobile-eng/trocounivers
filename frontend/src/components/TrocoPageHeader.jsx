import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import NotificationButton from "./NotificationButton";

function getInitial(user) {
  return (user?.displayName || user?.email || "U").charAt(0).toUpperCase();
}

function getPhoto(user) {
  return user?.photoURL || user?.photoUrl || user?.avatarUrl || user?.avatar || "";
}

function AvatarButton({ user: userProp, compact = false }) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const resolvedUser = userProp || authUser;
  const photo = getPhoto(resolvedUser);

  return (
    <button
      type="button"
      onClick={() => navigate("/profile")}
      className={[
        "shrink-0 overflow-hidden rounded-full border-[2px] border-white bg-white shadow-[0_8px_22px_rgba(15,23,42,0.07)] transition active:scale-95",
        compact ? "h-10 w-10" : "h-12 w-12",
      ].join(" ")}
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
        <div className="flex h-full w-full items-center justify-center bg-[#176B3A] text-[14px] font-black text-white">
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
  variant = "page",
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

  if (variant === "brand") {
    return (
      <header
        className={[
          "Mb-2 flex items-center justify-between pt-[max(2px,env(safe-area-inset-top))]",
          className,
        ].join(" ")}
      >
        <Link to="/feed" className="flex items-center pl-1" aria-label="Troco">
          <img
            src="/logo.png"
            alt="Troco"
            className="h-auto w-[102px] object-contain"
          />
        </Link>

        <div className="flex shrink-0 items-center gap-2 pr-1">
          {actions}

          {showNotifications && (
            <div className="[&_button]:h-10 [&_button]:w-10 [&_button]:rounded-full [&_button]:border-[#ECE4D8] [&_button]:bg-white/92 [&_button]:text-[#16A085] [&_button]:shadow-[0_6px_16px_rgba(15,23,42,0.035)]">
              <NotificationButton />
            </div>
          )}

          {showAvatar && <AvatarButton user={user} compact />}
        </div>
      </header>
    );
  }

  return (
    <header className={["troco-page-header", compact ? "mb-3" : "mb-5", className].join(" ")}>
      <div className="flex min-h-[44px] items-start justify-between gap-3">
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
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A085]">
                  {eyebrow}
                </p>
              )}

              {title && (
                <h1 className="troco-soft-title mt-0.5 text-[28px] font-extrabold leading-[0.94] tracking-[-0.055em] text-[#102033] md:text-[31px]">
                  {title}
                </h1>
              )}

              {subtitle && (
                <p className="troco-soft-muted mt-1 max-w-[620px] text-[13px] font-medium leading-relaxed text-[#66758A]">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 pt-0.5">
          {right || (
            <>
              {actions}

              {showNotifications && (
                <div className="[&_button]:h-10 [&_button]:w-10 [&_button]:rounded-full [&_button]:border-white/85 [&_button]:bg-white/92 [&_button]:text-[#16A085] [&_button]:shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
                  <NotificationButton />
                </div>
              )}

              {showAvatar && <AvatarButton user={user} compact />}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
