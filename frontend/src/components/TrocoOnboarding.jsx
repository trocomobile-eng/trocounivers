import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  HeartHandshake,
  MapPin,
  Repeat2,
  Sparkles,
} from "lucide-react";

import slide1 from "../assets/onboarding/onboarding_slide_1.png";
import slide2 from "../assets/onboarding/onboarding_slide_2.png";
import slide3 from "../assets/onboarding/onboarding_slide_3.png";
import slide4 from "../assets/onboarding/onboarding_slide_4.png";
import { useGeolocation } from "../hooks/useGeolocation";

function LanguageSwitcher({ dark = false }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("en") ? "en" : "fr";
  function change(lang) {
    i18n.changeLanguage(lang);
    try { localStorage.setItem("troco-lang", lang); } catch {}
  }
  return (
    <div className={["flex items-center gap-1 rounded-full p-1", dark ? "bg-white/15" : "border border-[#E4ECE8] bg-white/80 backdrop-blur-sm"].join(" ")}>
      {["fr", "en"].map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => change(lang)}
          className={[
            "rounded-full px-3 py-1 text-[12px] font-black uppercase tracking-[0.06em] transition",
            current === lang
              ? dark
                ? "bg-white/25 text-white"
                : "bg-[#1ABEA3] text-white shadow-[0_4px_12px_rgba(26,190,163,0.25)]"
              : dark
                ? "text-white/60 hover:text-white"
                : "text-slate-500 hover:text-[#1ABEA3]",
          ].join(" ")}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="rounded-full border border-[#E4ECE8] bg-white/80 px-3 py-1.5 text-[11px] font-black text-slate-600 backdrop-blur-sm">
      {children}
    </span>
  );
}

