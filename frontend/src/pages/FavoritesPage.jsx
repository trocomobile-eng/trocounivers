import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Heart, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useFavoriteUsers } from "../hooks/useFavoriteUsers";
import TrocoPageHeader from "../components/TrocoPageHeader";
import { SkeletonGrid } from "../components/SkeletonCard";
import ItemCard from "../components/ItemCard";

function TroqueurCard({ profile, onRemove }) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-[#E8F1ED] bg-white p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
      {profile.photoURL ? (
        <img src={profile.photoURL} alt={profile.displayName} referrerPolicy="no-referrer" className="h-12 w-12 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1ABEA3] to-[#36C982] text-[17px] font-black text-white">
          {(profile.displayName || profile.email || "?").charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-black text-[#0d1b2a]">
          {profile.displayName || profile.email?.split("@")[0] || "Troqueur"}
        </p>
        <p className="truncate text-[11px] font-medium text-[#94a3b8]">
          {profile.arrondissement || profile.city || "Paris"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to={`/users/${profile.id}`}
          className="rounded-full border border-[#E4ECE8] bg-white px-3 py-1.5 text-[11px] font-black text-[#344256] transition hover:border-[#1ABEA3] hover:text-[#1ABEA3]"
        >
          Voir le profil
        </Link>
        <button
          type="button"
          onClick={() => onRemove(profile.id)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#94a3b8] transition hover:bg-rose-50 hover:text-rose-400"
          aria-label="Retirer des favoris"
        >
          <Heart size={15} fill="currentColor" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { favoriteIds } = useFavorites();
  const { favoriteProfiles, favoriteItems, loading: loadingUsers, toggle } = useFavoriteUsers();

  const [favoriteItemsList, setFavoriteItemsList] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) { navigate("/login", { replace: true }); return; }
  }, [authLoading, navigate, user?.uid]);

  const idsKey = favoriteIds.join(",");
  useEffect(() => {
    if (!favoriteIds.length) { setFavoriteItemsList([]); setLoadingItems(false); return; }
    setLoadingItems(true);
    const ids = favoriteIds.slice(0, 30);
    const q = query(collection(db, "items"), where("__name__", "in", ids));
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.docs.forEach((d) => { map[d.id] = { id: d.id, ...d.data() }; });
      setFavoriteItemsList(ids.map((id) => map[id]).filter(Boolean));
      setLoadingItems(false);
    }, () => setLoadingItems(false));
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return (
    <>
      <TrocoPageHeader
        eyebrow="Favoris"
        title="Mes favoris"
        subtitle="Troqueurs et objets sauvegardés."
        showNotifications={false}
        showAvatar={false}
        compact
      />

      {/* ── Troqueurs favoris ─────────────────────────────────── */}
      <section className="mt-2">
        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a] flex items-center gap-1.5">
          <UserRound size={12} strokeWidth={2.5} />
          Troqueurs favoris
        </p>

        {loadingUsers ? (
          <div className="h-16 animate-pulse rounded-[18px] bg-slate-100" />
        ) : favoriteProfiles.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[#DDE8E4] bg-white p-6 text-center">
            <p className="text-[13px] font-black text-[#0d1b2a]">Aucun troqueur favori</p>
            <p className="mt-1 text-[12px] font-medium text-[#94a3b8]">
              Visite le profil d'un troqueur et ajoute-le à tes favoris.
            </p>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {favoriteProfiles.map((p) => (
              <TroqueurCard key={p.id} profile={p} onRemove={toggle} />
            ))}
          </div>
        )}
      </section>

      {/* ── Leurs objets récents ──────────────────────────────── */}
      {favoriteProfiles.length > 0 && (
        <section className="mt-8">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8] flex items-center gap-1.5">
            <Heart size={12} strokeWidth={2.5} />
            Leurs objets récents
          </p>
          {loadingUsers ? (
            <SkeletonGrid count={4} />
          ) : favoriteItems.length === 0 ? (
            <p className="text-[13px] font-medium text-[#94a3b8]">Aucun objet publié récemment.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {favoriteItems.slice(0, 12).map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Objets favoris ────────────────────────────────────── */}
      <section className="mt-8">
        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8] flex items-center gap-1.5">
          <Heart size={12} strokeWidth={2.5} />
          Objets sauvegardés
        </p>
        {loadingItems ? (
          <SkeletonGrid count={4} />
        ) : favoriteItemsList.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[#DDE8E4] bg-white p-6 text-center">
            <p className="text-[13px] font-black text-[#0d1b2a]">Aucun objet sauvegardé</p>
            <p className="mt-1 text-[12px] font-medium text-[#94a3b8]">
              Clique sur les cœurs des objets pour les retrouver ici.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {favoriteItemsList.map((item) => (
              <ItemCard key={item.id} item={item} defaultFavorite />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
