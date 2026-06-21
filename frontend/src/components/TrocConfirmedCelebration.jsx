import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getItemImage, getDisplayItemType } from "../utils/format";

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: 5 + Math.random() * 90,
  y: 10 + Math.random() * 80,
  size: 4 + Math.random() * 7,
  delay: Math.random() * 1.8,
  duration: 2.5 + Math.random() * 2,
  color: ["#36C982", "#1ABEA3", "#a8f5d2", "#fff", "#6ee7b7"][i % 5],
  drift: (Math.random() - 0.5) * 60,
}));

function Particle({ p }) {
  return (
    <motion.span
      style={{
        position: "absolute",
        left: `${p.x}%`,
        top: `${p.y}%`,
        width: p.size,
        height: p.size,
        borderRadius: "50%",
        background: p.color,
        opacity: 0,
        pointerEvents: "none",
      }}
      animate={{
        opacity: [0, 0.85, 0.85, 0],
        y: [0, -40, -90, -130],
        x: [0, p.drift * 0.4, p.drift, p.drift * 1.2],
        scale: [0.4, 1.2, 0.9, 0.2],
      }}
      transition={{
        delay: p.delay,
        duration: p.duration,
        repeat: Infinity,
        repeatDelay: p.delay * 0.5 + 0.5,
        ease: "easeOut",
      }}
    />
  );
}

function ItemCard({ item, label }) {
  const image = getItemImage(item);
  const title = getDisplayItemType(item) || item?.title || "Objet";
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex flex-col items-center gap-2"
    >
      <div className="h-[88px] w-[88px] overflow-hidden rounded-[20px] border-2 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        {image
          ? <img src={image} alt={title} className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-center justify-center bg-white/10 text-3xl">📦</div>
        }
      </div>
      <p className="max-w-[90px] text-center text-[11px] font-bold leading-tight text-white/90">{title}</p>
    </motion.div>
  );
}

export default function TrocConfirmedCelebration({ open, onClose, requestedItem, offeredItem, exchangeId, isBothConfirmed = false }) {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    if (open) {
      timerRef.current = setTimeout(onClose, 6000);
    }
    return () => clearTimeout(timerRef.current);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "linear-gradient(160deg, #0d3526 0%, #0f5c3a 45%, #0d4a30 100%)" }}
        >
          {/* Overlay sombre en bas pour le CTA */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Fermer */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-12 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"
          >
            <X size={16} strokeWidth={2.3} />
          </button>

          {/* Particules */}
          <div className="pointer-events-none absolute inset-0">
            {PARTICLES.map((p) => <Particle key={p.id} p={p} />)}
          </div>

          {/* Contenu centré */}
          <div className="relative flex flex-col items-center px-8 text-center">

            {/* Objets + icône handshake */}
            <div className="mb-8 flex items-center gap-4">
              <ItemCard item={requestedItem} />

              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 280, damping: 18 }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_0_40px_rgba(54,201,130,0.6)]"
              >
                <span className="text-2xl">🤝</span>
              </motion.div>

              <ItemCard item={offeredItem} />
            </div>

            {/* Titre */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="text-[32px] font-black tracking-[-0.04em] text-white"
            >
              {isBothConfirmed ? "Troc terminé ! 🎉" : "Troc confirmé !"}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.45 }}
              className="mt-3 text-[15px] font-medium leading-relaxed text-white/75"
            >
              {isBothConfirmed
                ? "Merci ! Vous participez à une économie plus locale et durable."
                : "Vous avez trouvé un accord.\nÀ vous de jouer 🌿"}
            </motion.p>

            {/* CTA */}
            {!isBothConfirmed && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.45 }}
                type="button"
                onClick={() => { onClose(); if (exchangeId) navigate(`/exchanges/${exchangeId}`); }}
                className="mt-10 flex h-[52px] w-full max-w-[280px] items-center justify-center gap-2 rounded-full bg-white text-[15px] font-black text-[#0d3526] shadow-[0_12px_32px_rgba(0,0,0,0.25)] transition active:scale-95"
              >
                <CalendarDays size={17} strokeWidth={2.3} />
                Planifier la rencontre
              </motion.button>
            )}

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
              type="button"
              onClick={onClose}
              className="mt-4 text-[13px] font-semibold text-white/55"
            >
              Voir les détails du troc
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
