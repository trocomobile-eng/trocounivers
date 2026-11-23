import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useWishlist } from "../context/WishlistContext";
import { useFavoriteUsers } from "../hooks/useFavoriteUsers";
import {
  ArrowLeft,
  BookMarked,
  Camera,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Heart,
  LogOut,
  Home,
  Image as ImageIcon,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Music,
  Package,
  Phone,
  Save,
  Search,
  Settings,
  Share2,
  Sparkles,
  Tag,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import AdminBadge from "../components/profile/AdminBadge";
import TrocoPageHeader from "../components/TrocoPageHeader";
import { TrocoButton, TrocoInput } from "../components/ui";
import { getDisplayItemType, getItemImage } from "../utils/format";
import { getTradePreferences } from "../components/profile/profileUtils";
import PreferenceModal from "../components/profile/PreferenceModal";
import { isAdminUser } from "../utils/adminAccess";

const PREFERENCE_CARDS = [
  { id: "vintage", label: "Vintage", image: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=700&q=80", icon: Tag },
  { id: "photo", label: "Appareils photo", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80", icon: Camera },
  { id: "music", label: "Musique", image: "https://images.unsplash.com/photo-1461360228754-6e81c478b882?auto=format&fit=crop&w=700&q=80", icon: Music },
  { id: "books", label: "Livres", image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=700&q=80", icon: Sparkles },
  { id: "home", label: "Maison", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=700&q=80", icon: Home },
  { id: "design", label: "Design", image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=700&q=80", icon: Sparkles },
  { id: "electronics", label: "Électronique", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=700&q=80", icon: Zap },
  { id: "art", label: "Art", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=700&q=80", icon: ImageIcon },
  { id: "fashion", label: "Mode", image: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=700&q=80", icon: Tag },
  { id: "sport", label: "Sport", image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=700&q=80", icon: Sparkles },
  { id: "plants", label: "Plantes", image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=700&q=80", icon: Sparkles },
  { id: "travel", label: "Voyage", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80", icon: Sparkles },
];

function clean(value = "") {
  if (!value || typeof value === "object") return "";
  return String(value).trim();
}

function splitList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function displayName(user, profile) {
  return (
    clean(profile?.displayName) ||
    clean(profile?.name) ||
    clean(profile?.username) ||
    clean(user?.displayName) ||
    clean(user?.email)?.split("@")[0] ||
    "Mon profil"
  );
}

function photoUrl(user, profile) {
  return (
    profile?.photoURL ||
    profile?.photoUrl ||
    profile?.avatarUrl ||
    profile?.avatar ||
    user?.photoURL ||
    ""
  );
}

function handleName(user, profile) {
  const raw = clean(profile?.username) || clean(profile?.handle) || displayName(user, profile);
  const handle = raw.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
  return handle ? `@${handle}` : "@troco";
}

function locationName(profile) {
  return (
    clean(profile?.arrondissement) ||
    clean(profile?.district) ||
    clean(profile?.location) ||
    clean(profile?.city) ||
    "Paris"
  );
}

function bioText(profile) {
  return (
    clean(profile?.bio) ||
    clean(profile?.description) ||
    "Aime chiner, échanger et donner une seconde vie aux objets."
  );
}

function pref(profile, keys) {
  for (const key of keys) {
    const list = splitList(profile?.[key]);
    if (list.length) return list;
  }
  return [];
}

function itemTitle(item) {
  return getDisplayItemType(item) || item?.title || item?.itemType || item?.name || "Objet";
}

function itemPlace(item, profile) {
  return item?.district || item?.arrondissement || item?.location || locationName(profile);
}

function relativeDate(value) {
  const date =
    value?.toDate?.() ||
    (value?.seconds ? new Date(value.seconds * 1000) : null) ||
    (value ? new Date(value) : null);

  if (!date || Number.isNaN(date.getTime())) return "il y a quelques jours";

  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "aujourd’hui";
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  return `il y a ${Math.floor(days / 7)} sem.`;
}

function PageShell({ children, className = "", user = null, showBrandHeader = true }) {
  return (
    <div className={["w-full", className].join(" ")}>
      {showBrandHeader && (
        <TrocoPageHeader
          variant="brand"
          user={user}
          className="mb-3 lg:hidden"
        />
      )}
      <div className="lg:mx-auto lg:w-full lg:max-w-[1180px] lg:px-10 xl:px-0">
        {children}
      </div>
    </div>
  );
}

function MobileTopBar({ title, onBack, right, centered = true }) {
  return (
    <div className="sticky top-0 z-30 -mx-3 mb-5 flex h-[60px] items-center justify-between bg-white/84 px-3 backdrop-blur-xl lg:hidden">
      <button
        type="button"
        onClick={onBack}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#081225]"
        aria-label="Retour"
      >
        <ArrowLeft size={20} />
      </button>

      <p
        className={[
          "min-w-0 flex-1 truncate text-[15px] font-black text-[#081225]",
          centered ? "text-center" : "pl-2 text-left",
        ].join(" ")}
      >
        {title}
      </p>

      <div className="flex h-10 min-w-10 items-center justify-end">
        {right}
      </div>
    </div>
  );
}

function Avatar({ user, profile, onEdit }) {
  const src = photoUrl(user, profile);
  const name = displayName(user, profile);
  const initial = name.charAt(0).toUpperCase() || "U";

  return (
    <button
      type="button"
      onClick={onEdit}
      className="group relative h-[112px] w-[112px] shrink-0 overflow-hidden rounded-full border-[6px] border-white bg-gradient-to-br from-[#E8F4EF] via-[#DDF1EA] to-[#F6EFE5] text-[#4C7468] shadow-[0_18px_42px_rgba(15,23,42,0.10)] transition active:scale-[0.98]"
      aria-label="Modifier la photo"
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[38px] font-black">
          {initial}
        </span>
      )}

      <span className="absolute bottom-1 right-1 flex h-[26px] w-[26px] items-center justify-center rounded-full border-[1.5px] border-white bg-white text-[#08755C] shadow-[0_4px_12px_rgba(15,23,42,0.14)]">
        <Camera size={12} />
      </span>
    </button>
  );
}

function StatCapsule({ icon: Icon, number, label }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[20px] border border-[#E7ECEB] bg-white px-3 py-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF8F4]">
        <Icon size={15} strokeWidth={2.2} className="text-[#22C58B]" />
      </span>
      <span className="text-center leading-tight">
        <span className="block text-[18px] font-black tracking-[-0.04em] text-[#17212B]">{number}</span>
        <span className="block text-[10.5px] font-medium text-[#6F7782]">{label}</span>
      </span>
    </div>
  );
}

function ActionButton({ icon: Icon, children, onClick, variant = "default" }) {
  const cls = variant === "logout"
    ? "border border-[#EAEDEC] bg-[#F7FAF9] text-[#6F7782] shadow-none"
    : "border border-[#D6EDE7] bg-white text-[#17212B] shadow-[0_2px_8px_rgba(15,23,42,0.05)]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-[16px] px-4 text-[13px] font-bold transition active:scale-[0.97] ${cls}`}
    >
      <Icon size={14} strokeWidth={2.2} />
      {children}
    </button>
  );
}

function SectionTitle({ title, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-[19px] font-black leading-none tracking-[-0.045em] text-[#081225]">
        {title}
      </h2>
      {action && (
        <span className="flex items-center gap-0.5 text-[12px] font-semibold text-[#6F7782]">
          {action}
        </span>
      )}
    </div>
  );
}

function ObjectCard({ item, profile }) {
  const image = getItemImage(item);
  const title = itemTitle(item);

  return (
    <Link
      to={`/items/${item.id}/edit`}
      className="group relative block w-[152px] shrink-0 overflow-hidden rounded-[18px] bg-white shadow-[0_3px_12px_rgba(15,23,42,0.08)] transition active:scale-[0.97] sm:w-[220px]"
    >
      <div className="relative aspect-[4/5] bg-[#F4F8F6]">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">📦</div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />

        <button
          type="button"
          onClick={(event) => event.preventDefault()}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#081225] shadow-[0_4px_12px_rgba(15,23,42,0.12)]"
          aria-label="Favori"
        >
          <Heart size={13} />
        </button>

        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <p className="truncate text-[14px] font-black tracking-[-0.03em]">{title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[10.5px] font-semibold text-white/85">
            <MapPin size={10} />
            {itemPlace(item, profile)}
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-white/70">
            {relativeDate(item?.createdAt || item?.updatedAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function Chip({ icon: Icon, children, active = false }) {
  return (
    <span
      className={[
        "inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-[13px] font-black shadow-[0_7px_20px_rgba(15,23,42,0.025)] sm:h-12 sm:px-4 sm:text-[15px]",
        active
          ? "border-[#BFE8DA] bg-[#EAF8F4] text-[#08755C]"
          : "border-[#DFF1EA] bg-white/82 text-[#40545B]",
      ].join(" ")}
    >
      {Icon && <Icon size={15} className="text-[#4B7B63]" />}
      {children}
    </span>
  );
}

function PreferenceCard({ card, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative overflow-hidden rounded-[22px] border bg-white p-0 text-left shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition active:scale-[0.985]",
        selected ? "border-[#32B9AA]" : "border-[#E8F1ED]",
      ].join(" ")}
    >
      <div className="relative aspect-[1.15/0.88]">
        <img src={card.image} alt={card.label} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/62 via-slate-950/12 to-transparent" />
        {selected && (
          <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#08755C]">
            <Check size={16} strokeWidth={3} />
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <p className="text-[15px] font-black">{card.label}</p>
          <p className="text-[11px] font-semibold text-white/78">{selected ? "Sélectionné" : "À découvrir"}</p>
        </div>
      </div>
    </button>
  );
}

function UniverseCard({ label, index, onClick }) {
  const images = [
    "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1461360228754-6e81c478b882?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80",
  ];

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative h-[86px] min-w-[132px] overflow-hidden rounded-[22px] bg-[#F4F8F6] text-left shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
    >
      <img src={images[index % images.length]} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/16 to-transparent" />
      <p className="absolute inset-x-0 bottom-3 px-4 text-[15px] font-black leading-tight text-white">
        {label}
      </p>
    </button>
  );
}

function ActivityRow({ icon: Icon, title, subtitle, time }) {
  return (
    <div className="flex items-center gap-3 border-b border-[#EEF4F1] py-4 last:border-b-0">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF7F2] text-[#08755C]">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-black text-[#081225]">{title}</p>
        {subtitle && <p className="truncate text-[13px] font-medium text-slate-500">{subtitle}</p>}
      </div>
      <p className="shrink-0 text-[12px] font-semibold text-slate-400">{time}</p>
    </div>
  );
}

function MenuRow({ icon: Icon, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-[#EEF4F1] px-4 py-4 text-left last:border-b-0"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3F8F5] text-[#315F51]">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-black text-[#081225]">{title}</span>
        <span className="mt-0.5 block truncate text-[12.5px] font-medium text-slate-500">{subtitle}</span>
      </span>
      <ChevronRight size={18} className="text-slate-400" />
    </button>
  );
}

function EmptyBlock({ icon: Icon = Package, title, text }) {
  return (
    <div className="rounded-[28px] border border-dashed border-[#DDEBE5] bg-white/70 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF7F2] text-[#08755C]">
        <Icon size={22} />
      </div>
      <p className="mt-3 text-[15px] font-black text-[#081225]">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[13px] font-medium leading-relaxed text-slate-500">{text}</p>
    </div>
  );
}

function WishlistSection() {
  const { items } = useWishlist();
  return (
    <motion.section
      className="mt-10"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.56, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <SectionTitle
        title="Ma wishlist"
        action={<Link to="/wishlist" className="flex items-center gap-0.5 text-[12px] font-semibold text-[#6F7782] hover:text-[#22C58B]">{items.length > 0 ? "Gérer" : "Ajouter"} <ChevronRight size={12} /></Link>}
      />
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-[16px] border border-[#E7ECEB] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <BookMarked size={15} className="shrink-0 text-[#22C58B]" />
              <span className="flex-1 truncate text-[13.5px] font-bold text-[#17212B]">{item.title}</span>
              {item.category && (
                <span className="shrink-0 rounded-full bg-[#EAF8F4] px-2.5 py-0.5 text-[11px] font-bold text-[#08755C]">{item.category}</span>
              )}
            </div>
          ))}
          {items.length > 4 && (
            <Link to="/wishlist" className="block pt-1 text-center text-[13px] font-bold text-[#22C58B]">
              + {items.length - 4} autre{items.length - 4 > 1 ? "s" : ""}
            </Link>
          )}
        </div>
      ) : (
        <EmptyBlock icon={BookMarked} title="Wishlist vide" text="Ajoute les objets que tu cherches pour que les autres puissent te proposer un troc." />
      )}
    </motion.section>
  );
}

function EditProfileSheet({ user, profile, open, onClose, onSaved, onOpenSettings, initialScreen = "menu" }) {
  const [screen, setScreen] = useState(initialScreen);
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    email: "",
    phone: "",
    city: "",
    arrondissement: "",
    bio: "",
    photoURL: "",
  });
  const [saving, setSaving] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(Boolean(profile?.locationEnabled));
  const [locationLoading, setLocationLoading] = useState(false);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        try {
          await setDoc(doc(db, "users", user.uid), { locationEnabled: true, location: loc, locationUpdatedAt: new Date() }, { merge: true });
          setLocationEnabled(true);
        } catch {}
        setLocationLoading(false);
      },
      () => { setLocationLoading(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [user?.uid]);

  const disableLocation = useCallback(async () => {
    try {
      await setDoc(doc(db, "users", user.uid), { locationEnabled: false }, { merge: true });
      setLocationEnabled(false);
    } catch {}
  }, [user?.uid]);

  useEffect(() => {
    if (!open) return;
    setScreen(initialScreen);
    setForm({
      displayName: profile?.displayName || user?.displayName || "",
      username: profile?.username || "",
      email: profile?.email || user?.email || "",
      phone: profile?.phone || profile?.phoneNumber || "",
      city: profile?.city || "Paris",
      arrondissement: profile?.arrondissement || profile?.district || "",
      bio: profile?.bio || profile?.description || "",
      photoURL: profile?.photoURL || user?.photoURL || "",
    });
  }, [open, initialScreen, profile, user]);

  if (!open) return null;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save() {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const payload = {
        displayName: clean(form.displayName),
        username: clean(form.username),
        email: clean(form.email),
        phone: clean(form.phone),
        phoneNumber: clean(form.phone),
        city: clean(form.city),
        arrondissement: clean(form.arrondissement),
        district: clean(form.arrondissement),
        bio: clean(form.bio),
        description: clean(form.bio),
        photoURL: clean(form.photoURL),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", user.uid), payload, { merge: true });
      try {
        await updateProfile(user, { displayName: payload.displayName, photoURL: payload.photoURL });
      } catch {}
      onSaved(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell user={user}>
      <div className="w-full lg:mx-auto lg:max-w-[980px] lg:px-10 xl:px-0">
        {screen === "menu" && (
          <>
            <MobileTopBar title="Modifier mon profil" onBack={onClose} centered />
            <section className="pt-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="max-w-[220px] text-[32px] font-black leading-[0.98] tracking-[-0.06em] text-[#081225]">
                    Ton profil, ton univers.
                  </h1>
                  <p className="mt-4 max-w-[230px] text-[14px] font-medium leading-relaxed text-slate-500">
                    Modifie tes informations personnelles. Tes préférences se règlent directement sur ton profil.
                  </p>
                </div>
                <Avatar user={user} profile={{ ...profile, photoURL: form.photoURL, displayName: form.displayName }} onEdit={() => setScreen("identity")} />
              </div>

              <div className="mt-10 overflow-hidden rounded-[28px] border border-[#E8F1ED] bg-white/92 shadow-[0_12px_34px_rgba(15,23,42,0.04)]">
                <MenuRow icon={UserRound} title="Photo & identité" subtitle="Nom, pseudo, bio..." onClick={() => setScreen("identity")} />
                <MenuRow icon={MapPin} title="Localisation" subtitle={`${form.arrondissement || form.city || "Paris"}`} onClick={() => setScreen("identity")} />
                <button
                  type="button"
                  onClick={locationEnabled ? disableLocation : requestLocation}
                  disabled={locationLoading}
                  className="flex w-full items-center gap-3 border-b border-[#EEF4F1] px-4 py-4 text-left last:border-b-0"
                >
                  <span className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-full", locationEnabled ? "bg-[#EBF8F3] text-[#22C58B]" : "bg-[#F3F8F5] text-[#315F51]"].join(" ")}>
                    <Navigation size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-black text-[#081225]">Ma position GPS</span>
                    <span className="mt-0.5 block text-[12.5px] font-medium text-slate-500">
                      {locationLoading ? "Récupération…" : locationEnabled ? "Activée — distances visibles dans le feed" : "Désactivée — active pour voir les distances"}
                    </span>
                  </span>
                  <span className={["relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors", locationEnabled ? "bg-[#22C58B]" : "bg-slate-200"].join(" ")}>
                    <span className={["inline-block h-4 w-4 translate-x-1 transform rounded-full bg-white shadow transition-transform", locationEnabled ? "translate-x-6" : ""].join(" ")} />
                  </span>
                </button>
                <MenuRow icon={Settings} title="Notifications & confidentialité" subtitle="Notifications push, réglages et préférences" onClick={onOpenSettings} />
              </div>
            </section>
          </>
        )}

        {screen === "identity" && (
          <>
            <MobileTopBar
              title="Photo & identité"
              onBack={() => setScreen("menu")}
              right={
                <button type="button" onClick={save} className="text-[13px] font-black text-[#08755C]">
                  {saving ? "..." : "Enregistrer"}
                </button>
              }
            />

            <section>
              <div className="-mx-3 h-[150px] overflow-hidden bg-[#EEF7F2]">
                <img src="https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1000&q=80" alt="" className="h-full w-full object-cover opacity-70" />
              </div>

              <div className="-mt-16 flex justify-center">
                <Avatar user={user} profile={{ ...profile, photoURL: form.photoURL, displayName: form.displayName }} onEdit={() => {}} />
              </div>

              <div className="mt-8 grid gap-4">
                <label className="grid gap-1.5">
                  <span className="text-[12px] font-black text-slate-500">Photo URL</span>
                  <TrocoInput value={form.photoURL} onChange={(e) => update("photoURL", e.target.value)} placeholder="https://..." icon={<Camera size={16} />} className="h-12 rounded-[18px] px-4" />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[12px] font-black text-slate-500">Nom</span>
                  <TrocoInput value={form.displayName} onChange={(e) => update("displayName", e.target.value)} placeholder="Nom" icon={<UserRound size={16} />} className="h-12 rounded-[18px] px-4" />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[12px] font-black text-slate-500">Pseudo</span>
                  <TrocoInput value={form.username} onChange={(e) => update("username", e.target.value)} placeholder="@lalo" icon={<Sparkles size={16} />} className="h-12 rounded-[18px] px-4" />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[12px] font-black text-slate-500">Email</span>
                  <TrocoInput value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email" icon={<Mail size={16} />} className="h-12 rounded-[18px] px-4" />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[12px] font-black text-slate-500">Téléphone</span>
                  <TrocoInput value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="téléphone" icon={<Phone size={16} />} className="h-12 rounded-[18px] px-4" />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[12px] font-black text-slate-500">Ville / quartier</span>
                  <TrocoInput value={form.arrondissement} onChange={(e) => update("arrondissement", e.target.value)} placeholder="Paris 8e" icon={<MapPin size={16} />} className="h-12 rounded-[18px] px-4" />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[12px] font-black text-slate-500">Bio</span>
                  <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Aime chiner..." className="min-h-[96px] w-full resize-none rounded-[20px] border border-[#E6EFEB] bg-white px-4 py-3 text-[14px] font-medium text-slate-700 outline-none placeholder:text-slate-400" />
                </label>
              </div>

              <div className="mt-8 rounded-[24px] border border-[#E8F1ED] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <p className="mb-3 text-[12px] font-black text-slate-500">Aperçu de ton profil</p>
                <div className="flex gap-3">
                  <Avatar user={user} profile={{ ...profile, photoURL: form.photoURL, displayName: form.displayName }} onEdit={() => {}} />
                  <div className="min-w-0 pt-3">
                    <p className="text-[16px] font-black">{form.displayName || displayName(user, profile)}</p>
                    <p className="text-[12px] font-black text-[#0f9f9a]">@{form.username || "troco"}</p>
                    <p className="mt-1 text-[12px] text-slate-500">{form.arrondissement || "Paris"}</p>
                    <p className="mt-2 line-clamp-2 text-[13px] text-slate-600">{form.bio || bioText(profile)}</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </PageShell>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editInitialScreen, setEditInitialScreen] = useState("menu");
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferenceMode, setPreferenceMode] = useState("looking");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!user?.uid) {
        setLoadingProfile(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        const profileData = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
        if (!mounted) return;
        setProfile(profileData);

        const loadedItems = [];
        const normalizedEmail = String(user.email || "").toLowerCase();

        const itemQueries = [
          query(collection(db, "items"), where("ownerId", "==", user.uid), limit(24)),
          query(collection(db, "items"), where("userId", "==", user.uid), limit(24)),
          query(collection(db, "items"), where("ownerUid", "==", user.uid), limit(24)),
          query(collection(db, "items"), where("createdBy", "==", user.uid), limit(24)),
          query(collection(db, "items"), where("uid", "==", user.uid), limit(24)),
          ...(normalizedEmail
            ? [
                query(collection(db, "items"), where("ownerEmail", "==", normalizedEmail), limit(24)),
                query(collection(db, "items"), where("userEmail", "==", normalizedEmail), limit(24)),
                query(collection(db, "items"), where("createdByEmail", "==", normalizedEmail), limit(24)),
              ]
            : []),
        ];

        for (const itemQuery of itemQueries) {
          try {
            const itemSnapshot = await getDocs(itemQuery);
            itemSnapshot.docs.forEach((document) => loadedItems.push({ id: document.id, ...document.data() }));
          } catch (error) {
            console.warn("Impossible de charger certains objets :", error);
          }
        }

        try {
          const allItemsSnapshot = await getDocs(query(collection(db, "items"), limit(150)));
          allItemsSnapshot.docs.forEach((document) => {
            const item = { id: document.id, ...document.data() };

            const belongsToMe =
              String(item.ownerId || "") === String(user.uid) ||
              String(item.userId || "") === String(user.uid) ||
              String(item.ownerUid || "") === String(user.uid) ||
              String(item.createdBy || "") === String(user.uid) ||
              String(item.uid || "") === String(user.uid) ||
              (normalizedEmail && String(item.ownerEmail || "").toLowerCase() === normalizedEmail) ||
              (normalizedEmail && String(item.userEmail || "").toLowerCase() === normalizedEmail) ||
              (normalizedEmail && String(item.createdByEmail || "").toLowerCase() === normalizedEmail);

            if (belongsToMe) loadedItems.push(item);
          });
        } catch (error) {
          console.warn("Fallback objets profil indisponible :", error);
        }

        const uniqueItems = Object.values(
          loadedItems
            .filter((item) => item.status !== "deleted")
            .reduce((acc, item) => ({ ...acc, [item.id]: item }), {})
        );

        if (mounted) setItems(uniqueItems);

        const favoriteIds = unique([
          ...(profileData?.favoriteItemIds || []),
          ...(profileData?.favorites || []),
          ...(profileData?.savedItemIds || []),
          ...(profileData?.likedItemIds || []),
        ]).slice(0, 10);

        const favs = await Promise.all(
          favoriteIds.map(async (id) => {
            try {
              const favSnapshot = await getDoc(doc(db, "items", id));
              return favSnapshot.exists() ? { id: favSnapshot.id, ...favSnapshot.data() } : null;
            } catch {
              return null;
            }
          })
        );

        if (mounted) setFavoriteItems(favs.filter(Boolean));
      } catch (error) {
        console.error("Erreur chargement profil :", error);
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    }

    if (!authLoading) loadProfile();

    return () => {
      mounted = false;
    };
  }, [authLoading, user?.uid]);

  // Source unique pour les préférences — lit tradePreferences imbriqué puis champs plats
  const tradePrefs = useMemo(() => getTradePreferences(profile || {}), [profile]);
  const lookingFor = tradePrefs.lookingFor;
  const notLookingFor = tradePrefs.notLookingFor;
  const universe = useMemo(() => {
    const explicit = pref(profile, ["universe", "interests", "tags", "lifestyleTags"]);
    if (explicit.length) return explicit.slice(0, 6);

    const categories = unique(items.map((item) => item?.category || item?.categoryLabel || item?.itemType));
    if (categories.length) return categories.slice(0, 6);

    return [];
  }, [items, profile]);

  const latestItem = items[0];
  const { favoriteProfiles, toggle: toggleFavUser } = useFavoriteUsers();

  function openEdit(screen = "menu") {
    setEditInitialScreen(screen);
    setEditProfileOpen(true);
  }

  if (authLoading || loadingProfile) {
    return (
      <PageShell user={user}>
        <div className="px-6 pt-8 text-center text-sm font-bold text-slate-500">Chargement du profil...</div>
      </PageShell>
    );
  }

  if (editProfileOpen) {
    return (
      <EditProfileSheet
        user={user}
        profile={profile}
        open={editProfileOpen}
        initialScreen={editInitialScreen}
        onClose={() => setEditProfileOpen(false)}
        onSaved={(payload) => setProfile((current) => ({ ...(current || {}), ...payload }))}
        onOpenSettings={() => {
          setEditProfileOpen(false);
          navigate("/profile/edit");
        }}
      />
    );
  }



  return (
    <PageShell user={user}>
      <div className="w-full lg:pt-0">
        <div className="hidden lg:block">
          <TrocoPageHeader user={user} showLogo={false} showNotifications={false} showAvatar={false} eyebrow="Profil" title="Mon profil" subtitle="Ton univers Troco, tes objets et tes envies d’échange." compact />
        </div>

        <section className="relative -mx-4 px-4 pb-2 sm:grid-cols-[140px_1fr] sm:items-center">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[240px] rounded-b-[32px] bg-gradient-to-b from-[#EEF7F2]/70 to-transparent" />
          <div className="flex justify-start gap-4 pt-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Avatar user={user} profile={profile} onEdit={() => navigate("/profile/edit")} />
            </motion.div>

            <motion.div
              className="text-left"
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.38, delay: 0.08, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <h1 className="text-[26px] font-black leading-[1.05] tracking-[-0.04em] text-[#17212B] lg:text-[20px]">
                {displayName(user, profile)}
              </h1>
              <p className="mt-1.5 text-[14px] font-semibold tracking-[-0.01em] text-[#1ABEA3]">{handleName(user, profile)}</p>
              {isAdminUser(user) && <AdminBadge className="mt-2" />}
              <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-[#6F7782]">
                <MapPin size={14} className="text-[#22C58B]" />
                {locationName(profile)}
              </p>
              <p className="mt-3 line-clamp-3 max-w-[380px] text-[13.5px] font-medium leading-relaxed text-[#6F7782]">
                {bioText(profile)}
              </p>
            </motion.div>
          </div>

          <motion.div
            className="mt-6 grid grid-cols-3 gap-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.18 } } }}
          >
            {[
              { icon: CheckCircle2, number: profile?.completedExchanges || profile?.exchangeCount || 0, label: "échanges" },
              { icon: Package, number: items.length, label: items.length > 1 ? "objets" : "objet" },
              { icon: Heart, number: favoriteItems.length, label: "favoris" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] } },
                }}
              >
                <StatCapsule icon={stat.icon} number={stat.number} label={stat.label} />
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-5 grid grid-cols-2 gap-3 sm:max-w-[420px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.38, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <ActionButton icon={Edit3} onClick={() => navigate("/profile/edit")}>Modifier</ActionButton>
            <ActionButton
              icon={LogOut}
              variant="logout"
              onClick={async () => {
                await signOut(auth);
                navigate("/login", { replace: true });
              }}
            >
              Déconnexion
            </ActionButton>
          </motion.div>
        </section>

        <motion.section
          className="mt-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <SectionTitle title="Mes objets" action={items.length > 0 ? <Link to="/library" className="flex items-center gap-0.5 text-[12px] font-semibold text-[#6F7782] hover:text-[#22C58B]">Voir tout <ChevronRight size={12} /></Link> : null} />
          {items.length ? (
            <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {items.map((item) => <ObjectCard key={item.id} item={item} profile={profile} />)}
            </div>
          ) : (
            <EmptyBlock icon={Package} title="Aucun objet publié" text="Ajoute ton premier objet pour commencer à échanger." />
          )}
        </motion.section>

        <WishlistSection />

        <motion.section
          className="mt-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.62, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <SectionTitle title="Mes envies d’échange" />

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-[20px] border border-[#E7ECEB] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#22C58B]">
                  Je recherche
                </p>
                <button
                  type="button"
                  onClick={() => { setPreferenceMode("looking"); setPreferencesOpen(true); }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#22C58B] text-white shadow-[0_4px_12px_rgba(34,197,139,0.22)] transition active:scale-95 text-[18px] font-black leading-none"
                  aria-label="Modifier ce que je recherche"
                >
                  +
                </button>
              </div>

              {lookingFor.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {lookingFor.map((item, index) => {
                    const icons = [Car, Zap, Home, Tag, Music, Sparkles];
                    return <Chip key={item} icon={icons[index % icons.length]} active>{item}</Chip>;
                  })}
                </div>
              ) : (
                <EmptyBlock icon={Search} title="Aucune envie renseignée" text="Ajoute ce que tu aimerais recevoir en échange." />
              )}
            </div>

            <div className="rounded-[20px] border border-[#E7ECEB] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6F7782]">
                  Je ne recherche pas
                </p>
                <button
                  type="button"
                  onClick={() => { setPreferenceMode("not"); setPreferencesOpen(true); }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E7ECEB] bg-white text-[#6F7782] shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition active:scale-95 text-[18px] font-black leading-none"
                  aria-label="Modifier ce que je ne recherche pas"
                >
                  +
                </button>
              </div>

              {notLookingFor.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {notLookingFor.map((item) => (
                    <Chip key={item}>{item}</Chip>
                  ))}
                </div>
              ) : (
                <EmptyBlock icon={X} title="Aucune exclusion renseignée" text="Ajoute ce que tu préfères ne pas recevoir." />
              )}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="mt-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.74, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <SectionTitle title="Activité récente" />
          <div className="rounded-[20px] border border-[#E7ECEB] bg-white px-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
            {latestItem && <ActivityRow icon={Package} title="A ajouté un objet" subtitle={itemTitle(latestItem)} time={relativeDate(latestItem?.createdAt || latestItem?.updatedAt)} />}
            <ActivityRow icon={CheckCircle2} title="A confirmé un échange" subtitle="Profil actif sur Troco" time="récemment" />
            <ActivityRow icon={MessageCircle} title="Répond rapidement" subtitle="Taux de réponse élevé" time="toujours" />
          </div>
        </motion.section>

        {favoriteProfiles.length > 0 && (
          <motion.section
            className="mt-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.62, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <SectionTitle
              title="Mes troqueurs favoris"
              action={<Link to="/favorites" className="flex items-center gap-0.5 text-[12px] font-semibold text-[#6F7782] hover:text-[#22C58B]">Voir tout <ChevronRight size={12} /></Link>}
            />
            <div className="grid gap-2.5 sm:grid-cols-2">
              {favoriteProfiles.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-[18px] border border-[#E7ECEB] bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
                  {p.photoURL ? (
                    <img src={p.photoURL} alt={p.displayName} className="h-10 w-10 shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#22C58B] to-[#1ABEA3] text-[15px] font-black text-white">
                      {(p.displayName || p.email || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-[#17212B]">{p.displayName || p.email?.split("@")[0] || "Troqueur"}</p>
                    <p className="truncate text-[11px] font-medium text-[#6F7782]">{p.arrondissement || p.city || "Paris"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/users/${p.id}`} className="rounded-full border border-[#E7ECEB] bg-white px-2.5 py-1 text-[11px] font-bold text-[#17212B] transition hover:border-[#22C58B] hover:text-[#22C58B]">
                      Voir
                    </Link>
                    <button type="button" onClick={() => toggleFavUser(p.id)} className="text-rose-300 transition hover:text-rose-500" aria-label="Retirer">
                      <Heart size={14} fill="currentColor" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {favoriteItems.length > 0 && (
          <section className="mt-10">
            <SectionTitle title="Mes favoris" />
            <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {favoriteItems.map((item) => <ObjectCard key={item.id} item={item} profile={profile} />)}
            </div>
          </section>
        )}
      </div>

      {/* Liens légaux */}
      <section className="mt-10 border-t border-[#E8F1ED] pt-6">
        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
          Informations légales
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Link to="/terms" className="text-[13px] font-semibold text-slate-500 hover:text-[#1ABEA3]">
            Conditions d'utilisation
          </Link>
          <Link to="/privacy" className="text-[13px] font-semibold text-slate-500 hover:text-[#1ABEA3]">
            Confidentialité
          </Link>
          <Link to="/mentions" className="text-[13px] font-semibold text-slate-500 hover:text-[#1ABEA3]">
            Mentions légales
          </Link>
          <a href="mailto:troco.mobile@gmail.com" className="text-[13px] font-semibold text-slate-400 hover:text-[#1ABEA3]">
            Contact
          </a>
        </div>
        <p className="mt-4 text-[11px] font-medium text-slate-300">© 2025 Troco</p>
      </section>

      <PreferenceModal
        open={preferencesOpen}
        mode={preferenceMode}
        profile={profile}
        user={user}
        onClose={() => setPreferencesOpen(false)}
        onSaved={(payload) => setProfile((current) => ({ ...(current || {}), ...payload }))}
      />
    </PageShell>
  );
}
