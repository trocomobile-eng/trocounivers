import { Link } from "react-router-dom";
import { Heart, Library } from "lucide-react";

import { formatRelativeTime, getDisplayName } from "./profileUtils";
import {
  formatLocation,
  getDisplayItemType,
  getItemImage,
} from "../../utils/format";

function ObjectCard({ item, featured = false }) {
  const title =
    getDisplayItemType(item) ||
    item?.title ||
    item?.itemType ||
    item?.type ||
    "Objet";

  const location = item ? formatLocation(item) : "Paris";
  const recency = formatRelativeTime(item?.createdAt || item?.postedAt || item?.updatedAt);

  return (
    <Link
      to={`/items/${item.id}`}
      className={[
        "group block overflow-hidden border border-[#EEF5F1] bg-white/[0.94] text-left shadow-[0_12px_32px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.075)]",
        featured ? "rounded-[34px]" : "rounded-[28px]",
      ].join(" ")}
    >
      <div className="relative overflow-hidden bg-[#F4F8F6]">
        <img
          src={getItemImage(item)}
          alt={title}
          className={[
            "w-full object-cover object-center transition duration-700 group-hover:scale-[1.018]",
            featured ? "aspect-[1.15/1]" : "aspect-[1.03/1]",
          ].join(" ")}
        />

        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/86 text-slate-500 shadow-[0_8px_18px_rgba(15,23,42,0.055)]">
          <Heart size={16} strokeWidth={2.1} />
        </span>
      </div>

      <div className={featured ? "px-5 pb-5 pt-4" : "px-4 pb-4 pt-3.5"}>
        <h3 className={["line-clamp-2 font-extrabold leading-tight tracking-[-0.035em] text-[#081225]", featured ? "text-[20px]" : "text-[16.5px]"].join(" ")}>
          {title}
        </h3>

        <p className="mt-2 truncate text-[12.5px] font-semibold text-slate-400">
          {[location, recency].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
}

export default function ProfileLibraryGrid({ profile, items = [] }) {
  const count = items.length;
  const oneItem = count === 1;

  return (
    <section className="rounded-[36px] border border-[#ECF4F0] bg-white/[0.92] p-6 shadow-[0_16px_46px_rgba(15,23,42,0.055)]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-black tracking-[-0.045em] text-[#081225]">
            Ses objets
          </h2>
          <p className="mt-1 text-[14px] font-medium text-slate-500">
            Les objets racontent un peu son univers.
          </p>
        </div>

        <span className="rounded-full bg-[#EEF7F2] px-4 py-2 text-[13px] font-black text-[#4B7B63]">
          {count} objet{count > 1 ? "s" : ""}
        </span>
      </div>

      {count === 0 ? (
        <div className="rounded-[28px] bg-[#FBFEFC] p-8 text-center">
          <Library className="mx-auto text-[#4B9D8D]" size={32} />
          <p className="mt-3 text-[18px] font-black text-[#081225]">
            Bibliothèque vide pour l’instant.
          </p>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Les objets de {getDisplayName(profile)} apparaîtront ici.
          </p>
        </div>
      ) : (
        <div
          className={[
            "grid gap-5",
            oneItem
              ? "max-w-[330px] grid-cols-1"
              : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          ].join(" ")}
        >
          {items.slice(0, 8).map((item, index) => (
            <ObjectCard key={item.id} item={item} featured={index === 0 && count > 2} />
          ))}
        </div>
      )}
    </section>
  );
}
