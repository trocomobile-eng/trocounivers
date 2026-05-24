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

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  function changeLanguage(lang) {
    i18n.changeLanguage(lang);

    try {
      localStorage.setItem("troco-lang", lang);
    } catch {
      // ignore localStorage errors
    }
  }

  const currentLanguage = i18n.language?.startsWith("en") ? "en" : "fr";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => changeLanguage("fr")}
        className={[
          "rounded-full px-3 py-1.5 text-[12px] font-black uppercase transition",
          currentLanguage === "fr"
            ? "bg-[#0f9f9a] text-white shadow-[0_8px_20px_rgba(15,159,154,0.18)]"
            : "bg-white/80 text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.04)]",
        ].join(" ")}
      >
        FR
      </button>

      <button
        type="button"
        onClick={() => changeLanguage("en")}
        className={[
          "rounded-full px-3 py-1.5 text-[12px] font-black uppercase transition",
          currentLanguage === "en"
            ? "bg-[#0f9f9a] text-white shadow-[0_8px_20px_rgba(15,159,154,0.18)]"
            : "bg-white/80 text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.04)]",
        ].join(" ")}
      >
        EN
      </button>
    </div>
  );
}

function Pill({ children }) {
  return (
    <span className="rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[11px] font-black text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.045)] backdrop-blur-xl">
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
    if (isLast) {
      onDone?.();
      return;
    }

    setIndex((value) => value + 1);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_10%,rgba(125,211,252,0.18),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(134,239,172,0.16),transparent_34%),radial-gradient(circle_at_50%_92%,rgba(16,185,129,0.08),transparent_40%),linear-gradient(180deg,#f9fffd_0%,#f3fcf8_52%,#ffffff_100%)] px-5 pb-7 pt-[max(22px,env(safe-area-inset-top))] text-[#081225]">
      <div className="mx-auto flex min-h-[calc(100vh-30px)] max-w-[450px] flex-col lg:max-w-6xl">
        <header className="flex items-center justify-between">
          <img
            src="/logo.png"
            alt="Troco"
            className="h-auto w-[136px] max-w-[42vw] object-contain drop-shadow-[0_7px_16px_rgba(46,204,138,0.10)] lg:w-[170px]"
          />

          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            <button
              type="button"
              onClick={onSkip}
              className="rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-black text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.05)] backdrop-blur-[14px] transition active:scale-95"
            >
              {t("onboarding.skip")}
            </button>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-7 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12 lg:py-12">
          <div className="relative mb-6 lg:mb-0">
            <div className="absolute -inset-3 rounded-[46px] bg-white/35 blur-2xl" />

            <div className="relative mx-auto max-w-[330px] overflow-hidden rounded-[38px] border border-white/85 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.13)] lg:max-w-[430px] lg:rounded-[46px]">
              <img
                src={slide.image}
                alt=""
                className="aspect-[9/16] w-full object-cover"
                draggable="false"
              />

              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-2 shadow-[0_10px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <Icon size={17} className="text-[#159b6b]" strokeWidth={2.5} />
                <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-700">
                  {slide.eyebrow}
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/52 via-black/14 to-transparent p-5 pt-20 text-white">
                <div className="flex flex-wrap gap-1.5">
                  {slide.chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full bg-white/82 px-2.5 py-1 text-[10px] font-black text-[#0f513f] backdrop-blur"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[34px] border border-white/80 bg-white/74 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.055)] backdrop-blur-xl lg:rounded-[42px] lg:p-10">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E8F7EF] px-3 py-1.5 text-[12px] font-black uppercase tracking-[0.14em] text-[#22a06b]">
              <ImageIcon size={14} />
              {slide.eyebrow}
            </p>

            <h1 className="max-w-[360px] text-[36px] font-black leading-[0.96] tracking-[-0.055em] lg:max-w-[620px] lg:text-[64px]">
              {slide.title}
            </h1>

            <p className="mt-4 max-w-[335px] text-[15px] font-medium leading-[1.58] text-slate-600 lg:max-w-[580px] lg:text-[19px]">
              {slide.text}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {slide.chips.map((chip) => (
                <Pill key={chip}>{chip}</Pill>
              ))}
            </div>

            <div className="mt-7 h-2 overflow-hidden rounded-full bg-slate-200/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#2ECC8A] to-cyan-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex gap-2">
                {slides.map((_, dotIndex) => (
                  <button
                    key={dotIndex}
                    type="button"
                    onClick={() => setIndex(dotIndex)}
                    className={[
                      "h-2 rounded-full transition-all",
                      dotIndex === index ? "w-8 bg-[#0f9f9a]" : "w-2 bg-slate-300/70",
                    ].join(" ")}
                    aria-label={t("onboarding.goToStep", { number: dotIndex + 1 })}
                  />
                ))}
              </div>

              <div className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-400">
                {index + 1}/{slides.length}
              </div>
            </div>

            <div className="mt-7 space-y-3">
              <button
                type="button"
                onClick={next}
                className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-gradient-to-br from-[#2ECC8A] to-cyan-400 px-5 py-4 text-base font-black text-white shadow-[0_12px_24px_rgba(46,204,138,0.18)] transition active:scale-95"
              >
                {isLast ? t("onboarding.start") : t("onboarding.continue")}
                <ArrowRight size={20} strokeWidth={2.4} />
              </button>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-[20px] bg-white/65 px-2 py-3 text-[11px] font-black text-slate-500">
                  <UsersRound size={17} className="mx-auto mb-1 text-[#22a06b]" />
                  {t("onboarding.values.local")}
                </div>

                <div className="rounded-[20px] bg-white/65 px-2 py-3 text-[11px] font-black text-slate-500">
                  <Sparkles size={17} className="mx-auto mb-1 text-[#22a06b]" />
                  {t("onboarding.values.surprise")}
                </div>

                <div className="rounded-[20px] bg-white/65 px-2 py-3 text-[11px] font-black text-slate-500">
                  <Coffee size={17} className="mx-auto mb-1 text-[#22a06b]" />
                  {t("onboarding.values.human")}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
