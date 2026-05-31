import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Compass, MessageCircle, Plus, Repeat2, UserRound } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const LINKS_LEFT = [
  { to: "/feed",      label: "Explorer", icon: Compass    },
  { to: "/exchanges", label: "Trocs",    icon: Repeat2    },
];

const LINKS_RIGHT = [
  { to: "/messages", label: "Chat",   icon: MessageCircle },
  { to: "/profile",  label: "Profil", icon: UserRound     },
];

function useBadges() {
  const { user } = useAuth();
  const [exchangesBadge, setExchangesBadge] = useState(0);
  const [messagesBadge, setMessagesBadge]   = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    // Échanges nécessitant attention
    const qExchanges = query(
      collection(db, "exchanges"),
      where("participants", "array-contains", user.uid),
      where("needsAttentionFor", "==", user.uid)
    );
    const unsubExchanges = onSnapshot(qExchanges, (snap) => {
      setExchangesBadge(snap.size);
    });

    // Messages non lus
    const qMessages = query(
      collection(db, "exchanges"),
      where("participants", "array-contains", user.uid),
      where("needsAttentionFor", "==", user.uid),
      where("notificationType", "==", "chat_message")
    );
    const unsubMessages = onSnapshot(qMessages, (snap) => {
      setMessagesBadge(snap.size);
    });

    return () => { unsubExchanges(); unsubMessages(); };
  }, [user?.uid]);

  return { exchangesBadge, messagesBadge };
}

function Badge({ count }) {
  if (!count) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1ABEA3] text-[9px] font-black text-white shadow-[0_2px_6px_rgba(26,190,163,0.4)]">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function NavItem({ to, label, icon: Icon, badge = 0 }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "relative flex h-[46px] min-w-[54px] flex-col items-center justify-center rounded-[18px] px-2 text-[11px] font-extrabold transition-all duration-200",
          isActive
            ? "bg-gradient-to-br from-[#1ABEA3] to-[#36C982] text-white shadow-[0_6px_16px_rgba(26,190,163,0.22)] scale-[1.06]"
            : "text-slate-400 hover:text-slate-600 active:scale-95",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative">
            <Icon
              size={19}
              strokeWidth={isActive ? 2.5 : 2.1}
              className={isActive ? "drop-shadow-sm" : ""}
            />
            <Badge count={badge} />
          </span>
          <span className="mt-[2px]">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function BottomNav() {
  const navigate = useNavigate();
  const { exchangesBadge, messagesBadge } = useBadges();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[520px] items-end justify-center px-3 pb-[max(8px,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="flex h-[68px] w-full items-center justify-between rounded-[28px] border border-[#E4ECE8] bg-white px-4 shadow-[0_-2px_20px_rgba(15,23,42,0.08)]">
        <NavItem to="/feed"      label="Explorer" icon={Compass}       />
        <NavItem to="/exchanges" label="Trocs"    icon={Repeat2}       badge={exchangesBadge} />

        <button
          type="button"
          onClick={() => navigate("/add")}
          className="mx-1 flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#1ABEA3] to-[#36C982] text-white shadow-[0_6px_18px_rgba(26,190,163,0.28)] transition active:scale-95"
          aria-label="Publier"
        >
          <Plus size={24} strokeWidth={2.6} />
        </button>

        <NavItem to="/messages" label="Chat"   icon={MessageCircle} badge={messagesBadge} />
        <NavItem to="/profile"  label="Profil" icon={UserRound}     />
      </div>
    </nav>
  );
}
