import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { COMMUNAUTES } from "../data/communautes";

function FeaturedCard({ communaute }) {
  return (
    <Link
      to={`/communautes/${communaute.id}`}
      className="relative block h-[160px] w-full overflow-hidden rounded-[22px] transition active:scale-[0.985]"
    >
      <img
        src={communaute.img}
        alt={communaute.label}
        className="h-full w-full object-cover"
        draggable="false"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <p className="text-[18px] font-black leading-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
          {communaute.label}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[12px] font-medium text-white/82">
          {communaute.tagline}
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/18 px-2.5 py-1 backdrop-blur-sm">
          <Users size={11} className="text-white/80" strokeWidth={2.2} />
          <span className="text-[11px] font-bold text-white/90">Explorer la communauté</span>
        </div>
      </div>
    </Link>
  );
}

function SmallCard({ communaute }) {
  return (
    <Link
      to={`/communautes/${communaute.id}`}
      className="relative h-[90px] w-[120px] shrink-0 overflow-hidden rounded-[18px] transition active:scale-[0.97]"
    >
      <img
        src={communaute.img}
        alt={communaute.label}
        className="h-full w-full object-cover"
        draggable="false"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
      <span className="absolute bottom-2 left-2.5 text-[12px] font-black leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        {communaute.label}
      </span>
    </Link>
  );
}

export default function CommunautesStrip() {
  const [featured, ...rest] = COMMUNAUTES;

  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[12px] font-black text-[#0d1b2a]">Communautés</p>
        <Link
          to="/communautes"
          className="text-[12px] font-bold text-[#1ABEA3] transition hover:opacity-70"
        >
          Voir tout →
        </Link>
      </div>

      <FeaturedCard communaute={featured} />

      <div className="-mx-3 mt-2.5 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rest.map((c) => (
          <SmallCard key={c.id} communaute={c} />
        ))}
      </div>
    </section>
  );
}
