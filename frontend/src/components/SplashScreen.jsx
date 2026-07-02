import { useEffect, useState } from "react";
import TrocoWord from "../assets/logo/troco-word.png";
import imgLampe from "../assets/landing/lampe-vintage.png";
import imgPhoto from "../assets/landing/appareil-photo.png";
import imgLivre from "../assets/landing/livre-ancien.png";
import imgObj1 from "../assets/examples/obj1ex.png";
import imgObj2 from "../assets/examples/obj2ex.png";

const TOTAL_DURATION = 3200;
const LEAVE_START = 2500;

// Objets flottants : position relative au centre, taille, délai d'animation
const OBJECTS = [
  { src: imgLampe,  alt: "Lampe",   x: -148, y: -148, size: 88,  delay: 0     },
  { src: imgPhoto,  alt: "Appareil",x:  130, y: -130, size: 76,  delay: 120   },
  { src: imgObj1,   alt: "Objet",   x: -165, y:   20, size: 70,  delay: 60    },
  { src: imgObj2,   alt: "Objet",   x:  155, y:   40, size: 68,  delay: 200   },
  { src: imgLivre,  alt: "Livre",   x:  -90, y:  148, size: 72,  delay: 80    },
];

function FloatingObject({ src, alt, x, y, size, delay }) {
  return (
    <img
      src={src}
      alt={alt}
      draggable="false"
      className="pointer-events-none absolute select-none object-contain drop-shadow-[0_8px_20px_rgba(15,23,42,0.12)]"
      style={{
        width: size,
        height: size,
        left: `calc(50% + ${x}px - ${size / 2}px)`,
        top: `calc(50% + ${y}px - ${size / 2}px)`,
        animation: `floatObj 3600ms ease-in-out ${delay}ms infinite, fadeInObj 700ms ease-out ${delay + 300}ms both`,
      }}
    />
  );
}

function LoadingDots({ step }) {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full transition-all duration-300"
          style={{ background: i === step % 3 ? "#22C58B" : "#CBD5E1" }}
        />
      ))}
    </div>
  );
}

export default function SplashScreen({ onDone }) {
  const [leaving, setLeaving] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setStep((s) => s + 1), 600);
    const leaveTimer = window.setTimeout(() => setLeaving(true), LEAVE_START);
    const doneTimer = window.setTimeout(() => onDone?.(), TOTAL_DURATION);
    return () => {
      clearInterval(interval);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={[
        "fixed inset-0 z-[9999] overflow-hidden",
        "bg-[linear-gradient(180deg,#edfaf4_0%,#f5fffc_55%,#ffffff_100%)]",
        leaving ? "animate-[splashLeave_700ms_cubic-bezier(.22,1,.36,1)_forwards]" : "",
      ].join(" ")}
    >
      {/* Halos de fond */}
      <div className="pointer-events-none absolute left-[-100px] top-[-80px] h-[380px] w-[380px] rounded-full bg-emerald-200/30 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-[-80px] right-[-80px] h-[340px] w-[340px] rounded-full bg-sky-200/25 blur-[80px]" />

      {/* Objets flottants */}
      {OBJECTS.map((obj, i) => (
        <FloatingObject key={i} {...obj} />
      ))}

      {/* Silhouette paysage bas */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[90px] opacity-[0.07]">
        <svg viewBox="0 0 390 90" preserveAspectRatio="xMidYMax meet" className="h-full w-full">
          <path d="M0,90 L0,60 Q20,40 40,55 Q55,30 70,50 Q85,20 100,45 Q115,10 130,40 Q145,25 160,42 Q175,15 190,38 Q205,5 220,35 Q235,18 250,40 Q265,28 280,45 Q295,15 310,42 Q325,30 340,50 Q355,38 370,52 Q380,45 390,55 L390,90 Z" fill="#166534"/>
        </svg>
      </div>

      {/* Contenu centré */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ animation: "fadeInContent 600ms ease-out 200ms both" }}
      >
        {/* Logo */}
        <img
          src={TrocoWord}
          alt="Troco"
          className="w-[200px] drop-shadow-[0_8px_24px_rgba(15,23,42,0.10)]"
          style={{ animation: "logoIn 800ms cubic-bezier(.16,1,.3,1) both" }}
        />

        {/* Tagline */}
        <div
          className="mt-4 text-center"
          style={{ animation: "fadeInContent 600ms ease-out 400ms both" }}
        >
          <p className="text-[17px] font-semibold text-slate-600">
            Les objets circulent
          </p>
          <p className="text-[17px] font-black text-[#167a58]">
            autour de vous.
          </p>
        </div>

        {/* Spinner */}
        <div
          className="mt-8"
          style={{ animation: "fadeInContent 400ms ease-out 700ms both" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            style={{ animation: "spin 1.1s linear infinite" }}
          >
            <circle cx="14" cy="14" r="11" stroke="#E2F5EC" strokeWidth="3" />
            <path
              d="M14 3 A11 11 0 0 1 25 14"
              stroke="#22C58B"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Dots */}
        <div
          className="mt-4"
          style={{ animation: "fadeInContent 400ms ease-out 800ms both" }}
        >
          <LoadingDots step={step} />
        </div>

        {/* Texte bas */}
        <p
          className="mt-4 text-[12px] font-medium text-slate-400"
          style={{ animation: "fadeInContent 400ms ease-out 900ms both" }}
        >
          On prépare vos échanges…
        </p>
      </div>

      <style>{`
        @keyframes floatObj {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes fadeInObj {
          from { opacity: 0; transform: scale(0.82) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes logoIn {
          from { opacity: 0; transform: scale(0.88) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeInContent {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes splashLeave {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.04); }
        }
      `}</style>
    </div>
  );
}
