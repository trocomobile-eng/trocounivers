import { Link } from "react-router-dom";
import { COMMUNAUTES } from "../data/communautes";

function CommunauteCard({ communaute, large }) {
  const w = large ? 160 : 130;
  const h = large ? 110 : 90;

  return (
    <Link
      to={`/communautes/${communaute.id}`}
      className="relative shrink-0 overflow-hidden rounded-2xl transition active:scale-[0.97]"
      style={{ width: w, height: h }}
    >
      <img
        src={communaute.img}
        alt={communaute.label}
        className="h-full w-full object-cover"
        draggable="false"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/15 to-transparent" />

      <span
        className="absolute left-2 top-2 text-[16px] leading-none"
        style={{ fontSize: large ? 17 : 15 }}
      >
        {communaute.emoji}
      </span>

      <span
        className="absolute bottom-2 left-0 right-0 text-center font-black leading-none text-white drop-shadow-sm"
        style={{ fontSize: large ? 13 : 12 }}
      >
        {communaute.label}
      </span>
    </Link>
  );
}

export default function CommunautesStrip({ large = false }) {
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#0d1b2a]">
          Communautés
        </p>
        <Link
          to="/communautes"
          className="text-[12px] font-bold text-[#1ABEA3] transition hover:opacity-70"
        >
          Voir tout →
        </Link>
      </div>
      <div className="-mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {COMMUNAUTES.map((c) => (
          <CommunauteCard key={c.id} communaute={c} large={large} />
        ))}
      </div>
    </section>
  );
}
