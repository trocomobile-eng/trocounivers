import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
  { to: "/messages", label: "Messages", icon: MessageCircle },
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
    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-troco-primary text-[9px] font-black text-white shadow-[0_2px_6px_rgba(26,190,163,0.4)]">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function NavItem({ to, label, icon: Icon, badge = 0 }) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <motion.span
          whileTap={{ scale: 0.84 }}
          animate={isActive ? { scale: 1.04 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          className={[
            "relative flex h-[42px] min-w-[52px] flex-col items-center justify-center rounded-[16px] px-2 text-[10.5px] font-bold",
            isActive
              ? "bg-troco-primary/10 text-troco-primary-600"
              : "text-slate-400",
          ].join(" ")}
        >
          <span className="relative">
            <motion.span
              animate={isActive ? { y: -1 } : { y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="block"
            >
              <Icon size={18} strokeWidth={isActive ? 2.6 : 2.0} className={isActive ? "text-troco-primary" : ""} />
            </motion.span>
            <Badge count={badge} />
          </span>
          <span className={["mt-[2px]", isActive ? "font-extrabold text-troco-primary-600" : ""].join(" ")}>{label}</span>
        </motion.span>
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
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[520px] items-end justify-center px-0 pb-0 lg:hidden"
    >
      <div className="flex h-[calc(58px+env(safe-area-inset-bottom,0px))] w-full items-start justify-between rounded-t-[22px] border-x border-t border-[#EEF2F2] bg-white/90 px-3 pb-[env(safe-area-inset-bottom,0px)] pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <NavItem to="/feed"      label="Explorer" icon={Compass}       />
        <NavItem to="/exchanges" label="Trocs"    icon={Repeat2}       badge={exchangesBadge} />

        <button
          type="button"
          onClick={() => navigate("/add")}
          className="mx-1 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[13px] bg-troco-primary text-white shadow-[0_4px_14px_rgba(26,190,163,0.35)] transition active:scale-95"
          aria-label="Publier"
        >
          <Plus size={22} strokeWidth={2.6} />
        </button>

        <NavItem to="/messages" label="Messages" icon={MessageCircle} badge={messagesBadge} />
        <NavItem to="/profile"  label="Profil" icon={UserRound}     />
      </div>
    </nav>
  );
}
