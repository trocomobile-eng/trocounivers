import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Check,
  Mail,
  MapPin,
  Phone,
  Save,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useNavigate } from "react-router-dom";

import { auth, db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import TrocoPageHeader from "../components/TrocoPageHeader";
import { TrocoButton, TrocoCard } from "../components/UI";
import PreferenceModal from "../components/profile/PreferenceModal";
import { getTradePreferences } from "../components/profile/profileUtils";

const CITY_OPTIONS = [
  "Paris",
  "Marseille",
  "Lyon",
  "Toulouse",
  "Nice",
  "Nantes",
  "Montpellier",
  "Strasbourg",
  "Bordeaux",
  "Lille",
  "Rennes",
  "Grenoble",
  "Aix-en-Provence",
  "Bruxelles",
];

function getInitial(value = "") {
  return String(value || "T").trim().charAt(0).toUpperCase() || "T";
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const [profile, setProfile] = useState({});
  const [photoURL, setPhotoURL] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Paris");
  const [customCity, setCustomCity] = useState("");
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferenceMode, setPreferenceMode] = useState("looking");


  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const resolvedCity = useMemo(() => {
    const cleanCustom = customCity.trim();
    if (city === "__custom__") return cleanCustom;
    return city.trim();
  }, [city, customCity]);

  const tradePrefs = useMemo(() => getTradePreferences(profile || {}), [profile]);
  const lookingFor = tradePrefs.lookingFor || [];
  const notLookingFor = tradePrefs.notLookingFor || [];

  useEffect(() => {
    if (!user?.uid) return;

    async function loadProfile() {
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        const data = snapshot.exists() ? snapshot.data() : {};
        const loadedCity = data.city || data.locationCity || data.location || "Paris";
        const isKnownCity = CITY_OPTIONS.includes(loadedCity);

        setProfile(data);
        setPhotoURL(data.photoURL || data.photoUrl || user?.photoURL || "");
        setDisplayName(data.displayName || data.name || user?.displayName || "");
        setUsername(data.username || data.handle || "");
        setEmail(data.email || user?.email || "");
        setPhone(data.phone || data.phoneNumber || "");
        setCity(isKnownCity ? loadedCity : "__custom__");
        setCustomCity(isKnownCity ? "" : loadedCity);
      } catch (error) {
        console.error("Erreur chargement profil :", error);
      }
    }

    loadProfile();
  }, [user?.uid, user?.displayName, user?.email, user?.photoURL]);

  function markDirty() {
    setSaved(false);
  }


  async function handlePhotoFile(event) {
    const file = event.target.files?.[0];
    if (!file || !user?.uid || uploading) return;

    if (!file.type.startsWith("image/")) {
      alert("Choisis une image.");
      return;
    }

    setUploading(true);
    setSaved(false);

    try {
      const extension = file.name.split(".").pop() || "jpg";
      const storageRef = ref(storage, `users/${user.uid}/profile/avatar-${Date.now()}.${extension}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(user, { photoURL: downloadURL });

      await setDoc(
        doc(db, "users", user.uid),
        { photoURL: downloadURL, photoUrl: downloadURL, updatedAt: serverTimestamp() },
        { merge: true }
      );

      setPhotoURL(downloadURL);
      setSaved(true);
    } catch (error) {
      console.error("Erreur upload photo :", error);
      alert("Impossible de modifier la photo. Vérifie aussi tes règles Firebase Storage.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function saveProfile() {
    if (!user?.uid) return;

    const cleanName = displayName.trim();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanCity = resolvedCity || "Paris";

    if (!cleanName) {
      alert("Ajoute ton nom ou pseudo.");
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      if (auth.currentUser) {
        const authUpdates = {};
        if (cleanName !== auth.currentUser.displayName) authUpdates.displayName = cleanName;
        if (photoURL && photoURL !== auth.currentUser.photoURL) authUpdates.photoURL = photoURL;
        if (Object.keys(authUpdates).length > 0) {
          await updateProfile(auth.currentUser, authUpdates);
        }
      }

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          displayName: cleanName,
          name: cleanName,
          username: cleanUsername,
          handle: cleanUsername,
          email: cleanEmail,
          phone: cleanPhone,
          phoneNumber: cleanPhone,
          city: cleanCity,
          location: cleanCity,
          locationCity: cleanCity,
          photoURL: photoURL || user?.photoURL || "",
          photoUrl: photoURL || user?.photoURL || "",
          onboardingCompleted: true,
          profileCompleted: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSaved(true);

setTimeout(() => {
  navigate("/feed");
}, 500);    } catch (error) {
      console.error("Erreur sauvegarde profil :", error);
      alert("Impossible d'enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TrocoPageHeader
  showBack
  onBack={() => navigate(-1)}
  eyebrow="Profil"
  title="Modifier mon profil"
  showNotifications={false}
  showAvatar={false}
  compact
/>

      <main className="mx-auto max-w-4xl space-y-5 px-4 pb-10">
        {/* Photo de profil */}
        <TrocoCard
          variant="plain"
          className="overflow-hidden rounded-[34px] border border-white/75 bg-white/80 shadow-[0_18px_48px_rgba(15,23,42,0.05)] backdrop-blur-sm"
        >
          <div className="h-[112px] bg-[linear-gradient(135deg,rgba(45,212,191,0.18),rgba(255,255,255,0.82)),url('https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center" />

          <div className="px-6 pb-6">
            <div className="-mt-9 flex items-end gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-[5px] border-white bg-[#F1F8F4] shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
                {photoURL ? (
                  <img src={photoURL} alt="Profil" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1ABEA3] to-[#36C982] text-2xl font-black text-white">
                    {getInitial(displayName || email)}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0f9f9a] shadow-[0_6px_16px_rgba(15,23,42,0.12)] disabled:opacity-50"
                  aria-label="Modifier la photo"
                >
                  <Camera size={17} strokeWidth={2.25} />
                </button>
              </div>

              <div className="pb-0">
                <p className="text-[12px] font-black uppercase tracking-[0.20em] text-[#0f9f9a]">
                  Photo de profil
                </p>
                <p className="mt-1 text-[14px] font-medium leading-relaxed text-slate-500">
                  {uploading ? "Upload en cours..." : "Clique sur la photo pour modifier."}
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoFile}
              className="hidden"
            />
          </div>
        </TrocoCard>

        {/* Informations */}
        <TrocoCard
          variant="plain"
          className="rounded-[28px] border border-white/75 bg-white/80 p-5 shadow-[0_12px_30px_rgba(20,184,166,0.045)] backdrop-blur-sm"
        >
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
            Informations
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-[13px] font-black text-slate-600">Nom</span>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-[18px] border border-teal-100 bg-white/90 px-4">
                <UserRound size={17} className="text-[#0f9f9a]" />
                <input
                  value={displayName}
                  onChange={(event) => { setDisplayName(event.target.value); markDirty(); }}
                  placeholder="Ton nom ou pseudo"
                  className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-slate-700 outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[13px] font-black text-slate-600">Pseudo</span>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-[18px] border border-teal-100 bg-white/90 px-4">
                <UserRound size={17} className="text-[#0f9f9a]" />
                <input
                  value={username}
                  onChange={(event) => { setUsername(event.target.value); markDirty(); }}
                  placeholder="Ex : alex.t"
                  className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-slate-700 outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[13px] font-black text-slate-600">Email</span>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-[18px] border border-teal-100 bg-white/90 px-4">
                <Mail size={17} className="text-[#0f9f9a]" />
                <input
                  value={email}
                  onChange={(event) => { setEmail(event.target.value); markDirty(); }}
                  placeholder="ton@email.com"
                  className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-slate-700 outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[13px] font-black text-slate-600">Téléphone</span>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-[18px] border border-teal-100 bg-white/90 px-4">
                <Phone size={17} className="text-[#0f9f9a]" />
                <input
                  value={phone}
                  onChange={(event) => { setPhone(event.target.value); markDirty(); }}
                  placeholder="06 12 34 56 78"
                  className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-slate-700 outline-none"
                />
              </div>
            </label>

            <label className="block md:col-span-2">
              <span className="text-[13px] font-black text-slate-600">Ville</span>
              <div className="mt-2 grid gap-3 md:grid-cols-[260px_minmax(0,1fr)]">
                <div className="flex h-12 items-center gap-3 rounded-[18px] border border-teal-100 bg-white/90 px-4">
                  <MapPin size={17} className="text-[#0f9f9a]" />
                  <select
                    value={city}
                    onChange={(event) => { setCity(event.target.value); markDirty(); }}
                    className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-slate-700 outline-none"
                  >
                    {CITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                    <option value="__custom__">Autre ville…</option>
                  </select>
                </div>

                {city === "__custom__" && (
                  <input
                    value={customCity}
                    onChange={(event) => { setCustomCity(event.target.value); markDirty(); }}
                    placeholder="Ex : Marseille, Bruxelles, Montréal..."
                    className="h-12 rounded-[18px] border border-teal-100 bg-white/90 px-4 text-[14px] font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                  />
                )}
              </div>
            </label>
          </div>
        </TrocoCard>


        {/* Préférences d'échange */}
        <TrocoCard
          variant="plain"
          className="rounded-[28px] border border-white/75 bg-white/80 p-5 shadow-[0_12px_30px_rgba(20,184,166,0.045)] backdrop-blur-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
                Préférences d'échange
              </p>
              <p className="mt-1 text-[14px] font-medium leading-relaxed text-slate-500">
                Ajoute ce que tu aimerais recevoir et ce que tu préfères éviter.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-[#E4ECE8] bg-white/86 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#08755C]">
                  Je recherche
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setPreferenceMode("looking");
                    setPreferencesOpen(true);
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#16C7C1] to-[#31D67B] text-white shadow-[0_10px_22px_rgba(20,184,166,0.16)] transition active:scale-95"
                  aria-label="Ajouter ce que je recherche"
                >
                  +
                </button>
              </div>

              {lookingFor.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {lookingFor.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#BFE8DA] bg-[#EAF8F4] px-3 py-1.5 text-[12px] font-black text-[#08755C]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 rounded-[18px] border border-dashed border-[#DDEBE5] bg-[#F8FCFA] p-3 text-[13px] font-semibold text-slate-400">
                  <Search size={16} />
                  Aucune envie renseignée
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-[#E4ECE8] bg-white/86 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#40545B]">
                  Je ne recherche pas
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setPreferenceMode("not");
                    setPreferencesOpen(true);
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E4EAEA] bg-white text-[#40545B] shadow-[0_10px_22px_rgba(15,23,42,0.055)] transition active:scale-95"
                  aria-label="Ajouter ce que je ne recherche pas"
                >
                  +
                </button>
              </div>

              {notLookingFor.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {notLookingFor.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#E4EAEA] bg-[#F5F7F6] px-3 py-1.5 text-[12px] font-black text-[#40545B]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 rounded-[18px] border border-dashed border-[#DDEBE5] bg-[#F8FCFA] p-3 text-[13px] font-semibold text-slate-400">
                  <X size={16} />
                  Aucune exclusion renseignée
                </div>
              )}
            </div>
          </div>
        </TrocoCard>

        {/* Bouton sauvegarde bas de page */}
        <TrocoButton
          onClick={saveProfile}
          disabled={saving}
          className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[22px] text-[15px] font-black disabled:opacity-50"
        >
          {saved ? <Check size={19} /> : <Save size={18} />}
          {saving ? "Sauvegarde..." : saved ? "Profil sauvegardé" : "Enregistrer les modifications"}
        </TrocoButton>
      </main>

      <PreferenceModal
        open={preferencesOpen}
        mode={preferenceMode}
        profile={profile}
        user={user}
        onClose={() => setPreferencesOpen(false)}
        onSaved={(payload) => setProfile((current) => ({ ...(current || {}), ...payload }))}
      />
    </>
  );
}
