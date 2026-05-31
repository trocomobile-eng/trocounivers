import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { Heart } from "lucide-react";
import TrocoPageHeader from "../components/TrocoPageHeader";
import { SkeletonGrid } from "../components/SkeletonCard";
import { useNavigate } from "react-router-dom";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import ItemCard from "../components/ItemCard";

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [favoriteItems, setFavoriteItems]   = useState([]);
  const [favoriteItemIds, setFavoriteItemIds] = useState([]);
  const [loading, setLoading]               = useState(true);

  // 1. Écoute les favoriteItemIds dans le doc user
  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) { navigate("/login", { replace: true }); return; }

    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const ids = snap.data()?.favoriteItemIds || [];
      setFavoriteItemIds(Array.isArray(ids) ? ids : []);
    });

    return () => unsub();
  }, [authLoading, navigate, user?.uid]);

  // 2. Charge les items correspondants
  useEffect(() => {
    if (!favoriteItemIds.length) {
      setFavoriteItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Firestore limite "in" à 30 éléments — on prend les 30 premiers
    const ids = favoriteItemIds.slice(0, 30);

    const q = query(
      collection(db, "items"),
      where("__name__", "in", ids)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const itemsMap = {};
        snap.docs.forEach((d) => { itemsMap[d.id] = { id: d.id, ...d.data() }; });
        // Conserver l'ordre des favoris
        setFavoriteItems(ids.map((id) => itemsMap[id]).filter(Boolean));
        setLoading(false);
      },
      (err) => {
        console.error("Erreur chargement favoris :", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [favoriteItemIds]);

  return (
    <>
      <main>
        <TrocoPageHeader
          eyebrow="Favoris"
          title="Objets favoris"
          subtitle="Tes coups de cœur sauvegardés."
          showNotifications={false}
          showAvatar={false}
          compact
        />

        {loading ? (
          <SkeletonGrid count={4} />
        ) : favoriteItems.length === 0 ? (
          <div className="rounded-[20px] bg-white p-10 text-center shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F0FAF7] text-[#1ABEA3]">
              <Heart size={26} strokeWidth={2} />
            </div>
            <p className="text-[17px] font-extrabold text-[#0d1b2a]">
              Aucun favori pour l'instant.
            </p>
            <p className="mt-2 text-[14px] font-medium text-slate-500">
              Clique sur les cœurs des objets pour les retrouver ici.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {favoriteItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                defaultFavorite
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
