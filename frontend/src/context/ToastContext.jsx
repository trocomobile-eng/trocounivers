import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { CheckCircle2, CalendarDays, MapPin, MessageCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext({ show: () => {} });

export function useToast() { return useContext(ToastContext); }

// ─── Toast UI ─────────────────────────────────────────────────────────────────

const ICONS = {
  success: CheckCircle2,
  calendar: CalendarDays,
  place: MapPin,
  message: MessageCircle,
};

function Toast({ id, icon = "success", title, text, to, onDismiss }) {
  const navigate = useNavigate();
  const Icon = ICONS[icon] || CheckCircle2;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 5000);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  return (
    <div
      className="flex w-full max-w-[360px] items-start gap-3 rounded-[18px] border border-[#E4ECE8] bg-white p-3.5 shadow-[0_8px_32px_rgba(15,23,42,0.14)] animate-[trocoFadeUp_280ms_ease_both]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0FAF7] text-[#1ABEA3]">
        <Icon size={17} strokeWidth={2.2} />
      </span>
      <button
        type="button"
        onClick={() => { onDismiss(id); if (to) navigate(to); }}
        className="min-w-0 flex-1 text-left"
      >
        <p className="text-[13px] font-extrabold text-[#0d1b2a]">{title}</p>
        {text && <p className="mt-0.5 text-[11px] font-medium text-slate-400 line-clamp-1">{text}</p>}
      </button>
      <button type="button" onClick={() => onDismiss(id)} className="shrink-0 text-slate-300 hover:text-slate-500">
        <X size={15} />
      </button>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }) {
  const { user }    = useAuth();
  const [toasts, setToasts] = useState([]);
  const prevExchanges = useRef({});
  const idCounter = useRef(0);

  const show = useCallback((toast) => {
    const id = ++idCounter.current;
    setToasts((cur) => [...cur, { ...toast, id }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  // Écoute les exchanges en temps réel et affiche des toasts sur changement
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "exchanges"),
      where("participants", "array-contains", user.uid)
    );

    const isFirstLoad = { value: true };

    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "removed") return;
        const ex  = { id: change.doc.id, ...change.doc.data() };
        const prev = prevExchanges.current[ex.id];

        // Ignorer si c'est moi qui ai fait l'action
        if (ex.lastActionBy === user.uid) {
          prevExchanges.current[ex.id] = ex;
          return;
        }

        // Premier load — enregistrer sans toast
        if (isFirstLoad.value) {
          prevExchanges.current[ex.id] = ex;
          return;
        }

        // Nouveau exchange (quelqu'un me propose un troc)
        if (change.type === "added" && !prev) {
          const name = ex.senderId === user.uid
            ? ex.receiverName || "L'autre personne"
            : ex.senderName   || "L'autre personne";
          const title = ex.requestedItemTitle || ex.offeredItemTitle || "Troc";
          show({ icon: "message", title: `${name} te propose un troc !`, text: title, to: `/exchanges/${ex.id}` });
          prevExchanges.current[ex.id] = ex;
          return;
        }

        const title = ex.requestedItemTitle || ex.offeredItemTitle || "Troc";
        const name  = ex.senderId === user.uid
          ? ex.receiverName || "L'autre personne"
          : ex.senderName   || "L'autre personne";

        // Détecter le changement de statut
        if (prev?.status !== ex.status) {
          if (ex.status === "accepted")
            show({ icon: "success",   title: `${name} a accepté ton troc !`, text: title, to: `/exchanges/${ex.id}` });
          else if (ex.status === "scheduling_time")
            show({ icon: "calendar",  title: `${name} propose des horaires`, text: title, to: `/availability/${ex.id}` });
          else if (ex.status === "choosing_place")
            show({ icon: "place",     title: "Choisissez un lieu de rencontre", text: title, to: "/choose-place", state: { exchangeId: ex.id } });
          else if (ex.status === "meeting_confirmed")
            show({ icon: "success",   title: "Rencontre confirmée ! 🎉", text: title, to: `/exchanges/${ex.id}` });
          else if (ex.status === "chat_open")
            show({ icon: "message",   title: `${name} t'a envoyé un message`, text: title, to: `/exchanges/${ex.id}/chat` });
          else if (ex.status === "cancelled")
            show({ icon: "message",   title: `${name} a annulé le troc`, text: title, to: `/exchanges/${ex.id}` });
        }

        // Nouveau message
        if (ex.notificationType === "chat_message" && prev?.notificationType !== "chat_message") {
          show({ icon: "message", title: `${name} t'a envoyé un message`, text: title, to: `/exchanges/${ex.id}/chat` });
        }

        prevExchanges.current[ex.id] = ex;
      });

      isFirstLoad.value = false;
    });

    return () => unsub();
  }, [user?.uid, show]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}

      {/* Zone toasts — bas droite desktop, bas mobile */}
      <div className="fixed bottom-[90px] left-1/2 z-[9999] flex -translate-x-1/2 flex-col gap-2 px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
