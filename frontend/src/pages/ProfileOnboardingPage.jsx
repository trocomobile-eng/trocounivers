import { useEffect, useRef, useState } from "react";
import { Camera, Check, ChevronRight, MapPin, Sparkles, UserRound } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useLocation, useNavigate } from "react-router-dom";

import { auth, db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";

const PREFERENCE_OPTIONS = [
  "Maison",
  "Musique",
  "Livres",
  "Mode",
  "Tech",
  "Sport",
  "Jeux",
  "Déco",
  "Plantes",
  "Vintage",
  "Appareils photo",
  "Objets utiles",
];

function clean(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function getInitial(value = "") {
  return clean(value).charAt(0).toUpperCase() || "T";
}

export default function ProfileOnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("Paris");
  const [photoURL, setPhotoURL] = useState("");
  const [preferences, setPreferences] = useState([]);
  const [customPreference, setCustomPreference] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    async function loadProfile() {
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        const data = snapshot.exists() ? snapshot.data() : {};
        const prefs = data?.tradePreferences?.lookingFor || data?.lookingFor || data?.wantedItems || [];

        setDisplayName(data.displayName || user.displayName || user.email?.split("@")[0] || "");
        setBio(data.bio || data.description || data.about || "");
        setCity(data.city || data.locationCity || data.location || "Paris");
        setPhotoURL(data.photoURL || data.photoUrl || user.photoURL || "");
        setPreferences(Array.isArray(prefs) ? prefs.filter(Boolean).slice(0, 12) : []);
      } catch (error) {
        console.error("Erreur chargement onboarding profil :", error);
      }
    }

    loadProfile();
  }, [user?.uid, user?.displayName, user?.email, user?.photoURL]);

  function togglePreference(label) {
    setPreferences((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label].slice(0, 12)
    );
  }

  function addCustomPreference() {
    const value = clean(customPreference);
    if (!value) return;

    setPreferences((current) => [...new Set([...current, value])].slice(0, 12));
    setCustomPreference("");
  }

  async function handlePhotoFile(event) {
    const file = event.target.files?.[0];
    if (!file || !user?.uid || uploading) return;

    if (!file.type.startsWith("image/")) {
      alert("Choisis une image.");
      return;
    }

    setUploading(true);

    try {
      const { compressImage } = await import("../utils/compressImage");
      const compressed = await compressImage(file);
      const storageRef = ref(storage, `users/${user.uid}/profile/avatar-${Date.now()}.jpg`);

      await uploadBytes(storageRef, compressed);
      const downloadURL = await getDownloadURL(storageRef);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
      }

      await setDoc(
        doc(db, "users", user.uid),
        { photoURL: downloadURL, photoUrl: downloadURL, updatedAt: serverTimestamp() },
        { merge: true }
      );

      setPhotoURL(downloadURL);
    } catch (error) {
      console.error("Erreur upload photo onboarding :", error);
      alert("Impossible d'ajouter la photo pour le moment.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!user?.uid || saving) return;

    const cleanName = clean(displayName);
    const cleanBio = clean(bio);
    const cleanCity = clean(city) || "Paris";

    if (!cleanName) {
      alert("Ajoute ton prénom ou pseudo.");
      return;
    }

    setSaving(true);

    try {
      if (auth.currentUser) {
        const authUpdates = {};
        if (cleanName !== auth.currentUser.displayName) authUpdates.displayName = cleanName;
        if (photoURL && photoURL !== auth.currentUser.photoURL) authUpdates.photoURL = photoURL;
        if (Object.keys(authUpdates).length > 0) await updateProfile(auth.currentUser, authUpdates);
      }

      const nextPreferences = preferences.map(clean).filter(Boolean);

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          displayName: cleanName,
          name: cleanName,
          email: user.email || "",
          bio: cleanBio,
          description: cleanBio,
          about: cleanBio,
          city: cleanCity,
          location: cleanCity,
          locationCity: cleanCity,
          photoURL: photoURL || user.photoURL || "",
          photoUrl: photoURL || user.photoURL || "",
          lookingFor: nextPreferences,
          wantedItems: nextPreferences,
          searchingFor: nextPreferences,
          tradeWants: nextPreferences,
          tradePreferences: {
            lookingFor: nextPreferences,
            notLookingFor: [],
            universe: nextPreferences,
            note: "",
          },
          onboardingCompleted: true,
          profileCompleted: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const redirectTo = location.state?.redirectTo;
      navigate(redirectTo && !["/login", "/signup", "/onboarding", "/profile-onboarding"].includes(redirectTo) ? redirectTo : "/feed", { replace: true });
    } catch (error) {
      console.error("Erreur sauvegarde onboarding profil :", error);
      alert("Impossible d'enregistrer ton profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--troco-bg)] px-4 py-6 text-[#081225]">
      <form onSubmit={saveProfile} className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-[520px] flex-col justify-center">
        <div className="mb-5">
          <p className="text-[11px] font-black uppercase tracking-[0.20em] text-[#0f9f9a]">
            Ton profil
          </p>
          <h1 className="mt-2 text-[36px] font-black leading-[0.96] tracking-[-0.055em]">
            On prépare ta présence sur Troco.
          </h1>
          <p className="mt-3 text-[15px] font-medium leading-relaxed text-slate-500">
            Ces infos aident les autres membres à comprendre ce que tu aimes échanger.
          </p>
        </div>

        <section className="rounded-[30px] border border-white/80 bg-white/82 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8F7EF] text-[#0f9f9a] shadow-[0_12px_30px_rgba(15,23,42,0.08)] disabled:opacity-60"
              aria-label="Ajouter une photo"
            >
              {photoURL ? (
                <img src={photoURL} alt="Profil" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-3xl font-black">{getInitial(displayName || user?.email)}</span>
              )}
              <span className="absolute bottom-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
                <Camera size={16} strokeWidth={2.4} />
              </span>
            </button>

            <div>
              <p className="text-[15px] font-black text-[#081225]">Photo de profil</p>
              <p className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-500">
                {uploading ? "Upload en cours..." : "Optionnelle, mais ça rend le profil plus humain."}
              </p>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoFile} className="hidden" />

          <label className="mt-5 block">
            <span className="flex items-center gap-2 text-sm font-black">
              <UserRound size={16} /> Prénom ou pseudo
            </span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-2 h-12 w-full rounded-[18px] border border-[#E4ECE8] bg-white px-4 text-sm font-bold outline-none focus:border-[#1ABEA3]"
              placeholder="Ex : Alex"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-black">Bio courte</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className="mt-2 min-h-[92px] w-full rounded-[20px] border border-[#E4ECE8] bg-white px-4 py-3 text-sm font-semibold leading-relaxed outline-none focus:border-[#1ABEA3]"
              placeholder="Ex : J'aime les objets déco, les livres et les échanges simples autour d'un café."
            />
          </label>

          <label className="mt-4 block">
            <span className="flex items-center gap-2 text-sm font-black">
              <MapPin size={16} /> Ville
            </span>
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="mt-2 h-12 w-full rounded-[18px] border border-[#E4ECE8] bg-white px-4 text-sm font-bold outline-none focus:border-[#1ABEA3]"
              placeholder="Paris"
            />
          </label>
        </section>

        <section className="mt-4 rounded-[30px] border border-white/80 bg-white/82 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.045)] backdrop-blur-xl">
          <p className="flex items-center gap-2 text-sm font-black">
            <Sparkles size={16} /> Ce que tu aimerais recevoir
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {PREFERENCE_OPTIONS.map((label) => {
              const active = preferences.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => togglePreference(label)}
                  className={[
                    "flex h-10 items-center gap-1.5 rounded-full border px-3 text-[13px] font-black transition active:scale-95",
                    active
                      ? "border-transparent bg-[#1ABEA3] text-white"
                      : "border-[#E4ECE8] bg-white text-[#40545B]",
                  ].join(" ")}
                >
                  {active && <Check size={14} strokeWidth={3} />}
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={customPreference}
              onChange={(event) => setCustomPreference(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustomPreference();
                }
              }}
              className="h-11 min-w-0 flex-1 rounded-[17px] border border-[#E4ECE8] bg-white px-3 text-sm font-semibold outline-none"
              placeholder="Ajouter une idée"
            />
            <button type="button" onClick={addCustomPreference} className="h-11 rounded-[17px] bg-[#081225] px-4 text-sm font-black text-white">
              Ajouter
            </button>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving || uploading}
          className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#1ABEA3] text-[15px] font-black text-white shadow-[0_14px_30px_rgba(26,190,163,0.24)] disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : "Terminer mon profil"}
          <ChevronRight size={18} strokeWidth={2.7} />
        </button>
      </form>
    </main>
  );
}
