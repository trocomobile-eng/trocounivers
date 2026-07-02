import { Link } from "react-router-dom";
import { COMMUNAUTES } from "../data/communautes";

function CommunauteCard({ communaute }) {
  return (
    <Link
      to={`/communautes/${communaute.id}`}
      className="relative h-[100px] w-[160px] shrink-0 overflow-hidden rounded-[22px] transition active:scale-[0.97]"
    >
      <img
        src={communaute.img}
        alt={communaute.label}
        className="h-full w-full object-cover"
        draggable="false"
      />
      {/* Overlay dégradé bas → haut pour lisibilité texte */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <span className="absolute bottom-2.5 left-3 text-[13px] font-black leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        {communaute.label}
      </span>
    </Link>
  );
}

export default function CommunautesStrip() {
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[12px] font-black text-[#0d1b2a]">
          Communautés
        </p>
        <Link
          to="/communautes"
          className="text-[12px] font-bold text-[#1ABEA3] transition hover:opacity-70"
        >
          Voir tout →
        </Link>
      </div>
      <div className="-mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {COMMUNAUTES.map((c) => (
          <CommunauteCard key={c.id} communaute={c} />
        ))}
      </div>
    </section>
  );
}
