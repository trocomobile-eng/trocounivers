import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { getItemImage, getItemTitle } from "../hooks/useFeedItems";
import { useFavoriteUsers } from "../hooks/useFavoriteUsers";

function FavItem({ item, cardWidth = "w-[160px]" }) {
  const image = getItemImage(item);
  const title = getItemTitle(item);
  const ownerId = item.ownerId || item.userId || item.ownerUid || item.createdBy || "";

  return (
    <Link
      to={`/items/${item.id}`}
      className={`${cardWidth} shrink-0 block overflow-hidden rounded-[18px] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.07)] transition hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.10)]`}
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {image
          ? <img src={image} alt={title} className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-center justify-center text-2xl text-slate-300">📦</div>
        }
      </div>
      <div className="p-2.5">
        <p className="line-clamp-2 text-[12px] font-extrabold leading-snug text-[#0d1b2a]">{title}</p>
        {ownerId && (
          <p className="mt-1 truncate text-[11px] font-medium text-[#94a3b8]">
            {item.ownerName || item.ownerDisplayName || "Troqueur"}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function FavoriteUsersFeedSection({ cardWidth, maxItems = 6, showSeeAll = true }) {
  const { favoriteItems, favoriteProfiles, loading } = useFavoriteUsers();

  if (loading || !favoriteItems.length || !favoriteProfiles.length) return null;

  const displayed = favoriteItems.slice(0, maxItems);

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#0f9f9a] flex items-center gap-1.5">
          <Heart size={13} strokeWidth={2.5} />
          Nouveautés de vos favoris
        </p>
        {showSeeAll && favoriteItems.length > maxItems && (
          <Link
            to="/favorites"
            className="text-[12px] font-black text-[#1ABEA3] transition hover:opacity-70"
          >
            Voir tout →
          </Link>
        )}
      </div>

      <div className="overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <motion.div
          className="flex gap-3"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        >
          {displayed.map((item) => (
            <motion.div
              key={item.id}
              variants={{
                hidden: { opacity: 0, x: 14 },
                show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] } },
              }}
            >
              <FavItem item={item} cardWidth={cardWidth} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
