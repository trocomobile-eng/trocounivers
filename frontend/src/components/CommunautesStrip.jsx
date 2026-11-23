import { Link } from "react-router-dom";
import { COMMUNAUTES } from "../data/communautes";

function CommunauteCard({ communaute }) {
  return (
    <Link
      to={`/communautes/${communaute.id}`}
      className="group relative shrink-0 overflow-hidden rounded-[20px] transition-transform duration-200 active:scale-[0.97]
        w-[118px] h-[148px]
        lg:w-[148px] lg:h-[180px]"
    >
      {/* Photo */}
      <img
        src={communaute.img}
        alt={communaute.label}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        draggable="false"
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      {/* Contenu bas */}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5">
        {/* Icône */}
        {communaute.icon ? (
          <img
            src={communaute.icon}
            alt=""
            className="mb-1.5 h-7 w-7 object-contain drop-shadow-sm lg:h-8 lg:w-8"
            draggable="false"
          />
        ) : (
          <span className="mb-1 block text-[18px] leading-none lg:text-[22px]">
            {communaute.emoji}
          </span>
        )}

        {/* Nom */}
        <p className="text-[12px] font-black leading-tight text-white drop-shadow-sm lg:text-[13px]">
          {communaute.label}
        </p>

      </div>

      {/* Petit badge hover (desktop) */}
      <div className="absolute right-2 top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-opacity duration-200 opacity-0 group-hover:opacity-100 lg:flex">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5h6M5 2l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </Link>
  );
}

export default function CommunautesStrip() {
  return (
    <section className="rounded-[24px] bg-gradient-to-br from-[#f0faf7] to-[#f7fdfb] p-4 lg:p-5">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3 lg:mb-4">
        <div>
          <p className="text-[15px] font-black leading-snug text-[#0d1b2a] lg:text-[17px]">
            Explorer les communautés
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[#64748b] lg:text-[12px]">
            Découvrez, échangez, trouvez des objets qui vous ressemblent.
          </p>
        </div>
        <Link
          to="/communautes"
          className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#1ABEA3] shadow-sm transition hover:bg-[#f0faf7] active:scale-95"
        >
          Voir tout →
        </Link>
      </div>

      {/* Cartes */}
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:gap-3">
        {COMMUNAUTES.map((c) => (
          <CommunauteCard key={c.id} communaute={c} />
        ))}
      </div>
    </section>
  );
}
