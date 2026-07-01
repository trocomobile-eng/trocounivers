import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookMarked, Plus, Trash2, X } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import TrocoPageHeader from "../components/TrocoPageHeader";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  "Électronique", "Maison", "Vêtements", "Musique", "Livres",
  "Sport", "Jeux", "Art", "Vintage", "Plantes", "Autre",
];

function WishCard({ item, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.22 }}
      className="flex items-start gap-3 rounded-[18px] border border-[#E7ECEB] bg-white px-4 py-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.05)]"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-black text-[#17212B] truncate">{item.title}</p>
        {item.category && (
          <span className="mt-1 inline-block rounded-full bg-[#EAF8F4] px-2.5 py-0.5 text-[11px] font-bold text-[#08755C]">
            {item.category}
          </span>
        )}
        {item.note && (
          <p className="mt-1.5 text-[12.5px] font-medium leading-relaxed text-slate-500">{item.note}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500"
        aria-label="Supprimer"
      >
        <Trash2 size={15} />
      </button>
    </motion.div>
  );
}

function AddForm({ onAdd, onClose }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title, category, note });
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-[22px] border border-[#C8EDE5] bg-[#F0FAF7] p-5 shadow-[0_4px_20px_rgba(15,23,42,0.07)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[14px] font-black text-[#17212B]">Qu'est-ce que tu cherches ?</p>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex : guitare acoustique, vélo vintage..."
          className="w-full rounded-[14px] border border-[#D6EDE7] bg-white px-4 py-3 text-[14px] font-semibold text-[#17212B] placeholder:text-slate-400 outline-none focus:border-[#1ABEA3] focus:ring-2 focus:ring-[#1ABEA3]/20"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-[14px] border border-[#D6EDE7] bg-white px-4 py-3 text-[14px] font-semibold text-[#17212B] outline-none focus:border-[#1ABEA3]"
        >
          <option value="">Catégorie (optionnel)</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Précisions (état, couleur, budget...) — optionnel"
          rows={2}
          className="w-full resize-none rounded-[14px] border border-[#D6EDE7] bg-white px-4 py-3 text-[14px] font-semibold text-[#17212B] placeholder:text-slate-400 outline-none focus:border-[#1ABEA3] focus:ring-2 focus:ring-[#1ABEA3]/20"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="troco-primary-btn flex h-11 w-full items-center justify-center gap-2 rounded-[14px] text-[14px] disabled:opacity-50"
        >
          <Plus size={16} strokeWidth={2.5} />
          Ajouter à ma wishlist
        </button>
      </form>
    </motion.div>
  );
}

export default function WishlistPage() {
  const { user } = useAuth();
  const { items, add, remove } = useWishlist();
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="hidden lg:block">
        <TrocoPageHeader
          user={user}
          showLogo={false}
          showNotifications={false}
          showAvatar={false}
          eyebrow="Wishlist"
          title="Ma wishlist"
          subtitle="Les objets que tu aimerais obtenir en échange."
          compact
        />
      </div>

      <div className="px-0 pb-8 pt-4 lg:pt-0">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#081225] lg:hidden">
              Ma wishlist
            </h2>
            <p className="text-[13px] font-medium text-slate-500 lg:hidden">
              {items.length} objet{items.length !== 1 ? "s" : ""} recherché{items.length !== 1 ? "s" : ""}
            </p>
            <p className="hidden text-[13px] font-medium text-slate-500 lg:block">
              {items.length} objet{items.length !== 1 ? "s" : ""} recherché{items.length !== 1 ? "s" : ""}
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex h-10 items-center gap-2 rounded-[14px] bg-[#1ABEA3] px-4 text-[13px] font-black text-white shadow-[0_4px_14px_rgba(26,190,163,0.30)] transition active:scale-[0.97]"
            >
              <Plus size={15} strokeWidth={2.5} />
              Ajouter
            </button>
          )}
        </div>

        <AnimatePresence>
          {showForm && (
            <div className="mb-4">
              <AddForm onAdd={add} onClose={() => setShowForm(false)} />
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <WishCard key={item.id} item={item} onRemove={remove} />
              ))}
            </div>
          ) : !showForm ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[28px] border border-dashed border-[#DDEBE5] bg-white/70 p-10 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF7F2] text-[#08755C]">
                <BookMarked size={26} />
              </div>
              <p className="mt-4 text-[16px] font-black text-[#081225]">Wishlist vide</p>
              <p className="mt-2 text-[13px] font-medium leading-relaxed text-slate-500">
                Ajoute les objets que tu cherches.<br />Les autres pourront te proposer un troc.
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="troco-primary-btn mt-5 inline-flex h-11 items-center gap-2 rounded-[14px] px-5 text-[14px]"
              >
                <Plus size={15} strokeWidth={2.5} />
                Ajouter un objet
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
