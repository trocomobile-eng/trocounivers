import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import ItemCard from "../components/ItemCard";

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [favoriteItems, setFavoriteItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      navigate("/login", { replace: true });
      return;
    }

    const q = query(collection(db, "users", user.uid, "favorites"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setFavoriteItems(
          snapshot.docs.map((document) => ({
            id: document.data().itemId || document.id,
            title: document.data().title,
            imageUrl: document.data().imageUrl,
            location: document.data().location,
            condition: document.data().condition,
            category: document.data().category,
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Erreur favoris :", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, navigate, user?.uid]);

  return (
    <>
      <main className="mx-auto w-full max-w-[430px] px-5 pt-[max(14px,env(safe-area-inset-top))] lg:max-w-7xl lg:px-8 lg:pt-8">
        <header className="mb-6">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#0f9f9a]">
            Favoris
          </p>

          <h1 className="mt-2 text-[42px] font-extrabold leading-[0.95] tracking-[-0.055em] text-[#102033] lg:text-[56px]">
            Objets favoris
          </h1>

          <p className="mt-3 max-w-xl text-[15px] font-medium leading-relaxed text-[#64748B] lg:text-lg">
            Tes coups de cœur sauvegardés.
          </p>
        </header>

        {loading ? (
          <div className="rounded-[30px] border border-white/85 bg-white/[0.965] p-8 text-center text-sm font-bold text-slate-500 shadow-[0_10px_28px_rgba(15,23,42,0.045)]">
            Chargement des favoris...
          </div>
        ) : favoriteItems.length === 0 ? (
          <div className="rounded-[30px] border border-white/85 bg-white/[0.965] p-8 text-center shadow-[0_10px_28px_rgba(15,23,42,0.045)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F7EF] text-[#0f9f9a]">
              <Heart size={26} />
            </div>

            <p className="text-lg font-extrabold text-[#102033]">
              Aucun favori pour l’instant.
            </p>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Clique sur les cœurs des objets pour les retrouver ici.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {favoriteItems.map((item) => (
              <ItemCard key={item.id} item={item} compact />
            ))}
          </div>
        )}
      </main>

    </>
  );
}
