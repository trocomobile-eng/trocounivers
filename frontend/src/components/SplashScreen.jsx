import { useEffect, useState } from "react";

import TrocoWord from "../assets/logo/troco-word.png";

// Splash simplifié :
// - une seule image : le logo / mot Troco
// - aucune deuxième image
// - aucune rotation
// - apparition lente avec zoom premium
// - halo doux derrière le logo
// - sortie avec léger zoom + fade

const TOTAL_DURATION = 3600;
const LEAVE_START = 2850;

export default function SplashScreen({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setLeaving(true), LEAVE_START);
    const doneTimer = window.setTimeout(() => onDone?.(), TOTAL_DURATION);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={[
        "fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden",
        "bg-[radial-gradient(circle_at_18%_12%,rgba(125,211,252,0.30),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(134,239,172,0.24),transparent_36%),radial-gradient(circle_at_50%_92%,rgba(16,185,129,0.12),transparent_44%),linear-gradient(180deg,#ecf9ff_0%,#f5fffb_52%,#ffffff_100%)]",
        leaving ? "animate-[splashLeave_750ms_cubic-bezier(.22,1,.36,1)_forwards]" : "",
      ].join(" ")}
    >
      {/* Halo large et doux derrière le logo */}
      <div className="pointer-events-none absolute h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.18),rgba(56,189,248,0.12)_46%,transparent_72%)] blur-[110px] animate-[haloPulse_5200ms_ease-in-out_infinite]" />

      {/* Lumières secondaires très subtiles */}
      <div className="pointer-events-none absolute left-[-140px] top-[-120px] h-[440px] w-[440px] rounded-full bg-sky-300/20 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[-160px] right-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-300/20 blur-[110px]" />

      {/* Logo principal */}
      <img
        src={TrocoWord}
        alt="Troco"
        className="relative z-10 w-[500px] max-w-[84vw] animate-[logoZoomIn_2300ms_cubic-bezier(.16,1,.3,1)_forwards]"
        style={{
          opacity: 0,
          filter: "drop-shadow(0 28px 64px rgba(15,23,42,0.14))",
        }}
      />

      <style>{`
        @keyframes haloPulse {
          0%, 100% {
            opacity: 0.88;
            transform: scale(0.98);
          }

          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }

        @keyframes logoZoomIn {
          0% {
            opacity: 0;
            transform: scale(0.76) translateY(10px);
            filter: blur(18px);
          }

          58% {
            opacity: 1;
            transform: scale(1.055) translateY(0);
            filter: blur(0);
          }

          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
        }

        @keyframes splashLeave {
          0% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
          }

          100% {
            opacity: 0;
            transform: scale(1.045);
            filter: blur(10px);
          }
        }
      `}</style>
    </div>
  );
}
