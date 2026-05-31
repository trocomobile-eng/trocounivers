import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Package, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import ItemCard from "../components/ItemCard";
import TrocoPageHeader from "../components/TrocoPageHeader";

function belongsToUser(item, uid, email) {
  if (!uid && !email) return false;
  const ids = [item.ownerId, item.userId, item.ownerUid, item.createdBy, item.uid]
    .filter(Boolean).map(String);
  const emails = [item.ownerEmail, item.userEmail, item.createdByEmail]
    .filter(Boolean).map((v) => String(v).toLowerCase());
  return ids.includes(String(uid || "")) || emails.includes(String(email || "").toLowerCase());
}

function normalize(value = "") {
  return String(value).toLowerCase().trim().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export default function UserItemsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [items, setItems]     = useState([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) { navigate("/login", { replace: true }); return; }

    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q,
      (snap) => { setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      (err) => { console.error(err); setLoading(false); }
    );
    return () => unsub();
  }, [authLoading, navigate, user?.uid]);

  const myItems = useMemo(() => {
    const q = normalize(search);
    return items
      .filter((item) => item.status !== "deleted")
      .filter((item) => belongsToUser(item, user?.uid, user?.email))
      .filter((item) => {
        if (!q) return true;
        return [item.title, item.itemType, item.type, item.category, item.description]
          .some((v) => normalize(v).includes(q));
      });
  }, [items, search, user?.uid, user?.email]);

  return (
    <>
      <TrocoPageHeader
        showNotifications={false}
        showAvatar={false}
        eyebrow="Bibliothèque"
        title="Mes objets"
        subtitle="Gère les objets que tu proposes au troc."
        compact
        right={
          <button
            type="button"
            onClick={() => navigate("/add")}
            className="troco-primary-btn flex h-10 items-center gap-2 rounded-full px-4 text-[13px]"
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>Ajouter</span>
          </button>
        }
      />

      <div className="mb-6 flex h-[48px] w-full max-w-md items-center gap-3 rounded-[14px] bg-white px-4 shadow-[0_2px_8px_rgba(15,23,42,0.07)]">
        <Search size={17} strokeWidth={2} className="shrink-0 text-[#94a3b8]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher dans mes objets..."
          className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-[#0d1b2a] outline-none placeholder:text-[#94a3b8]"
        />
      </div>

      {loading ? (
        <div className="rounded-[20px] bg-white p-8 text-center text-sm font-medium text-slate-400 shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
          Chargement de ta bibliothèque...
        </div>
      ) : myItems.length === 0 ? (
        <div className="rounded-[20px] bg-white p-10 text-center shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F0FAF7] text-[#1ABEA3]">
            <Package size={26} />
          </div>
          <p className="text-[17px] font-extrabold text-[#0d1b2a]">Ta bibliothèque est vide.</p>
          <p className="mt-2 text-[14px] font-medium text-slate-500">
            Ajoute ton premier objet pour commencer à échanger.
          </p>
          <button
            type="button"
            onClick={() => navigate("/add")}
            className="troco-primary-btn mt-5 rounded-full"
          >
            Ajouter un objet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {myItems.map((item) => (
            <ItemCard key={item.id} item={item} owned />
          ))}
        </div>
      )}
    </>
  );
}
