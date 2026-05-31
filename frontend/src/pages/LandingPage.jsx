import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  CalendarCheck,
  MessageCircle,
  Repeat2,
  Sparkles,
  MapPin,
  Leaf,
} from "lucide-react";

import TrocoLogo from "../components/TrocoLogo";
import TrocoFooter from "../components/TrocoFooter";

import mockup1 from "../assets/mockups/mockup-1.png";
import mockup2 from "../assets/mockups/mockup-2.png";
import mockup3 from "../assets/mockups/mockup-3.png";
import lampeVintageImg from "../assets/landing/lampe-vintage.png";
import livreAncienImg from "../assets/landing/livre-ancien.png";
import appareilPhotoImg from "../assets/landing/appareil-photo.png";

const PROPOSER_URL = "https://tally.so/r/ob7NOb";

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  function changeLanguage(lang) {
    i18n.changeLanguage(lang);

    try {
      localStorage.setItem("troco-lang", lang);
    } catch (error) {
      console.log(error);
    }
  }

  const currentLanguage = i18n.language?.startsWith("en") ? "en" : "fr";

  return (
    <div className="absolute right-5 top-8 z-40 flex items-center rounded-full border border-[#E4ECE8] bg-white/82 p-1 shadow-[0_10px_30px_rgba(15,23,42,0.055)] backdrop-blur-xl lg:right-8 lg:top-8">
      <button
        type="button"
        onClick={() => changeLanguage("fr")}
        className={[
          "rounded-full px-3.5 py-2 text-[12px] font-black uppercase tracking-[0.08em] transition",
          currentLanguage === "fr"
            ? "bg-gradient-to-r from-[#22C7B8] to-[#36C982] text-white shadow-[0_8px_18px_rgba(45,212,191,0.22)]"
            : "text-slate-500 hover:text-[#0f9f9a]",
        ].join(" ")}
      >
        FR
      </button>

      <button
        type="button"
        onClick={() => changeLanguage("en")}
        className={[
          "rounded-full px-3.5 py-2 text-[12px] font-black uppercase tracking-[0.08em] transition",
          currentLanguage === "en"
            ? "bg-gradient-to-r from-[#22C7B8] to-[#36C982] text-white shadow-[0_8px_18px_rgba(45,212,191,0.22)]"
            : "text-slate-500 hover:text-[#0f9f9a]",
        ].join(" ")}
      >
        EN
      </button>
    </div>
  );
}

function IPhoneMockup({ src, alt, className = "", front = false }) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-[2.7rem] border-[7px] border-slate-950 bg-slate-950",
        front
          ? "z-30 shadow-[0_38px_105px_rgba(15,23,42,0.22)]"
          : "z-10 shadow-[0_24px_70px_rgba(15,23,42,0.13)]",
        className,
      ].join(" ")}
    >
      <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-950" />

      <div className="aspect-[9/19.5] overflow-hidden rounded-[2.15rem] bg-white">
        <img
          src={src}
          alt={alt}
          className="h-full w-full bg-white object-cover object-center"
          draggable="false"
        />
      </div>
    </div>
  );
}

function HeroMockups() {
  return (
    <div className="relative hidden min-h-[700px] items-center justify-center overflow-visible py-12 lg:flex">
      <div className="absolute h-[560px] w-[390px] rounded-full bg-white/80 blur-[115px]" />
      <div className="absolute left-[16%] top-[15%] h-[310px] w-[390px] rounded-full bg-cyan-100/70 blur-[110px]" />
      <div className="absolute bottom-[12%] right-[12%] h-[350px] w-[450px] rounded-full bg-emerald-100/75 blur-[120px]" />
      <div className="absolute right-[30%] top-[8%] h-[210px] w-[270px] rounded-full bg-teal-100/55 blur-[100px]" />

      <IPhoneMockup
        src={mockup1}
        alt="Aperçu Troco gauche"
        className="absolute left-[7%] top-[175px] w-[188px] rotate-[-10deg] opacity-95 xl:w-[210px]"
      />

      <IPhoneMockup
        src={mockup2}
        alt="Aperçu principal Troco"
        className="relative w-[260px] xl:w-[292px]"
        front
      />

      <IPhoneMockup
        src={mockup3}
        alt="Aperçu Troco droite"
        className="absolute right-[7%] top-[175px] w-[188px] rotate-[10deg] opacity-95 xl:w-[210px]"
      />
    </div>
  );
}

