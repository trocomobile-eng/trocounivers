import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Package, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import BottomNav from "../components/BottomNav";
import ItemCard from "../components/ItemCard";

function belongsToUser(item, uid, email) {
  if (!uid && !email) return false;

  const ids = [
    item.ownerId,
    item.userId,
    item.ownerUid,
    item.createdBy,
    item.uid,
  ].filter(Boolean);

  const emails = [
    item.ownerEmail,
    item.userEmail,
    item.createdByEmail,
  ].filter(Boolean);

  return ids.includes(uid) || emails.includes(email);
}

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export default function UserItemsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      navigate("/login", { replace: true });
      return;
    }

    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setItems(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Erreur chargement bibliothèque :", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, navigate, user?.uid]);

  const myItems = useMemo(() => {
    const q = normalize(search);

    return items
      .filter((item) => item.status !== "deleted")
      .filter((item) => belongsToUser(item, user?.uid, user?.email))
      .filter((item) => {
        if (!q) return true;

        return [
          item.title,
          item.itemType,
          item.type,
          item.category,
          item.description,
        ].some((value) => normalize(value).includes(q));
      });
  }, [items, search, user?.uid, user?.email]);

  return (
    <div className="troco-app-main-page troco-page-bg min-h-screen pb-28 text-[#102033] lg:pb-16">
      <main className="mx-auto w-full max-w-[430px] px-5 pt-[max(14px,env(safe-area-inset-top))] lg:max-w-7xl lg:px-8 lg:pt-8">
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#0f9f9a]">
              Bibliothèque
            </p>

            <h1 className="mt-2 text-[38px] font-extrabold leading-[0.95] tracking-[-0.055em] text-[#102033] lg:text-[56px]">
              Mes objets
            </h1>

            <p className="mt-3 max-w-xl text-[15px] font-medium leading-relaxed text-[#64748B] lg:text-lg">
              Gère les objets que tu proposes au troc.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/add")}
            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#2ECC8A] to-cyan-400 text-white shadow-[0_10px_24px_rgba(46,204,138,0.18)]"
            aria-label="Ajouter un objet"
          >
            <Plus size={22} strokeWidth={2.6} />
          </button>
        </header>

        <section className="mb-5 rounded-[26px] border border-white/85 bg-white/76 p-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)] backdrop-blur-xl lg:max-w-xl">
          <label className="flex h-[48px] items-center rounded-full bg-white px-4 shadow-[0_8px_22px_rgba(15,23,42,0.035)]">
            <Search size={18} className="shrink-0 text-[#0f9f9a]" strokeWidth={2.25} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher dans mes objets..."
              className="ml-3 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
        </section>

        {loading ? (
          <div className="rounded-[30px] border border-white/85 bg-white/[0.965] p-8 text-center text-sm font-bold text-slate-500 shadow-[0_10px_28px_rgba(15,23,42,0.045)]">
            Chargement de ta bibliothèque...
          </div>
        ) : myItems.length === 0 ? (
          <div className="rounded-[30px] border border-white/85 bg-white/[0.965] p-8 text-center shadow-[0_10px_28px_rgba(15,23,42,0.045)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F7EF] text-[#22a06b]">
              <Package size={26} />
            </div>

            <p className="text-lg font-extrabold text-[#102033]">
              Ta bibliothèque est vide.
            </p>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Ajoute ton premier objet pour commencer à échanger.
            </p>

            <button
              type="button"
              onClick={() => navigate("/add")}
              className="mt-5 rounded-full bg-gradient-to-r from-[#2ECC8A] to-cyan-400 px-5 py-3 text-sm font-extrabold text-white"
            >
              Ajouter un objet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {myItems.map((item) => (
              <ItemCard key={item.id} item={item} compact owned />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
