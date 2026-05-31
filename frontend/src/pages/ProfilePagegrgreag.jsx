import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
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
  MoreHorizontal,
  Music,
  Package,
  Phone,
  Save,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
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
import TrocoPageHeader from "../components/TrocoPageHeader";
import { TrocoButton, TrocoInput } from "../components/ui";
import { getDisplayItemType, getItemImage } from "../utils/format";
import { getTradePreferences } from "../components/profile/profileUtils";
import PreferenceModal from "../components/profile/PreferenceModal";

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
  return String(value || "").trim();
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
      <div className="mx-auto w-full max-w-[1180px] px-4 pt-[max(6px,env(safe-area-inset-top))] lg:px-10 xl:px-0">
        {showBrandHeader && (
          <TrocoPageHeader
            variant="brand"
            user={user}
            className="mb-2 px-1 lg:hidden"
          />
        )}

        {children}
      </div>
    </div>
  );
}

function MobileTopBar({ title, onBack, right, centered = true }) {
  return (
    <div className="sticky top-0 z-30 -mx-6 mb-5 flex h-[60px] items-center justify-between bg-white/84 px-6 backdrop-blur-xl lg:hidden">
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

      <span className="absolute bottom-1.5 right-1.5 flex h-9 w-9 items-center justify-center rounded-full border border-white bg-white text-[#08755C] shadow-[0_8px_20px_rgba(15,23,42,0.12)]">
        <Camera size={17} />
      </span>
    </button>
  );
}

function StatCapsule({ icon: Icon, number, label }) {
  return (
    <span className="inline-flex min-h-[54px] min-w-[96px] items-center justify-center gap-2 rounded-[22px] border border-[#E5F1EC] bg-white/88 px-3 text-[#315F51] shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <Icon size={18} strokeWidth={2.2} />
      <span className="text-left leading-tight">
        <span className="block text-[17px] font-black tracking-[-0.03em]">{number}</span>
        <span className="block text-[11.5px] font-bold text-[#40545B]">{label}</span>
      </span>
    </span>
  );
}