function ValueCard({ icon: Icon, title, text }) {
  return (
    <article className="rounded-[32px] border border-[#E4ECE8] bg-white/86 p-6 shadow-[0_16px_46px_rgba(15,23,42,0.045)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_58px_rgba(15,23,42,0.065)]">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#E8F7EF] text-[#0f9f9a]">
        <Icon size={22} strokeWidth={2.35} />
      </div>

      <h3 className="text-[25px] font-black tracking-[-0.045em] text-[#081225]">
        {title}
      </h3>

      <p className="mt-3 text-[16px] font-medium leading-relaxed text-[#64748B]">
        {text}
      </p>
    </article>
  );
}

function StepCard({ icon: Icon, number, title, text }) {
  return (
    <article className="rounded-[30px] border border-[#E4ECE8] bg-white/88 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.045)] backdrop-blur-xl">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#E8F7EF] text-[#0f9f9a]">
        <Icon size={22} strokeWidth={2.35} />
      </div>

      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0f9f9a]">
        Étape {number}
      </p>

      <h3 className="mt-3 text-[23px] font-black tracking-[-0.045em] text-[#081225]">
        {title}
      </h3>

      <p className="mt-3 text-[15px] font-medium leading-relaxed text-[#64748B]">
        {text}
      </p>
    </article>
  );
}

