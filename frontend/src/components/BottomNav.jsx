import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Compass, MessageCircle, Plus, Repeat2, UserRound } from "lucide-react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { exchangeNeedsAttention } from "../exchangeUtils";
import { TrocoButton, TrocoCard } from "./UI";

const LINKS_LEFT = [
  { to: "/feed", label: "Explorer", icon: Compass },
  { to: "/exchanges", label: "Trocs", icon: Repeat2 },
];

const LINKS_RIGHT = [
  { to: "/messages", label: "Chat", icon: MessageCircle },
  { to: "/profile", label: "Profil", icon: UserRound },
];

function NavItem({ to, label, icon: Icon, badge = 0 }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex h-[42px] min-w-[52px] flex-col items-center justify-center rounded-[16px] px-2 text-[10.5px] font-bold transition",
          isActive
            ? "bg-gradient-to-br from-[#22c7e8] to-[#35d18f] text-white shadow-[0_8px_18px_rgba(20,184,166,0.16)]"
            : "text-[#2f6f68]",
        ].join(" ")
      }
    >
      <div className="relative">
        <Icon size={18} strokeWidth={2.1} />
        {badge > 0 && (
          <span className="troco-bottom-nav-badge absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#18A98E] px-0.5 text-[9px] font-black leading-none text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
      <span className="mt-[1px]">{label}</span>
    </NavLink>
  );
}

export default function BottomNav() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exchangeBadge, setExchangeBadge] = useState(0);
  const [messageBadge, setMessageBadge] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "exchanges"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let exCount = 0;
      let msgCount = 0;

      snapshot.docs.forEach((doc) => {
        const ex = { id: doc.id, ...doc.data() };
        const status = ex.status || "";
        if (["completed", "declined", "cancelled"].includes(status)) return;
        if (!exchangeNeedsAttention(ex, user.uid)) return;

        if (status === "chat_open" || ex.chatOpened || ex.chatOpen) {
          msgCount += 1;
        } else {
          exCount += 1;
        }
      });

      setExchangeBadge(exCount);
      setMessageBadge(msgCount);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[520px] items-end justify-center px-5 pb-[max(8px,env(safe-area-inset-bottom))] lg:hidden">
      <TrocoCard
        variant="plain"
        className="flex h-[64px] w-full items-center justify-between rounded-[24px] border border-white/75 bg-white/70 px-3.5 shadow-[0_-8px_24px_rgba(20,184,166,0.075)] backdrop-blur-sm"
      >
        {LINKS_LEFT.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            badge={item.to === "/exchanges" ? exchangeBadge : 0}
          />
        ))}

        <TrocoButton
          variant="plain"
          onClick={() => navigate("/add")}
          className="mx-1 flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[18px] bg-white text-[#0f8f7f] shadow-[0_8px_18px_rgba(20,184,166,0.10)] active:scale-95"
          aria-label="Publier"
        >
          <Plus size={25} strokeWidth={2.45} />
        </TrocoButton>

        {LINKS_RIGHT.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            badge={item.to === "/messages" ? messageBadge : 0}
          />
        ))}
      </TrocoCard>
    </nav>
  );
}