function ActionButton({ icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-[18px] border border-[#E5F1EC] bg-white/90 px-4 text-[13px] font-black text-[#253841] shadow-[0_8px_22px_rgba(15,23,42,0.035)] transition active:scale-[0.98]"
    >
      <Icon size={16} strokeWidth={2.2} />
      {children}
    </button>
  );
}

function SectionTitle({ title, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-[22px] font-black leading-none tracking-[-0.055em] text-[#081225] sm:text-[26px]">
        {title}
      </h2>
      {action}
    </div>
  );
}

function ObjectCard({ item, profile }) {
  const image = getItemImage(item);
  const title = itemTitle(item);

  return (
    <Link
      to={`/items/${item.id}/edit`}
      className="group relative block w-[168px] shrink-0 overflow-hidden rounded-[22px] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.085)] transition active:scale-[0.985] sm:w-[268px] sm:rounded-[30px]"
    >
      <div className="relative aspect-[0.82/1] bg-[#F4F8F6] sm:aspect-[1.18/1]">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">📦</div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/12 to-transparent" />

        <button
          type="button"
          onClick={(event) => event.preventDefault()}
          className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-[#081225] shadow-[0_8px_20px_rgba(15,23,42,0.12)]"
          aria-label="Favori"
        >
          <Heart size={17} />
        </button>

        <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
          <p className="truncate text-[15px] font-black tracking-[-0.035em] sm:text-[17px]">{title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[11.5px] font-bold text-white/90 sm:text-[12.5px]">
            <MapPin size={12} />
            {itemPlace(item, profile)}
          </p>
          <p className="mt-1 text-[11px] font-medium text-white/80 sm:text-[12px]">
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
      <div className="mx-auto w-full max-w-[980px] px-6 pt-[max(12px,env(safe-area-inset-top))] lg:px-10 xl:px-0">
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
              <div className="-mx-6 h-[150px] overflow-hidden bg-[#EEF7F2]">
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

function PreferencesScreen({ user, profile, open, onClose, onSaved, onOpenDetail }) {
  const [mode, setMode] = useState("looking");
  const [lookingFor, setLookingFor] = useState([]);
  const [notLookingFor, setNotLookingFor] = useState([]);
  const [universe, setUniverse] = useState([]);
  const [customLooking, setCustomLooking] = useState("");
  const [customNotLooking, setCustomNotLooking] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Lire depuis getTradePreferences pour être cohérent avec l'affichage
    const prefs = getTradePreferences(profile || {});
    setLookingFor(prefs.lookingFor.length
      ? prefs.lookingFor
      : pref(profile, ["lookingFor", "wantedItems", "searchingFor", "tradeWants"]));
    setNotLookingFor(prefs.notLookingFor.length
      ? prefs.notLookingFor
      : pref(profile, ["notLookingFor", "avoidItems", "notInterestedIn"]));
    setUniverse(pref(profile, ["universe", "interests", "tags", "lifestyleTags"]));
    setCustomLooking("");
    setCustomNotLooking("");
    setMode("looking");
  }, [open, profile]);

  if (!open) return null;

  function toggleIn(list, setList, label, max = 8) {
    setList((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : current.length >= max
          ? current
          : [...current, label]
    );
  }

  function addCustom(type) {
    const value = type === "looking" ? customLooking.trim() : customNotLooking.trim();
    if (!value) return;

    if (type === "looking") {
      setLookingFor((current) => unique([...current, value]).slice(0, 12));
      setCustomLooking("");
    } else {
      setNotLookingFor((current) => unique([...current, value]).slice(0, 12));
      setCustomNotLooking("");
    }
  }

  async function save() {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const payload = {
        // Champs à plat (compatibilité ProfilePage)
        lookingFor,
        wantedItems: lookingFor,
        searchingFor: lookingFor,
        tradeWants: lookingFor,
        notLookingFor,
        avoidItems: notLookingFor,
        notInterestedIn: notLookingFor,
        universe,
        interests: universe,
        tags: universe,
        // Champ imbriqué (compatibilité ProfilePreferenceSection / getTradePreferences)
        tradePreferences: {
          lookingFor,
          notLookingFor,
          universe,
          note: "",
        },
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", user.uid), payload, { merge: true });
      onSaved(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell user={user}>
      <div className="mx-auto w-full max-w-[980px] px-6 pt-[max(12px,env(safe-area-inset-top))] lg:px-10 xl:px-0">
        <MobileTopBar
          title="Modifier mes préférences"
          onBack={onClose}
          right={
            <button type="button" onClick={save} className="text-[13px] font-black text-[#08755C]">
              {saving ? "..." : "Terminé"}
            </button>
          }
        />

        <section>
          <h1 className="max-w-[340px] text-[30px] font-black leading-[1.02] tracking-[-0.06em] text-[#081225]">
            Ce que tu aimes chercher, dénicher et échanger.
          </h1>
          <p className="mt-3 max-w-[310px] text-[14px] font-medium leading-relaxed text-slate-500">
            Sélectionne ce qui t’inspire le plus pour personnaliser ton expérience Troco.
          </p>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              ["looking", "Je recherche"],
              ["not", "Je ne recherche pas"],
              ["universe", "Mon univers"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={[
                  "h-10 shrink-0 rounded-full px-4 text-[13px] font-black transition",
                  mode === id
                    ? "bg-[#08755C] text-white shadow-[0_10px_22px_rgba(8,117,92,0.16)]"
                    : "border border-[#E8F1ED] bg-white text-[#40545B]",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "looking" && (
            <div className="mt-5">
              <div className="mb-4 rounded-[24px] border border-[#E8F1ED] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <p className="text-[14px] font-black text-[#081225]">Ce que tu aimerais recevoir</p>
                <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-slate-500">
                  Ces préférences seront visibles sur ton profil et aideront les autres à proposer de meilleurs trocs.
                </p>

                <div className="mt-3 flex gap-2">
                  <input
                    value={customLooking}
                    onChange={(event) => setCustomLooking(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCustom("looking");
                      }
                    }}
                    placeholder="Ex : vinyles, lampe, vélo..."
                    className="min-w-0 flex-1 rounded-[16px] border border-[#E6EFEB] bg-white px-3 text-[14px] font-medium outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addCustom("looking")}
                    className="h-11 rounded-[16px] bg-[#08755C] px-4 text-[13px] font-black text-white"
                  >
                    Ajouter
                  </button>
                </div>

                {lookingFor.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {lookingFor.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setLookingFor((current) => current.filter((value) => value !== item))}
                        className="rounded-full border border-[#BFE8DA] bg-[#EAF8F4] px-3 py-2 text-[12.5px] font-black text-[#08755C]"
                      >
                        {item} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {PREFERENCE_CARDS.map((card) => (
                  <PreferenceCard
                    key={card.id}
                    card={card}
                    selected={lookingFor.includes(card.label)}
                    onClick={() => toggleIn(lookingFor, setLookingFor, card.label, 12)}
                  />
                ))}
              </div>
            </div>
          )}

          {mode === "not" && (
            <div className="mt-5">
              <div className="mb-4 rounded-[24px] border border-[#E8F1ED] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <p className="text-[14px] font-black text-[#081225]">Ce que tu ne recherches pas</p>
                <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-slate-500">
                  Ça évite les propositions inutiles et rend les échanges plus simples.
                </p>

                <div className="mt-3 flex gap-2">
                  <input
                    value={customNotLooking}
                    onChange={(event) => setCustomNotLooking(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCustom("not");
                      }
                    }}
                    placeholder="Ex : meubles lourds, vêtements..."
                    className="min-w-0 flex-1 rounded-[16px] border border-[#E6EFEB] bg-white px-3 text-[14px] font-medium outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addCustom("not")}
                    className="h-11 rounded-[16px] bg-[#40545B] px-4 text-[13px] font-black text-white"
                  >
                    Ajouter
                  </button>
                </div>

                {notLookingFor.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {notLookingFor.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setNotLookingFor((current) => current.filter((value) => value !== item))}
                        className="rounded-full border border-[#E4EAEA] bg-[#F5F7F6] px-3 py-2 text-[12.5px] font-black text-[#40545B]"
                      >
                        {item} ×
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-[13px] font-medium text-slate-400">Rien exclu pour l’instant.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {PREFERENCE_CARDS.map((card) => (
                  <PreferenceCard
                    key={card.id}
                    card={card}
                    selected={notLookingFor.includes(card.label)}
                    onClick={() => toggleIn(notLookingFor, setNotLookingFor, card.label, 12)}
                  />
                ))}
              </div>
            </div>
          )}

          {mode === "universe" && (
            <div className="mt-5">
              <div className="grid grid-cols-2 gap-3">
                {PREFERENCE_CARDS.map((card) => (
                  <PreferenceCard
                    key={card.id}
                    card={card}
                    selected={universe.includes(card.label)}
                    onClick={() => toggleIn(universe, setUniverse, card.label, 8)}
                  />
                ))}
              </div>

              {universe.length > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenDetail(universe[0])}
                  className="mt-5 flex w-full items-center justify-between rounded-[22px] border border-[#E8F1ED] bg-white p-4 text-left shadow-[0_10px_28px_rgba(15,23,42,0.04)]"
                >
                  <span>
                    <span className="block text-[14px] font-black">Voir ton univers</span>
                    <span className="mt-1 block text-[12px] font-medium text-slate-500">{universe.join(", ")}</span>
                  </span>
                  <ChevronRight size={18} className="text-slate-400" />
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

function PreferenceDetailScreen({ user, label, items, profile, onBack, onEdit }) {
  const relatedItems = items.slice(0, 6);

  return (
    <PageShell user={user}>
      <div className="mx-auto w-full max-w-[980px] px-6 pt-[max(12px,env(safe-area-inset-top))] lg:px-10 xl:px-0">
        <MobileTopBar
          title={label}
          onBack={onBack}
          right={<MoreHorizontal size={20} />}
        />

        <section>
          <div className="relative overflow-hidden rounded-[28px] bg-slate-900 shadow-[0_16px_42px_rgba(15,23,42,0.14)]">
            <img src={PREFERENCE_CARDS.find((card) => card.label === label)?.image || PREFERENCE_CARDS[0].image} alt="" className="h-[210px] w-full object-cover opacity-82" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/76 via-slate-950/18 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <h1 className="text-[26px] font-black tracking-[-0.055em]">Tu aimes le {label.toLowerCase()}</h1>
              <p className="mt-2 max-w-[280px] text-[14px] font-medium leading-relaxed text-white/86">
                Objets avec histoire, matières nobles et design intemporel.
              </p>
              <button type="button" onClick={onEdit} className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-black text-[#081225]">
                <Edit3 size={15} />
                Modifier mes préférences
              </button>
            </div>
          </div>

          <section className="mt-8">
            <SectionTitle title="Inspirations" />
            <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {PREFERENCE_CARDS.slice(0, 5).map((card) => (
                <div key={card.id} className="h-[120px] min-w-[132px] overflow-hidden rounded-[22px]">
                  <img src={card.image} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <SectionTitle title="Objets correspondants" action={<Link to="/feed" className="text-[13px] font-black text-[#08755C]">Voir tout</Link>} />
            {relatedItems.length ? (
              <div className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {relatedItems.map((item) => (
                  <ObjectCard key={item.id} item={item} profile={profile} />
                ))}
              </div>
            ) : (
              <EmptyBlock title="Aucun objet pour l’instant" text="Les objets liés à tes envies apparaîtront ici." />
            )}
          </section>
        </section>
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
  const [detailPreference, setDetailPreference] = useState("");

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

  if (preferencesOpen) {
    return (
      <PreferencesScreen
        user={user}
        profile={profile}
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
        onOpenDetail={(label) => {
          setPreferencesOpen(false);
          setDetailPreference(label);
        }}
        onSaved={(payload) => setProfile((current) => ({ ...(current || {}), ...payload }))}
      />
    );
  }

  if (detailPreference) {
    return (
      <PreferenceDetailScreen
        user={user}
        label={detailPreference}
        items={items}
        profile={profile}
        onBack={() => setDetailPreference("")}
        onEdit={() => {
          setDetailPreference("");
          setPreferencesOpen(true);
        }}
      />
    );
  }

  return (
    <PageShell user={user}>
      <div className="mx-auto w-full max-w-[1180px] px-6 pt-[max(8px,env(safe-area-inset-top))] lg:px-10 lg:pt-0 xl:px-0">
        <div className="hidden lg:block">
          <TrocoPageHeader user={user} showLogo={false} showNotifications={false} showAvatar={false} eyebrow="Profil" title="Mon profil" subtitle="Ton univers Troco, tes objets et tes envies d’échange." compact />
        </div>

        <section className=" sm:grid-cols-[140px_1fr] sm:items-center">
            <div className="flex justify-start">
              <Avatar user={user} profile={profile} onEdit={() => navigate("/profile/edit")} />
            

            <div className="text-left">
              <h1 className="text-[44px] font-black leading-[0.95] tracking-[-0.065em] text-[#081225] sm:text-[58px]">
                {displayName(user, profile)}
              </h1>
              <p className="mt-3 text-[16px] font-black tracking-[-0.025em] text-[#0f9f9a]">{handleName(user, profile)}</p>
              <p className="mt-3 flex items-center gap-2 text-[16px] font-black text-slate-500">
                <MapPin size={19} className="text-[#4B9D8D]" />
                {locationName(profile)}
              </p>
              <p className="mt-5 max-w-[430px] text-[16px] font-semibold leading-relaxed tracking-[-0.025em] text-[#40545B]">
                {bioText(profile)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <StatCapsule icon={CheckCircle2} number={profile?.completedExchanges || profile?.exchangeCount || 0} label="échanges" />
            <StatCapsule icon={Package} number={items.length} label={items.length > 1 ? "objets" : "objet"} />
            <StatCapsule icon={Heart} number={favoriteItems.length} label="favoris" />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-[420px]">
            <ActionButton icon={Edit3} onClick={() => navigate("/profile/edit")}>Modifier</ActionButton>
            <ActionButton
              icon={LogOut}
              onClick={async () => {
                await signOut(auth);
                navigate("/login", { replace: true });
              }}
            >
              Déconnexion
            </ActionButton>
          </div>
        </section>

        <section className="mt-9">
          <SectionTitle title="Ses objets" action={items.length > 0 ? <Link to="/library" className="flex items-center gap-1 text-[13px] font-black text-[#08755C]">Voir tout <ChevronRight size={16} /></Link> : null} />
          {items.length ? (
            <div className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {items.map((item) => <ObjectCard key={item.id} item={item} profile={profile} />)}
            </div>
          ) : (
            <EmptyBlock icon={Package} title="Aucun objet publié" text="Ajoute ton premier objet pour commencer à échanger." />
          )}
        </section>

        <section className="mt-9">
          <SectionTitle title="Mes préférences d’échange" />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[28px] border border-[#E8F1ED] bg-white/88 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#08755C]">
                  Je recherche
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setPreferenceMode("looking");
                    setPreferencesOpen(true);
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#16C7C1] to-[#31D67B] text-white shadow-[0_10px_22px_rgba(20,184,166,0.16)] transition active:scale-95"
                  aria-label="Modifier ce que je recherche"
                >
                  +
                </button>
              </div>

              {lookingFor.length ? (
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {lookingFor.map((item, index) => {
                    const icons = [Car, Zap, Home, Tag, Music, Sparkles];
                    return <Chip key={item} icon={icons[index % icons.length]} active>{item}</Chip>;
                  })}
                </div>
              ) : (
                <EmptyBlock icon={Search} title="Aucune envie renseignée" text="Ajoute ce que tu aimerais recevoir en échange." />
              )}
            </div>

            <div className="rounded-[28px] border border-[#E8F1ED] bg-white/88 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#40545B]">
                  Je ne recherche pas
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setPreferenceMode("not");
                    setPreferencesOpen(true);
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E4EAEA] bg-white text-[#40545B] shadow-[0_10px_22px_rgba(15,23,42,0.055)] transition active:scale-95"
                  aria-label="Modifier ce que je ne recherche pas"
                >
                  +
                </button>
              </div>

              {notLookingFor.length ? (
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {notLookingFor.map((item) => (
                    <Chip key={item}>{item}</Chip>
                  ))}
                </div>
              ) : (
                <EmptyBlock icon={X} title="Aucune exclusion renseignée" text="Ajoute ce que tu préfères ne pas recevoir." />
              )}
            </div>
          </div>
        </section>

        <section className="mt-9">
          <SectionTitle title="Activité récente" />
          <div className="rounded-[28px] border border-[#E8F1ED] bg-white/88 px-4 shadow-[0_12px_34px_rgba(15,23,42,0.04)]">
            {latestItem && <ActivityRow icon={Package} title="A ajouté un objet" subtitle={itemTitle(latestItem)} time={relativeDate(latestItem?.createdAt || latestItem?.updatedAt)} />}
            <ActivityRow icon={CheckCircle2} title="A confirmé un échange" subtitle="Profil actif sur Troco" time="récemment" />
            <ActivityRow icon={MessageCircle} title="Répond rapidement aux messages" subtitle="Taux de réponse élevé" time="toujours" />
          </div>
        </section>

        {favoriteItems.length > 0 && (
          <section className="mt-9">
            <SectionTitle title="Favoris" />
            <div className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {favoriteItems.map((item) => <ObjectCard key={item.id} item={item} profile={profile} />)}
            </div>
          </section>
        )}
      </div>

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
