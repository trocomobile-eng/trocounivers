import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Coffee,
  HeartHandshake,
  Image as ImageIcon,
  MapPin,
  Repeat2,
  Sparkles,
  UsersRound,
} from "lucide-react";

import slide1 from "../assets/onboarding/onboarding_slide_1.png";
import slide2 from "../assets/onboarding/onboarding_slide_2.png";
import slide3 from "../assets/onboarding/onboarding_slide_3.png";
import slide4 from "../assets/onboarding/onboarding_slide_4.png";

function LanguageSwitcher({ dark = false }) {
  const { i18n } = useTranslation();

  function changeLanguage(lang) {
    i18n.changeLanguage(lang);
    try { localStorage.setItem("troco-lang", lang); } catch {}
  }

  const current = i18n.language?.startsWith("en") ? "en" : "fr";

  const base = dark
    ? "rounded-full px-3 py-1.5 text-[12px] font-black uppercase transition"
    : "rounded-full px-3 py-1.5 text-[12px] font-black uppercase transition";

  const active = dark
    ? "bg-white/20 text-white backdrop-blur-sm"
    : "bg-[#0f9f9a] text-white shadow-[0_8px_20px_rgba(15,159,154,0.18)]";

  const inactive = dark
    ? "text-white/60"
    : "bg-white/82 text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.04)]";

  return (
    <div className="flex items-center gap-1">
      {["fr", "en"].map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => changeLanguage(lang)}
          className={[base, current === lang ? active : inactive].join(" ")}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Pill({ children }) {
  return (
    <span className="rounded-full border border-[#E4ECE8] bg-white/82 px-3 py-1.5 text-[11px] font-black text-slate-600 shadow-[0_4px_12px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      {children}
    </span>
  );
}

export default function TrocoOnboarding({ onDone, onSkip }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

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
  const progress = useMemo(() => ((index + 1) / slides.length) * 100, [index, slides.length]);

  function next() {
    if (isLast) { onDone?.(); return; }
    setIndex((v) => v + 1);
  }

  const dots = (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        {slides.map((_, dotIndex) => (
          <button
            key={dotIndex}
            type="button"
            onClick={() => setIndex(dotIndex)}
            className={[
              "h-2 rounded-full transition-all duration-300",
              dotIndex === index ? "w-7 bg-[#0f9f9a]" : "w-2 bg-slate-200",
            ].join(" ")}
            aria-label={t("onboarding.goToStep", { number: dotIndex + 1 })}
          />
        ))}
      </div>
      <span className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-400">
        {index + 1}/{slides.length}
      </span>
    </div>
  );

  return (
    <>
      {/* ── MOBILE layout ──────────────────────────────────────── */}
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#0d1b2a] lg:hidden">

        {/* Image zone (top ~47%) */}
        <div className="relative flex-shrink-0" style={{ height: "47dvh" }}>
          <img
            key={slide.image}
            src={slide.image}
            alt=""
            className="h-full w-full object-cover"
            draggable="false"
          />

          {/* Dark gradient top → transparent (for header legibility) */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/42 via-black/10 to-transparent" />

          {/* Header */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-[max(18px,env(safe-area-inset-top))]">
            <img
              src="/logo.png"
              alt="Troco"
              className="h-7 w-auto object-contain brightness-0 invert"
            />
            <div className="flex items-center gap-2">
              <LanguageSwitcher dark />
              <button
                type="button"
                onClick={onSkip}
                className="rounded-full bg-black/30 px-4 py-2 text-[13px] font-black text-white/90 backdrop-blur-sm transition active:scale-95"
              >
                {t("onboarding.skip")}
              </button>
            </div>
          </div>

          {/* Eyebrow badge */}
          <div className="absolute bottom-4 left-5 flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.14)] backdrop-blur-md">
            <Icon size={14} className="text-[#159b6b]" strokeWidth={2.5} />
            <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-700">
              {slide.eyebrow}
            </span>
          </div>
        </div>

        {/* White content drawer */}
        <div className="relative -mt-6 flex flex-1 flex-col overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-5">
          {/* Handle */}
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />

          {/* Text */}
          <h1 className="text-[26px] font-black leading-[1.0] tracking-[-0.05em] text-[#081225]">
            {slide.title}
          </h1>

          <p className="mt-3 text-[14px] font-medium leading-[1.58] text-slate-500">
            {slide.text}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {slide.chips.map((chip) => (
              <Pill key={chip}>{chip}</Pill>
            ))}
          </div>

          {/* Spacer */}
          <div className="min-h-[12px] flex-1" />

          {/* Progress bar + dots + CTA */}
          <div className="mt-4">
            <div className="mb-2 h-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#22C7B8] to-[#36C982] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mb-4">{dots}</div>

            <button
              type="button"
              onClick={next}
              className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-br from-[#22C7B8] to-[#36C982] px-5 py-4 text-[16px] font-black text-white shadow-[0_10px_24px_rgba(46,204,138,0.22)] transition active:scale-[0.97]"
            >
              {isLast ? t("onboarding.start") : t("onboarding.continue")}
              <ArrowRight size={20} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>

      {/* ── DESKTOP layout ─────────────────────────────────────── */}
      <main className="hidden min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_10%,rgba(125,211,252,0.10),transparent_35%),radial-gradient(circle_at_82%_18%,rgba(134,239,172,0.10),transparent_38%),radial-gradient(circle_at_50%_92%,rgba(16,185,129,0.06),transparent_42%),linear-gradient(180deg,#F5FAF8_0%,#F4FAF8_100%)] px-5 pb-7 pt-[max(22px,env(safe-area-inset-top))] text-[#081225] lg:block">
        <div className="mx-auto flex min-h-[calc(100vh-30px)] max-w-6xl flex-col">

          <header className="flex items-center justify-between">
            <img
              src="/logo.png"
              alt="Troco"
              className="h-auto w-[135px] object-contain drop-shadow-[0_7px_16px_rgba(46,204,138,0.10)]"
            />
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={onSkip}
                className="rounded-full border border-[#E4ECE8] bg-white/82 px-4 py-2 text-sm font-black text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.05)] backdrop-blur-[14px] transition active:scale-95"
              >
                {t("onboarding.skip")}
              </button>
            </div>
          </header>

          <section className="grid flex-1 grid-cols-[0.9fr_1.1fr] items-center gap-12 py-12">
            {/* Left: image */}
            <div className="relative">
              <div className="absolute -inset-3 rounded-[46px] bg-white/35 blur-2xl" />
              <div className="relative overflow-hidden rounded-[46px] border border-[#E4ECE8] bg-white shadow-[0_32px_90px_rgba(15,23,42,0.16)]">
                <img
                  src={slide.image}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                  draggable="false"
                />
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-[#E4ECE8] bg-white/82 px-3 py-2 shadow-[0_10px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                  <Icon size={17} className="text-[#159b6b]" strokeWidth={2.5} />
                  <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-700">
                    {slide.eyebrow}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: content card */}
            <div className="rounded-[42px] border border-[#E4ECE8] bg-white/88 p-10 shadow-[0_14px_40px_rgba(15,23,42,0.055)] backdrop-blur-xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E8F7EF] px-3 py-1.5 text-[12px] font-black uppercase tracking-[0.14em] text-[#22a06b]">
                <ImageIcon size={14} />
                {slide.eyebrow}
              </p>

              <h1 className="max-w-[620px] text-[64px] font-black leading-[0.96] tracking-[-0.055em]">
                {slide.title}
              </h1>

              <p className="mt-4 max-w-[380px] text-[19px] font-medium leading-[1.58] text-slate-600">
                {slide.text}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {slide.chips.map((chip) => (
                  <Pill key={chip}>{chip}</Pill>
                ))}
              </div>

              <div className="mt-7 h-2 overflow-hidden rounded-full bg-slate-200/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#22C7B8] to-[#36C982] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-5">{dots}</div>

              <div className="mt-7 space-y-3">
                <button
                  type="button"
                  onClick={next}
                  className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-gradient-to-br from-[#22C7B8] to-[#36C982] px-5 py-4 text-base font-black text-white shadow-[0_12px_24px_rgba(46,204,138,0.18)] transition active:scale-95"
                >
                  {isLast ? t("onboarding.start") : t("onboarding.continue")}
                  <ArrowRight size={20} strokeWidth={2.4} />
                </button>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-[20px] bg-white/82 px-2 py-3 text-[11px] font-black text-slate-500">
                    <UsersRound size={17} className="mx-auto mb-1 text-[#22a06b]" />
                    {t("onboarding.values.local")}
                  </div>
                  <div className="rounded-[20px] bg-white/82 px-2 py-3 text-[11px] font-black text-slate-500">
                    <Sparkles size={17} className="mx-auto mb-1 text-[#22a06b]" />
                    {t("onboarding.values.surprise")}
                  </div>
                  <div className="rounded-[20px] bg-white/82 px-2 py-3 text-[11px] font-black text-slate-500">
                    <Coffee size={17} className="mx-auto mb-1 text-[#22a06b]" />
                    {t("onboarding.values.human")}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
