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
        "bg-white",
        leaving ? "animate-[splashLeave_600ms_ease-in-out_forwards]" : "",
      ].join(" ")}
    >
      {/* Halo vert très doux */}
      <div className="pointer-events-none absolute h-[500px] w-[500px] rounded-full bg-emerald-100/60 blur-[100px]" />

      {/* Crocodile de l'icône — mix-blend-mode supprime le fond blanc */}
      <img
        src="/icon-512.png"
        alt="Troco"
        className="relative z-10 w-[140px]"
        style={{
          mixBlendMode: "multiply",
          animation: "logoIn 700ms cubic-bezier(.16,1,.3,1) both",
        }}
      />

      {/* Nom */}
      <img
        src={TrocoWord}
        alt="Troco"
        className="relative z-10 mt-4 w-[120px]"
        style={{ animation: "logoIn 700ms cubic-bezier(.16,1,.3,1) 120ms both" }}
      />

      {/* Spinner */}
      <div className="relative z-10 mt-10" style={{ animation: "logoIn 400ms ease-out 500ms both" }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ animation: "spin 1s linear infinite" }}>
          <circle cx="14" cy="14" r="11" stroke="#D1FAE5" strokeWidth="2.5" />
          <path d="M14 3 A11 11 0 0 1 25 14" stroke="#22C58B" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
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
