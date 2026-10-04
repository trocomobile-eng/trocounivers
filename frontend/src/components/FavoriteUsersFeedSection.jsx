import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useFavoriteUsers } from "../hooks/useFavoriteUsers";
import { DesktopFeedCard } from "../pages/feed/DesktopFeedPage";

export default function FavoriteUsersFeedSection({ cardWidth = "w-[192px]", maxItems = 8, showSeeAll = true }) {
  const { favoriteItems, favoriteProfiles, loading } = useFavoriteUsers();
  const scrollRef = useRef(null);

  if (loading || !favoriteItems.length || !favoriteProfiles.length) return null;

  const displayed = favoriteItems.slice(0, maxItems);

  function scroll(dir) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 440, behavior: "smooth" });
  }

  return (
    <section className="mt-8 rounded-[20px] bg-white px-5 pt-5 pb-6 shadow-[0_2px_14px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF0F5] text-[15px]">
            <Heart size={13} strokeWidth={2.2} className="text-[#1ABEA3]" fill="#1ABEA3" />
          </span>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1ABEA3]">
            Nouveautés de vos favoris
          </p>
        </div>

        <div className="flex items-center gap-2">
          {showSeeAll && favoriteItems.length > maxItems && (
            <Link
              to="/favorites"
              className="text-[12px] font-bold text-[#22C58B] transition hover:opacity-70"
            >
              Voir tout →
            </Link>
          )}
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e8ecec] bg-white text-[#17212B] shadow-sm transition hover:bg-[#F4F8F6] active:scale-95"
            aria-label="Précédent"
          >
            <ChevronLeft size={16} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e8ecec] bg-white text-[#17212B] shadow-sm transition hover:bg-[#F4F8F6] active:scale-95"
            aria-label="Suivant"
          >
            <ChevronRight size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <motion.div
          className="flex gap-4"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        >
          {displayed.map((item) => (
            <motion.div
              key={item.id}
              className={`${cardWidth} shrink-0`}
              variants={{
                hidden: { opacity: 0, x: 14 },
                show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] } },
              }}
            >
              <DesktopFeedCard item={item} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