function GeoScreen({ onDone }) {
  const { status, requesting, request } = useGeolocation();

  async function handleAllow() {
    await request();
    onDone();
  }

  return (
    <>
      {/* Mobile */}
      <div className="flex h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#071420] px-6 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(32px,env(safe-area-inset-top))] lg:hidden">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1ABEA3]/15">
          <MapPin size={36} className="text-[#1ABEA3]" strokeWidth={2} />
        </div>
        <h2 className="mt-6 text-center text-[26px] font-black leading-[1.05] tracking-[-0.05em] text-white">
          Autour de toi
        </h2>
        <p className="mt-3 text-center text-[14px] font-medium leading-[1.55] text-white/60">
          Active ta position pour voir les objets disponibles près de toi et trouver des troconautes dans ton quartier.
        </p>
        <div className="mt-8 flex w-full max-w-[320px] flex-col gap-3">
          <button
            type="button"
            onClick={handleAllow}
            disabled={requesting}
            className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-[#1ABEA3] to-[#36C982] px-5 py-3.5 text-[15px] font-black text-white shadow-[0_10px_28px_rgba(26,190,163,0.28)] transition active:scale-[0.97] disabled:opacity-60"
          >
            <MapPin size={17} strokeWidth={2.3} />
            {requesting ? "Activation…" : "Activer ma position"}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="py-3 text-[13px] font-black text-white/40 transition hover:text-white/60"
          >
            Passer cette étape
          </button>
        </div>
        {status === "denied" && (
          <p className="mt-4 text-center text-[12px] font-medium text-rose-400">
            Accès refusé — active la localisation dans les réglages de ton navigateur.
          </p>
        )}
      </div>

      {/* Desktop */}
      <main className="hidden min-h-screen items-center justify-center bg-[#F8FAF9] lg:flex">
        <div className="flex max-w-[420px] flex-col items-center px-8 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#F0FAF7]">
            <MapPin size={42} className="text-[#1ABEA3]" strokeWidth={1.8} />
          </div>
          <h2 className="mt-6 text-[32px] font-black leading-[1.05] tracking-[-0.05em] text-[#081225]">
            Autour de toi
          </h2>
          <p className="mt-3 text-[15px] font-medium leading-[1.6] text-[#64748B]">
            Active ta position pour voir les objets disponibles près de toi et trouver des troconautes dans ton quartier.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={handleAllow}
              disabled={requesting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-[#1ABEA3] to-[#36C982] px-8 py-3.5 text-[15px] font-black text-white shadow-[0_14px_36px_rgba(26,190,163,0.28)] transition hover:shadow-[0_18px_44px_rgba(26,190,163,0.36)] active:scale-[0.98] disabled:opacity-60"
            >
              <MapPin size={17} strokeWidth={2.3} />
              {requesting ? "Activation…" : "Activer ma position"}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="py-2 text-[13px] font-black text-[#94a3b8] transition hover:text-[#64748B]"
            >
              Passer cette étape
            </button>
          </div>
          {status === "denied" && (
            <p className="mt-4 text-[12px] font-medium text-rose-500">
              Accès refusé — active la localisation dans les réglages de ton navigateur.
            </p>
          )}
        </div>
      </main>
    </>
  );
}

export default function TrocoOnboarding({ onDone, onSkip }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [showGeo, setShowGeo] = useState(false);

  const slides = useMemo(
    () => [
      {
        eyebrow: t("onboarding.slides.discovery.eyebrow"),
        title: t("onboarding.slides.discovery.title"),
        text: t("onboarding.slides.discovery.text"),
        image: slide1,
        icon: Sparkles,
        chips: [
          t("onboarding.chips.sneakers"),
          t("onboarding.chips.vinyl"),
          t("onboarding.chips.photo"),
          t("onboarding.chips.lamp"),
        ],
      },
      {
        eyebrow: t("onboarding.slides.unexpected.eyebrow"),
        title: t("onboarding.slides.unexpected.title"),
        text: t("onboarding.slides.unexpected.text"),
        image: slide2,
        icon: Repeat2,
        chips: [
          t("onboarding.chips.book"),
          t("onboarding.chips.plant"),
          t("onboarding.chips.jacket"),
          t("onboarding.chips.guitar"),
        ],
      },
      {
        eyebrow: t("onboarding.slides.guided.eyebrow"),
        title: t("onboarding.slides.guided.title"),
        text: t("onboarding.slides.guided.text"),
        image: slide3,
        icon: HeartHandshake,
        chips: [
          t("onboarding.chips.suggest"),
          t("onboarding.chips.add"),
          t("onboarding.chips.adjust"),
          t("onboarding.chips.validate"),
        ],
      },
      {
        eyebrow: t("onboarding.slides.local.eyebrow"),
        title: t("onboarding.slides.local.title"),
        text: t("onboarding.slides.local.text"),
        image: slide4,
        icon: MapPin,
        chips: [
          t("onboarding.chips.cafe"),
          t("onboarding.chips.local"),
          t("onboarding.chips.human"),
          t("onboarding.chips.real"),
        ],
      },
    ],
    [t]
  );

  const slide = slides[index];
  const Icon = slide.icon;
  const isLast = index === slides.length - 1;
  const progress = ((index + 1) / slides.length) * 100;

  if (showGeo) return <GeoScreen onDone={onDone} />;

  function next() {
    if (isLast) { setShowGeo(true); return; }
    setIndex((v) => v + 1);
  }

  const progressDots = (
    <div className="flex items-center gap-2">
      {slides.map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setIndex(i)}
          aria-label={t("onboarding.goToStep", { number: i + 1 })}
          className={[
            "h-2 rounded-full transition-all duration-300",
            i === index ? "w-7 bg-[#1ABEA3]" : "w-2 bg-slate-200 hover:bg-slate-300",
          ].join(" ")}
        />
      ))}
    </div>
  );

  return (
    <>
      {/* ── MOBILE ──────────────────────────────────────────────── */}
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#071420] lg:hidden">

        {/* Full-bleed image */}
        <div className="relative" style={{ height: "46dvh" }}>
          <img
            key={slide.image}
            src={slide.image}
            alt=""
            className="h-full w-full object-cover"
            draggable="false"
          />
          {/* gradient top for header */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/30" />

          {/* Header */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-[max(16px,env(safe-area-inset-top))]">
            <img src="/logo.png" alt="Troco" className="h-7 w-auto object-contain brightness-0 invert" />
            <div className="flex items-center gap-2">
              <LanguageSwitcher dark />
              <button
                type="button"
                onClick={onSkip}
                className="rounded-full bg-black/30 px-4 py-2 text-[13px] font-black text-white/85 backdrop-blur-sm transition active:scale-95"
              >
                {t("onboarding.skip")}
              </button>
            </div>
          </div>

          {/* Eyebrow badge over image */}
          <div className="absolute bottom-5 left-5 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.18)] backdrop-blur-md">
            <Icon size={13} className="text-[#1ABEA3]" strokeWidth={2.5} />
            <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#0d1b2a]">
              {slide.eyebrow}
            </span>
          </div>
        </div>

        {/* Content drawer */}
        <div className="relative -mt-5 flex flex-1 flex-col rounded-t-[32px] bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />

          <h1 className="text-[24px] font-black leading-[1.02] tracking-[-0.05em] text-[#081225]">
            {slide.title}
          </h1>
          <p className="mt-2 text-[13.5px] font-medium leading-[1.55] text-[#64748B]">
            {slide.text}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {slide.chips.map((chip) => (
              <Chip key={chip}>{chip}</Chip>
            ))}
          </div>

          <div className="flex-1" />

          <div className="mt-4">
            <div className="mb-1 h-[3px] overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1ABEA3] to-[#36C982] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2.5 mb-3 flex items-center justify-between">
              {progressDots}
              <span className="text-[12px] font-black text-slate-300">
                {index + 1}/{slides.length}
              </span>
            </div>
            <button
              type="button"
              onClick={next}
              className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-[#1ABEA3] to-[#36C982] px-5 py-3.5 text-[15px] font-black text-white shadow-[0_10px_28px_rgba(26,190,163,0.28)] transition active:scale-[0.97]"
            >
              {isLast ? t("onboarding.start") : t("onboarding.continue")}
              <ArrowRight size={18} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>

      {/* ── DESKTOP ─────────────────────────────────────────────── */}
      <main className="hidden min-h-screen overflow-hidden bg-[#F8FAF9] text-[#081225] lg:block">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 top-0 h-[400px] w-[400px] rounded-full bg-cyan-100/20 blur-[140px]" />
          <div className="absolute -right-32 top-[200px] h-[440px] w-[440px] rounded-full bg-emerald-100/20 blur-[150px]" />
        </div>

        <div className="relative mx-auto flex h-screen max-w-6xl flex-col px-8 pb-6 pt-[max(16px,env(safe-area-inset-top))]">

          {/* Nav */}
          <header className="flex items-center justify-between">
            <img src="/logo.png" alt="Troco" className="h-auto w-[100px] object-contain" />
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={onSkip}
                className="rounded-full border border-[#E4ECE8] bg-white px-5 py-2 text-[13px] font-black text-[#344256] shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition hover:border-[#C0D5CE] active:scale-95"
              >
                {t("onboarding.skip")}
              </button>
            </div>
          </header>

          {/* Main content */}
          <section className="grid flex-1 grid-cols-[1fr_1fr] items-center gap-10 py-5 overflow-hidden">

            {/* Image */}
            <div className="relative h-full max-h-[calc(100vh-130px)]">
              <div className="absolute -inset-4 rounded-[50px] bg-[#1ABEA3]/5 blur-3xl" />
              <div className="relative h-full overflow-hidden rounded-[36px] shadow-[0_28px_80px_rgba(15,23,42,0.14)]">
                <img
                  key={slide.image}
                  src={slide.image}
                  alt=""
                  className="h-full w-full object-cover"
                  draggable="false"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md">
                    <Icon size={15} className="text-[#1ABEA3]" strokeWidth={2.5} />
                    <span className="text-[12px] font-black uppercase tracking-[0.12em] text-[#0d1b2a]">
                      {slide.eyebrow}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1ABEA3]">
                {index + 1} / {slides.length}
              </p>

              <h1 className="mt-3 text-[38px] font-black leading-[1.0] tracking-[-0.05em] text-[#081225] xl:text-[46px]">
                {slide.title}
              </h1>

              <p className="mt-3 max-w-[380px] text-[16px] font-medium leading-[1.6] text-[#64748B]">
                {slide.text}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {slide.chips.map((chip) => (
                  <Chip key={chip}>{chip}</Chip>
                ))}
              </div>

              <div className="mt-7">
                <div className="mb-3 h-[3px] overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#1ABEA3] to-[#36C982] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mb-4 flex items-center justify-between">
                  {progressDots}
                </div>

                <button
                  type="button"
                  onClick={next}
                  className="inline-flex h-12 items-center gap-2 rounded-[20px] bg-gradient-to-r from-[#1ABEA3] to-[#36C982] px-8 text-[15px] font-black text-white shadow-[0_14px_36px_rgba(26,190,163,0.28)] ring-1 ring-white/20 transition hover:shadow-[0_18px_44px_rgba(26,190,163,0.36)] active:scale-[0.98]"
                >
                  {isLast ? t("onboarding.start") : t("onboarding.continue")}
                  <ArrowRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