function ObjectStorySection() {
  const objects = [
    {
      title: "Lampe vintage",
      meta: "Paris 11e · il y a 2 h",
      image: lampeVintageImg,
    },
    {
      title: "Livre ancien",
      meta: "Paris 20e · aujourd’hui",
      image: livreAncienImg,
    },
    {
      title: "Appareil photo",
      meta: "Paris 7e · il y a 1 j",
      image: appareilPhotoImg,
    },
  ];

  return (
    <section className="mx-auto mt-2 max-w-7xl px-5">
      <div className="overflow-hidden rounded-[38px] border border-[#E4ECE8] bg-white/86 shadow-[0_20px_70px_rgba(15,23,42,0.055)] backdrop-blur-xl">
        <div className="grid items-center gap-8 p-6 md:p-9 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.24em] text-[#0f9f9a]">
              Pourquoi Troco ?
            </p>

            <h2 className="mt-4 max-w-[360px] text-[34px] font-black leading-[0.96] tracking-[-0.06em] text-[#081225] md:text-[52px]">
              Vendre prend du temps. Donner n’est pas toujours simple.
            </h2>

            <p className="mt-5 max-w-[360px] text-[17px] font-medium leading-relaxed text-[#64748B]">
              Beaucoup d’objets dorment dans nos placards. Troco les transforme
              en opportunités d’échange, de rencontre et de circulation locale.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[34px] border border-white/80 bg-white/88 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.8)]">
            <div className="absolute left-8 top-8 h-28 w-28 rounded-full bg-cyan-100/80 blur-2xl" />
            <div className="absolute bottom-8 right-8 h-32 w-32 rounded-full bg-emerald-100/80 blur-2xl" />

            <div className="relative grid grid-cols-3 gap-2 sm:gap-4">
              {objects.map((item, index) => (
                <div
                  key={item.title}
                  className={[
                    "min-w-0 overflow-hidden rounded-[20px] bg-white/88 p-2 shadow-[0_14px_34px_rgba(15,23,42,0.055)] sm:rounded-[28px] sm:p-3",
                    index === 1 ? "mt-5 sm:mt-8" : "",
                    index === 2 ? "mt-2 sm:mt-3" : "",
                  ].join(" ")}
                >
                  <div className="aspect-[3/4] overflow-hidden rounded-[16px] bg-[#EEF7F3] sm:rounded-[24px]">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover object-center"
                      draggable="false"
                    />
                  </div>
                  <p className="mt-3 text-[11px] font-black leading-tight text-[#081225] sm:mt-4 sm:text-[14px]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold leading-tight text-[#64748B] sm:text-[12px]">
                    {item.meta}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <main className="troco-landing-page relative min-h-screen overflow-x-hidden bg-[var(--troco-bg)] text-[#081225]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 top-8 h-[320px] w-[320px] rounded-full bg-cyan-100/30 blur-[115px]" />
        <div className="absolute -right-28 top-[320px] h-[380px] w-[380px] rounded-full bg-emerald-100/34 blur-[130px]" />
        <div className="absolute bottom-[18%] left-[18%] h-[280px] w-[280px] rounded-full bg-teal-100/26 blur-[115px]" />
      </div>

      <LanguageSwitcher />

      <section className="relative px-5 pb-12 pt-20 md:pb-20 md:pt-14">
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative z-20 mx-auto w-full max-w-[410px] text-center lg:mx-0 lg:max-w-[360px] lg:text-left">
            <div className="mb-0 flex justify-center lg:mb-5 lg:justify-start">
              <div className="origin-center scale-[1.2] lg:origin-left lg:scale-[1.15]">
                <TrocoLogo size="l" />
              </div>
            </div>


            <h1 className="mx-auto mt-5 max-w-[360px] text-[40px] font-black leading-[0.96] tracking-[-0.06em] text-[#081225] sm:max-w-[360px] sm:text-[54px] md:text-[52px] lg:mx-0">
              {t("landing.title")}
            </h1>

            <p className="mx-auto mt-4 max-w-[370px] text-[18px] font-medium leading-relaxed text-[#64748B] sm:max-w-xl md:text-[21px] lg:mx-0">
              {t("landing.description")}
            </p>

            <div className="mx-auto mt-7 flex w-full max-w-[370px] flex-col gap-3 lg:mx-0 lg:max-w-none lg:flex-row">
              <button
                type="button"
                onClick={() => navigate("/onboarding")}
                className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-r from-[#18BFAF] to-[#2ECC8A] px-7 py-3 text-[17px] font-black text-white shadow-[0_16px_38px_rgba(24,191,175,0.30)] ring-1 ring-white/50 transition active:scale-[0.98] lg:w-auto"
              >
                {t("landing.prototype")}
                <ArrowRight size={20} strokeWidth={2.5} />
              </button>

             
            </div>
          </div>

          <HeroMockups />
        </div>
      </section>

      <ObjectStorySection />

      <section className="relative mx-auto mt-9 grid max-w-7xl gap-4 px-5 md:grid-cols-3 md:gap-5">
        <ValueCard
          icon={Sparkles}
          title={t("cards.simple.title")}
          text={t("cards.simple.text")}
        />
        <ValueCard
          icon={MapPin}
          title={t("cards.local.title")}
          text={t("cards.local.text")}
        />
        <ValueCard
          icon={Leaf}
          title={t("cards.sustainable.title")}
          text={t("cards.sustainable.text")}
        />
      </section>

      <section className="relative mx-auto mt-9 max-w-7xl px-5">
        <div className="rounded-[38px] border border-[#E4ECE8] bg-white/84 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur-xl md:p-9">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[12px] font-black uppercase tracking-[0.24em] text-[#0f9f9a]">
              {t("negotiation.badge")}
            </p>

            <h2 className="mt-4 text-[38px] font-black leading-[0.94] tracking-[-0.065em] text-[#081225] md:text-[58px]">
              {t("negotiation.title")}
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-[17px] font-medium leading-relaxed text-[#64748B] md:text-xl">
              {t("negotiation.description")}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StepCard
              icon={Repeat2}
              number="1"
              title={t("steps.step1.title")}
              text={t("steps.step1.text")}
            />
            <StepCard
              icon={MessageCircle}
              number="2"
              title={t("steps.step2.title")}
              text={t("steps.step2.text")}
            />
            <StepCard
              icon={CalendarCheck}
              number="3"
              title={t("steps.step3.title")}
              text={t("steps.step3.text")}
            />
          </div>
        </div>
      </section>

      <section className="relative mx-auto mt-9 max-w-7xl px-5 pb-16">
        <div className="rounded-[38px] border border-[#E4ECE8] bg-white/86 p-7 shadow-[0_20px_70px_rgba(15,23,42,0.055)] backdrop-blur-xl md:p-10">
          <p className="text-[12px] font-black uppercase tracking-[0.24em] text-[#0f9f9a]">
            Troco
          </p>

          <h2 className="mt-4 max-w-3xl text-[38px] font-black leading-[0.94] tracking-[-0.065em] text-[#081225] md:text-[60px]">
            Des objets. Des rencontres. Autour de toi.
          </h2>

          <p className="mt-5 max-w-2xl text-[17px] font-medium leading-relaxed text-[#64748B] md:text-xl">
            Une expérience locale pour échanger autrement, sans vendre, sans
            jeter, sans laisser dormir.
          </p>

          <button
            type="button"
            onClick={() => navigate("/onboarding")}
            className="mt-8 inline-flex min-h-[58px] items-center justify-center gap-2 rounded-[24px] bg-gradient-to-r from-[#22C7B8] to-[#36C982] px-7 py-4 text-[16px] font-black text-white shadow-[0_14px_34px_rgba(45,212,191,0.20)] transition active:scale-[0.98]"
          >
            {t("landing.prototype")}
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </section>

      <div className="relative mt-6 border-t border-[#E4ECE8] bg-white/70">
  <TrocoFooter />
</div>
      <div className="relative pb-8 text-center">
        <Link
          to="/troco-dossier"
          className="text-[11px] font-semibold text-slate-300 transition hover:text-slate-400"
        >
          Vision
        </Link>
      </div>
    </main>
  );
}
