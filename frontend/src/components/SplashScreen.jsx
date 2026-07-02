import { useEffect, useState } from "react";
import TrocoWord from "../assets/logo/troco-word.png";

const TOTAL_DURATION = 2200;
const LEAVE_START   = 1600;

export default function SplashScreen({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setLeaving(true), LEAVE_START);
    const t2 = window.setTimeout(() => onDone?.(), TOTAL_DURATION);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className={[
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center",
        "bg-[linear-gradient(160deg,#f0fdf7_0%,#ffffff_100%)]",
        leaving ? "animate-[splashLeave_600ms_ease-in-out_forwards]" : "",
      ].join(" ")}
    >
      {/* Halo vert très doux */}
      <div className="pointer-events-none absolute h-[500px] w-[500px] rounded-full bg-emerald-100/60 blur-[100px]" />

      {/* Icône app — le vrai crocodile */}
      <img
        src="/icon-512.png"
        alt="Troco"
        className="relative z-10 w-[120px] rounded-[28px] shadow-[0_20px_50px_rgba(22,120,68,0.20)]"
        style={{ animation: "logoIn 700ms cubic-bezier(.16,1,.3,1) both" }}
      />

      {/* Nom */}
      <img
        src={TrocoWord}
        alt="Troco"
        className="relative z-10 mt-5 w-[120px]"
        style={{ animation: "logoIn 700ms cubic-bezier(.16,1,.3,1) 120ms both" }}
      />

      <style>{`
        @keyframes logoIn {
          from { opacity: 0; transform: scale(0.90) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes splashLeave {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
