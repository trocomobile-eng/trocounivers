import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { ArrowRight, Heart, MapPin, RefreshCw, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useFavoriteUsers } from "../hooks/useFavoriteUsers";
import { SkeletonGrid } from "../components/SkeletonCard";
import { DesktopFeedCard } from "./feed/DesktopFeedPage";
import ItemCard from "../components/ItemCard";
import AmbassadorBadge from "../components/AmbassadorBadge";
import { isAmbassador } from "../utils/ambassador";

// ─── helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-400",
  "bg-green-500", "bg-rose-400", "bg-orange-400", "bg-amber-500",
];
function avatarColor(name = "") {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

function getHandle(profile) {
  if (profile.username) return `@${profile.username}`;
  if (profile.handle) return `@${profile.handle}`;
  const name = profile.displayName || profile.email?.split("@")[0] || "";
  return `@${name.toLowerCase().replace(/\s+/g, "")}`;
}

function getCity(profile) {
  return profile.arrondissement || profile.city || profile.ville || "Paris";
}

function getExchangeCount(profile) {
  return profile.exchangeCount ?? profile.completedExchanges ?? profile.tradeCount ?? null;
}

function getBio(profile) {
  return profile.bio || profile.description || profile.about || "";
}

function getDisplayName(profile) {
  const v = profile.displayName || profile.email?.split("@")[0] || "Troqueur";
  if (v.includes("@")) return v.split("@")[0];
  return v;
}

function itemBelongsTo(item, uid) {
  return [item.ownerId, item.userId, item.ownerUid, item.createdBy, item.uid]
    .filter(Boolean).map(String).includes(String(uid));
}

// ─── FavoriteUserCard ─────────────────────────────────────────────────────────

function MiniItemThumb({ item }) {
  const image =
    item?.images?.[0] || item?.imageUrls?.[0] || item?.photos?.[0] ||
    item?.imageUrl || item?.photoURL || "";
  const title = item?.title || item?.itemType || item?.type || "Objet";

  return (
    <Link to={`/items/${item.id}`} className="group block">
      <div className="aspect-square w-full overflow-hidden rounded-[10px] bg-[#F2F4F3]">
        {image ? (
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300 text-xl">📦</div>
        )}
      </div>
      <p className="mt-1 line-clamp-1 text-[10.5px] font-semibold text-[#344256]">{title}</p>
    </Link>
  );
}

function FavoriteUserCard({ profile, allItems, onUnfollow }) {
  const displayName = getDisplayName(profile);
  const handle = getHandle(profile);
  const city = getCity(profile);
  const exchangeCount = getExchangeCount(profile);
  const bio = getBio(profile);
  const ambassador = isAmbassador(profile);
  const isNew = !ambassador && (exchangeCount === null || exchangeCount < 3);

  const userItems = allItems.filter((item) => itemBelongsTo(item, profile.id));
  const lastItems = userItems.slice(0, 3);

  return (
    <article className="flex flex-col rounded-[20px] border border-[#EAF2EE] bg-white p-5 shadow-[0_2px_14px_rgba(15,23,42,0.06)]">

      {/* ── Identity row ── */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {profile.photoURL ? (
          <img
            src={profile.photoURL}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
        ) : (
          <span className={["flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[20px] font-black text-white ring-2 ring-white shadow-sm", avatarColor(displayName)].join(" ")}>
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}

        {/* Name + handle + badges */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-extrabold text-[#0d1b2a]">{displayName}</p>
          <p className="text-[11.5px] font-medium text-[#94a3b8]">{handle}</p>
          {ambassador ? (
            <AmbassadorBadge className="mt-1" />
          ) : isNew ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-600">
              ⭐ Nouveau profil
            </span>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            to={`/users/${profile.id}`}
            className="rounded-full border border-[#E4ECE8] bg-white px-3 py-1.5 text-[11px] font-bold text-[#344256] transition hover:border-[#1ABEA3] hover:text-[#1ABEA3]"
          >
            Voir le profil
          </Link>
          <button
            type="button"
            onClick={() => onUnfollow(profile.id)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-rose-400 transition hover:bg-rose-50"
            aria-label="Retirer des favoris"
          >
            <Heart size={15} fill="currentColor" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── Quick info ── */}
      <div className="mt-3 flex items-center gap-3 text-[11.5px] font-medium text-[#6F7782]">
        <span className="flex items-center gap-1">
          <MapPin size={10} strokeWidth={2.2} />
          {city}
        </span>
        {exchangeCount !== null && (
          <>
            <span className="text-[#DDE8E4]">·</span>
            <span className="flex items-center gap-1 text-[#1ABEA3]">
              <RefreshCw size={10} strokeWidth={2.2} />
              {exchangeCount} échange{exchangeCount !== 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>

      {/* ── Bio ── */}
      {bio && (
        <p className="mt-2.5 line-clamp-2 text-[12.5px] font-medium leading-relaxed text-[#344256]">
          {bio}
        </p>
      )}

      {/* ── Derniers objets ── */}
      {lastItems.length > 0 && (
        <div className="mt-4 border-t border-[#F0F5F3] pt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11.5px] font-bold text-[#0d1b2a]">Derniers objets</p>
            <Link
              to={`/users/${profile.id}`}
              className="flex items-center gap-0.5 text-[11px] font-bold text-[#22C58B] transition hover:opacity-75"
            >
              Voir tous ({userItems.length}) <ArrowRight size={11} strokeWidth={2.5} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {lastItems.map((item) => (
              <MiniItemThumb key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {lastItems.length === 0 && (
        <p className="mt-4 border-t border-[#F0F5F3] pt-3 text-[11.5px] font-medium text-[#94a3b8]">
          Pas encore d'objet publié.
        </p>
      )}
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { favoriteIds, toggle: toggleItemFavorite } = useFavorites();
  const { favoriteProfiles, favoriteItems, loading: loadingUsers, toggle: toggleUser } = useFavoriteUsers();

  const [savedItems, setSavedItems] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [tipDismissed, setTipDismissed] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) { navigate("/login", { replace: true }); return; }
  }, [authLoading, navigate, user?.uid]);

  const idsKey = favoriteIds.join(",");
  useEffect(() => {
    if (!favoriteIds.length) { setSavedItems([]); setLoadingSaved(false); return; }
    setLoadingSaved(true);
    const ids = favoriteIds.slice(0, 30);
    const q = query(collection(db, "items"), where("__name__", "in", ids));
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.docs.forEach((d) => { map[d.id] = { id: d.id, ...d.data() }; });
      setSavedItems(ids.map((id) => map[id]).filter(Boolean));
      setLoadingSaved(false);
    }, () => setLoadingSaved(false));
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return (
    <main className="mx-auto w-full max-w-[1480px] px-8 py-8">

      {/* ── Header ── */}
      <div>
        <p className="text-[10.5px] font-black uppercase tracking-[0.22em] text-[#1ABEA3]">Favoris</p>
        <h1 className="troco-soft-title mt-1 text-[40px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#0d1b2a]">
          Mes favoris
        </h1>
        <p className="mt-1.5 text-[14px] font-medium text-[#6F7782]">
          Retrouve les personnes que tu suis et leurs derniers objets.
        </p>
      </div>

      {/* ── Troqueurs favoris ── */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F0FAF7]">
              <UserRound size={13} strokeWidth={2.3} className="text-[#1ABEA3]" />
            </span>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1ABEA3]">
              Troqueurs favoris
            </p>
          </div>
          {favoriteProfiles.length > 0 && (
            <p className="text-[12px] font-semibold text-[#94a3b8]">
              {favoriteProfiles.length} favori{favoriteProfiles.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {loadingUsers ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-[20px] bg-slate-100" />
            ))}
          </div>
        ) : favoriteProfiles.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-[#DDE8E4] bg-white p-10 text-center">
            <p className="text-[14px] font-black text-[#0d1b2a]">Tu ne suis encore personne.</p>
            <p className="mt-1 text-[12.5px] font-medium text-[#94a3b8]">
              Visite le profil d'un troqueur et ajoute-le à tes favoris.
            </p>
            <Link
              to="/feed"
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#22C58B] px-5 text-[12px] font-bold text-white transition hover:opacity-90"
            >
              Explorer les membres
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {favoriteProfiles.map((profile) => (
              <FavoriteUserCard
                key={profile.id}
                profile={profile}
                allItems={favoriteItems}
                onUnfollow={toggleUser}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Tip banner ── */}
      {!tipDismissed && favoriteProfiles.length > 0 && (
        <div className="mt-6 flex items-center gap-3 rounded-[14px] bg-[#F4FBF8] px-4 py-3">
          <span className="text-[16px]">💡</span>
          <p className="flex-1 text-[12px] font-medium text-[#344256]">
            <strong>Astuce :</strong> tu seras notifié lorsque tes favoris publient de nouveaux objets !
          </p>
          <button
            type="button"
            onClick={() => setTipDismissed(true)}
            className="text-[18px] font-light leading-none text-[#94a3b8] transition hover:text-slate-500"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Derniers objets de tes favoris ── */}
      {favoriteProfiles.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF0F5]">
                <Heart size={13} strokeWidth={2.2} className="text-[#1ABEA3]" fill="#1ABEA3" />
              </span>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1ABEA3]">
                Derniers objets de tes favoris
              </p>
            </div>
            {favoriteItems.length > 0 && (
              <p className="text-[12px] font-semibold text-[#94a3b8]">
                {favoriteItems.length} objet{favoriteItems.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {loadingUsers ? (
            <SkeletonGrid count={5} />
          ) : favoriteItems.length === 0 ? (
            <p className="text-[13px] font-medium text-[#94a3b8]">
              Aucun objet publié récemment par tes favoris.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {favoriteItems.slice(0, 15).map((item) => (
                <DesktopFeedCard
                  key={item.id}
                  item={item}
                  favorite={favoriteIds.includes(item.id)}
                  onToggleFavorite={toggleItemFavorite}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Objets sauvegardés ── */}
      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF0F5]">
            <Heart size={13} strokeWidth={2.2} className="text-[#1ABEA3]" fill="#1ABEA3" />
          </span>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1ABEA3]">
            Objets sauvegardés
          </p>
        </div>

        {loadingSaved ? (
          <SkeletonGrid count={4} />
        ) : savedItems.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-[#DDE8E4] bg-white p-8 text-center">
            <p className="text-[14px] font-black text-[#0d1b2a]">Aucun objet sauvegardé</p>
            <p className="mt-1 text-[12.5px] font-medium text-[#94a3b8]">
              Clique sur les cœurs des objets pour les retrouver ici.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {savedItems.map((item) => (
              <DesktopFeedCard
                key={item.id}
                item={item}
                favorite={true}
                onToggleFavorite={toggleItemFavorite}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
