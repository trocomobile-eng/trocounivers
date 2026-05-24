import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Package, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import BottomNav from "../components/BottomNav";
import ItemCard from "../components/ItemCard";
import TrocoPageHeader from "../components/TrocoPageHeader";
import { TrocoButton, TrocoCard, TrocoInput } from "../components/ui";

function belongsToUser(item, uid, email) {
  if (!uid && !email) return false;

  const ids = [
    item.ownerId,
    item.userId,
    item.ownerUid,
    item.createdBy,
    item.uid,
  ].filter(Boolean).map(String);

  const emails = [
    item.ownerEmail,
    item.userEmail,
    item.createdByEmail,
  ].filter(Boolean).map((value) => String(value).toLowerCase());

  return ids.includes(String(uid || "")) || emails.includes(String(email || "").toLowerCase());
}

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export default function LibraryPage() {
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
    <main className="troco-desktop-page">
      <TrocoPageHeader
        user={user}
        showLogo={false}
        eyebrow="Bibliothèque"
        title="Mes objets"
        subtitle="Gère les objets que tu proposes au troc."
        compact
        right={
          <TrocoButton
            variant="primary"
            onClick={() => navigate("/add")}
            className="h-11 rounded-full px-4"
            aria-label="Ajouter un objet"
          >
            <Plus size={18} strokeWidth={2.4} />
            <span className="hidden sm:inline">Ajouter</span>
          </TrocoButton>
        }
      />

      <section className="mb-6 max-w-xl">
        <TrocoInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher dans mes objets..."
          icon={<Search size={18} strokeWidth={2.2} />}
          className="troco-desktop-search px-4"
          inputClassName="text-[15px] font-medium text-slate-700 placeholder:text-slate-400"
        />
      </section>

      {loading ? (
        <TrocoCard variant="plain" className="troco-panel p-8 text-center text-sm font-bold text-slate-500">
          Chargement de ta bibliothèque...
        </TrocoCard>
      ) : myItems.length === 0 ? (
        <TrocoCard variant="plain" className="troco-panel p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF7F2] text-[#315F51]">
            <Package size={26} />
          </div>

          <p className="text-lg font-black text-[#081225]">
            Ta bibliothèque est vide.
          </p>

          <p className="mt-2 text-sm font-medium text-slate-500">
            Ajoute ton premier objet pour commencer à échanger.
          </p>

          <TrocoButton
            variant="primary"
            onClick={() => navigate("/add")}
            className="mt-5"
          >
            Ajouter un objet
          </TrocoButton>
        </TrocoCard>
      ) : (
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {myItems.map((item) => (
            <ItemCard key={item.id} item={item} compact owned />
          ))}
        </section>
      )}

      <BottomNav />
    </main>
  );
}
