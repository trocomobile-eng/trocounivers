import { useEffect, useState } from "react";
import TrocoWord from "../assets/logo/troco-word.png";
import LogoCroco from "../assets/logo/logocroco.png";

const TOTAL_DURATION = 4200;
const LEAVE_START   = 3600;

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
        leaving ? "animate-[splashLeave_600ms_ease-in-out_forwards]" : "",
      ].join(" ")}
      style={{ backgroundColor: "#e8f7ef" }}
    >
      <div className="relative z-10 w-[280px]" style={{ animation: "logoSpin 3500ms cubic-bezier(.05,1,.3,1) both" }}>
        <img src={LogoCroco} alt="Troco" className="w-full" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.85) 50%, transparent 70%)",
            backgroundSize: "250% 100%",
            maskImage: `url(${LogoCroco})`,
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskImage: `url(${LogoCroco})`,
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            animation: "sheen 1600ms ease-out 2800ms both",
          }}
        />
      </div>

      <img
        src={TrocoWord}
        alt="Troco"
        className="relative z-10 -mt-10 w-[150px]"
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
        @keyframes logoSpin {
          0%   { opacity: 0; transform: translateX(-120px) scale(0.55) rotate(-360deg); }
          35%  { opacity: 1; }
          100% { opacity: 1; transform: translateX(0) scale(1) rotate(0deg); }
        }
        @keyframes sheen {
          from { background-position: 200% center; opacity: 0; }
          20%  { opacity: 1; }
          to   { background-position: -50% center; opacity: 0; }
        }
        @keyframes splashLeave {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
