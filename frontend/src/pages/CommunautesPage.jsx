import { ArrowLeft, ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { COMMUNAUTES } from "../data/communautes";

function CommunauteIcon({ communaute }) {
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border shadow-[0_10px_26px_rgba(15,23,42,0.08)]"
      style={{
        background: `${communaute.accent}18`,
        borderColor: `${communaute.accent}38`,
      }}
    >
      <span className="text-[22px] leading-none">{communaute.emoji}</span>
    </div>
  );
}

function CommunauteCardImage({ communaute }) {
  if (communaute.img) {
    return (
      <img
        src={communaute.img}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
      />
    );
  }
  return (
    <div
      className="absolute inset-0"
      style={{ background: `linear-gradient(135deg, ${communaute.accent}bb 0%, ${communaute.accent}44 100%)` }}
    />
  );
}

function DesktopHero() {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-slate-900 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
      <div className="absolute inset-0 grid grid-cols-5">
        {COMMUNAUTES.slice(0, 5).map((c) => (
          c.img ? (
            <img key={c.id} src={c.img} alt="" className="h-full w-full object-cover" />
          ) : (
            <div key={c.id} className="h-full w-full" style={{ background: `linear-gradient(135deg, ${c.accent}cc, ${c.accent}44)` }} />
          )
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/76 via-black/42 to-black/16" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/56 via-black/8 to-transparent" />

      <div className="relative z-10 min-h-[250px] px-8 py-7">
        <Link to="/feed" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/16 text-white backdrop-blur-xl transition active:scale-95" aria-label="Retour">
          <ArrowLeft size={18} />
        </Link>
        <div className="mt-12 max-w-[620px]">
          <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">
            <Sparkles size={13} />
            Explorer
          </p>
          <h1 className="text-[48px] font-black leading-[0.95] tracking-[-0.065em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.32)]">
            Communautés
          </h1>
          <p className="mt-3 max-w-[500px] text-[16px] font-semibold leading-relaxed text-white/82">
            Découvre les objets et les personnes autour de tes centres d'intérêt.
          </p>
        </div>
      </div>
    </section>
  );
}

function DesktopCommunauteRow({ communaute, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group grid w-full grid-cols-[minmax(0,1fr)_360px] overflow-hidden rounded-[28px] border border-white/75 bg-white/72 text-left shadow-[0_14px_38px_rgba(15,23,42,0.055)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(15,23,42,0.075)] active:scale-[0.99]"
    >
      <div className="flex min-h-[140px] items-center gap-5 p-5">
        <CommunauteIcon communaute={communaute} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[28px] font-black leading-none tracking-[-0.055em] text-[#102033]">
            {communaute.label}
          </h2>
          <p className="mt-1.5 text-[13.5px] font-black leading-snug text-slate-700">
            {communaute.tagline}
          </p>
          <p className="mt-1.5 max-w-[520px] text-[12.5px] font-medium leading-relaxed text-slate-500">
            {communaute.description}
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-[#102033]/5 px-4 py-2 text-[12px] font-black text-[#102033] transition group-hover:bg-[#167a58] group-hover:text-white xl:inline-flex">
          Explorer
          <ArrowRight size={14} strokeWidth={2.6} />
        </div>
      </div>
      <div className="relative min-h-[140px] overflow-hidden">
        <CommunauteCardImage communaute={communaute} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/8 to-transparent" />
        <div className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/18 text-white backdrop-blur-xl transition group-hover:bg-white/26">
          <ChevronRight size={18} strokeWidth={2.7} />
        </div>
      </div>
    </button>
  );
}

function MobileCommunauteRow({ communaute, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative h-[112px] w-full overflow-hidden rounded-[24px] text-left shadow-[0_14px_34px_rgba(15,23,42,0.075)] active:scale-[0.985]"
    >
      <CommunauteCardImage communaute={communaute} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/74 via-black/34 to-black/8" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/42 via-transparent to-transparent" />

      <div className="relative z-10 flex h-full items-center gap-4 px-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/36 backdrop-blur-xl"
          style={{ background: `${communaute.accent}64` }}
        >
          <span className="text-[20px] leading-none">{communaute.emoji}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[21px] font-black leading-none tracking-[-0.05em] text-white drop-shadow">
            {communaute.label}
          </p>
          <p className="mt-1.5 line-clamp-2 max-w-[240px] text-[12px] font-semibold leading-snug text-white/78">
            {communaute.tagline}
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-xl">
          <ChevronRight size={17} strokeWidth={2.8} />
        </div>
      </div>
    </button>
  );
}

function DesktopCommunautesPage() {
  const navigate = useNavigate();
  return (
    <div className="hidden min-h-screen bg-[var(--troco-bg)] text-[#102033] lg:block">
      <main className="px-5 pb-20 pt-5 lg:px-6 xl:px-7">
        <DesktopHero />
        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#167a58]">Communautés</p>
              <h2 className="text-[30px] font-black tracking-[-0.055em] text-[#102033]">Explore par centre d'intérêt</h2>
            </div>
            <Link to="/feed" className="inline-flex items-center gap-1 text-[13px] font-black text-[#167a58]">
              Retour au feed <ArrowRight size={15} />
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {COMMUNAUTES.map((c) => (
              <DesktopCommunauteRow key={c.id} communaute={c} onClick={() => navigate(`/communautes/${c.id}`)} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function MobileCommunautesPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[var(--troco-bg)] pb-28">
      <main className="mx-auto w-full max-w-[430px] px-4 pt-[max(14px,env(safe-area-inset-top))]">
        <header className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/76 text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.045)] backdrop-blur-xl"
            aria-label="Retour"
          >
            <ArrowLeft size={17} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#167a58]">
              <Sparkles size={13} />
              Explorer
            </p>
            <h1 className="text-[28px] font-black leading-[0.98] tracking-[-0.06em] text-slate-950">Communautés</h1>
            <p className="mt-1.5 text-[13px] font-medium leading-snug text-slate-500">
              Découvre les objets et troqueurs qui partagent tes centres d'intérêt.
            </p>
          </div>
        </header>

        <section className="flex flex-col gap-3.5">
          {COMMUNAUTES.map((c) => (
            <MobileCommunauteRow key={c.id} communaute={c} onClick={() => navigate(`/communautes/${c.id}`)} />
          ))}
        </section>
      </main>
    </div>
  );
}

export default function CommunautesPage() {
  return (
    <>
      <DesktopCommunautesPage />
      <div className="block lg:hidden">
        <MobileCommunautesPage />
      </div>
    </>
  );
}
