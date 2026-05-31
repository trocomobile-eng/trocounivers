import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import {
  ArrowLeft,
  Camera,
  Check,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
  Wand2,
  MapPin,
} from "lucide-react";

import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import TradePreferencesForm from "../components/TradePreferencesForm";
import {
  buildCleanItemFromSuggestion,
  getItemSuggestions,
} from "../utils/itemSuggestions";

const CONDITION_OPTIONS = [
  "Comme neuf",
  "Très bon état",
  "Bon état",
  "Quelques traces d’usage",
  "Usé mais fonctionnel",
];

const CATEGORY_OPTIONS = [
  "Maison",
  "Tech",
  "Mode",
  "Musique",
  "Livres",
  "Sport",
  "Enfants",
  "Autre",
];


function getGeoPoint(value) {
  if (!value) return null;

  if (typeof value.lat === "number" && typeof value.lng === "number") {
    return { lat: value.lat, lng: value.lng };
  }

  if (typeof value.latitude === "number" && typeof value.longitude === "number") {
    return { lat: value.latitude, lng: value.longitude };
  }

  return null;
}

function SectionCard({ children, className = "" }) {
  return (
    <section
      className={[
        "rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.07)]",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-[14px] font-black text-[#081225]">{label}</span>

      {hint && (
        <span className="mt-1 block text-[13px] font-medium leading-relaxed text-slate-500">
          {hint}
        </span>
      )}

      <div className="mt-3">{children}</div>
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={[
        "h-[50px] w-full rounded-[18px] border border-slate-100 bg-white px-4 text-[15px] font-semibold text-[#081225] outline-none transition placeholder:text-slate-400 focus:border-emerald-200 focus:ring-4 focus:ring-emerald-50",
        props.className || "",
      ].join(" ")}
    />
  );
}

function SuggestionChip({ suggestion, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[13px] font-black transition active:scale-[0.98]",
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-100 bg-white text-slate-600 shadow-[0_5px_14px_rgba(15,23,42,0.025)]",
      ].join(" ")}
    >
      {active && <Check size={14} strokeWidth={2.8} />}
      {suggestion.label}
    </button>
  );
}

export default function AddItemPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [rawTitle, setRawTitle] = useState("");
  const [title, setTitle] = useState("");
  const [itemDetails, setItemDetails] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("Très bon état");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Paris");
  const [availability, setAvailability] = useState("");
  const [photos, setPhotos] = useState([]);
  const [selectedSuggestionKey, setSelectedSuggestionKey] = useState("");
  const [tradePreferences, setTradePreferences] = useState({
    categories: [],
    ideas: "",
    openToSurprises: true,
  });
  const [saving, setSaving] = useState(false);
  const [useMyLocation, setUseMyLocation] = useState(true);

  const suggestions = useMemo(() => getItemSuggestions(rawTitle), [rawTitle]);

  const previewUrls = useMemo(
    () => photos.map((photo) => photo.previewUrl),
    [photos]
  );

  function handleRawTitleChange(value) {
    setRawTitle(value);

    if (!title || title === rawTitle) {
      setTitle(value);
    }
  }

  function applySuggestion(suggestion) {
  const cleanItem = buildCleanItemFromSuggestion(rawTitle, suggestion);

  if (!cleanItem) return;

  setSelectedSuggestionKey(suggestion.id || suggestion.label);

  if (!title) {
    setTitle(cleanItem.itemType || suggestion.label || rawTitle);
  }

  if (cleanItem.itemDetails) {
    setItemDetails(cleanItem.itemDetails);
  }

  if (cleanItem.category) {
    setCategory(cleanItem.category);
  }
}
  function handleCategoryClick(nextCategory) {
    setCategory(nextCategory);
  }

  function handlePhotoSelection(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const nextPhotos = files.slice(0, 6 - photos.length).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID?.() || Date.now()}`,
    }));

    setPhotos((current) => [...current, ...nextPhotos].slice(0, 6));
    event.target.value = "";
  }

  function removePhoto(photoId) {
    setPhotos((current) => {
      const photo = current.find((item) => item.id === photoId);
      if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);

      return current.filter((item) => item.id !== photoId);
    });
  }

  async function uploadPhotos(itemId) {
    if (!photos.length) return [];

    const urls = [];

    for (const photo of photos) {
      const safeName = photo.file.name.replace(/\s+/g, "-").toLowerCase();
      const storageRef = ref(
        storage,
        `items/${itemId}/${Date.now()}-${safeName}`
      );

      await uploadBytes(storageRef, photo.file);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }

    return urls;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user?.uid) {
      navigate("/login");
      return;
    }

    const finalTitle = title.trim() || rawTitle.trim();

    if (!finalTitle) {
      alert("Ajoute un nom d’objet.");
      return;
    }

    setSaving(true);

    try {
      let ownerLocation = null;

      if (useMyLocation && user?.uid) {
        const userSnapshot = await getDoc(doc(db, "users", user.uid));
        ownerLocation = getGeoPoint(userSnapshot.data()?.location);
      }

      const draftRef = await addDoc(collection(db, "items"), {
        title: finalTitle,
        itemType: finalTitle,
        generatedTitle: finalTitle,
        itemDetails: itemDetails.trim(),
        category: category.trim() || "Autre",
        condition,
        description: description.trim(),
        location: location.trim() || "Paris",
        locationArea: location.trim() || "Paris",
        locationPrivacy: "approximate",
        geo: ownerLocation,
        hasGeo: Boolean(ownerLocation),
        availability: availability.trim(),
        images: [],
        imageUrl: "",
        tradePreferences,
        ownerId: user.uid,
        userId: user.uid,
        ownerEmail: user.email || "",
        ownerName: user.displayName || user.email || "Utilisateur Troco",
        ownerPhotoURL: user.photoURL || "",
        status: "available",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const imageUrls = await uploadPhotos(draftRef.id);

      if (imageUrls.length) {
        const { updateDoc, doc } = await import("firebase/firestore");

        await updateDoc(doc(db, "items", draftRef.id), {
          images: imageUrls,
          imageUrl: imageUrls[0],
          updatedAt: serverTimestamp(),
        });
      }

      navigate(`/items/${draftRef.id}`, { replace: true });
    } catch (error) {
      console.error("Erreur publication objet :", error);
      alert(
        "Impossible de publier l’objet. Vérifie que Firebase Storage est bien configuré."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <main className="mx-auto w-full max-w-[430px] px-4 pt-[max(14px,env(safe-area-inset-top))] lg:max-w-4xl lg:px-8 lg:pt-10">
        <header className="mb-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-[#E4ECE8] bg-white text-[#0d1b2a] shadow-[0_2px_8px_rgba(15,23,42,0.07)] transition active:scale-95"
            aria-label="Retour"
          >
            <ArrowLeft size={21} strokeWidth={2.4} />
          </button>

          <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#0f9f9a]">
            Publier
          </p>

          <h1 className="mt-2 text-[38px] font-black leading-[0.94] tracking-[-0.06em] text-[#081225] lg:text-[58px]">
            Ajouter un objet
          </h1>

          <p className="mt-3 max-w-[330px] text-[16px] font-medium leading-relaxed text-slate-500">
            Décris-le simplement. Troco t’aide à choisir le bon titre et la bonne catégorie.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <SectionCard className="p-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={[
                "relative flex min-h-[118px] w-full flex-col items-center justify-center overflow-hidden rounded-[26px] border border-dashed transition active:scale-[0.99]",
                previewUrls.length
                  ? "border-transparent bg-slate-100"
                  : "border-emerald-200 bg-emerald-50/35 text-[#0f9f9a]",
              ].join(" ")}
            >
              {previewUrls.length ? (
                <img
                  src={previewUrls[0]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <>
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#0f9f9a] shadow-[0_8px_20px_rgba(15,23,42,0.035)]">
                    <ImagePlus size={26} strokeWidth={2.2} />
                  </span>

                  <span className="mt-4 text-[17px] font-black">
                    Ajouter des photos
                  </span>

                  <span className="mt-1 text-[13px] font-semibold text-slate-500">
                    Jusqu’à 6 images
                  </span>
                </>
              )}

              {previewUrls.length > 0 && (
                <span className="absolute bottom-3 left-3 rounded-full bg-white/88 px-3 py-1.5 text-[12px] font-black text-slate-700 shadow-sm backdrop-blur">
                  {previewUrls.length} photo{previewUrls.length > 1 ? "s" : ""}
                </span>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelection}
              className="hidden"
            />

            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-6 gap-2">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square overflow-hidden rounded-[14px] bg-slate-100"
                  >
                    <img
                      src={photo.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm backdrop-blur"
                      aria-label="Supprimer la photo"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}

                {photos.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square items-center justify-center rounded-[14px] border border-dashed border-emerald-200 bg-white/75 text-[#0f9f9a]"
                  >
                    <ImagePlus size={18} strokeWidth={2.2} />
                  </button>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-emerald-50 text-emerald-700">
                <Wand2 size={21} strokeWidth={2.25} />
              </span>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
                  Objet
                </p>

                <h2 className="text-[24px] font-black leading-tight tracking-[-0.05em] text-[#081225]">
                 Qu'as-tu à proposer ?
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              

              {suggestions.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[13px] font-black text-[#0f9f9a]">
                    <Sparkles size={15} strokeWidth={2.4} />
                    Suggestions Troco
                  </div>

                  <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex min-w-max gap-2 px-1">
                      {suggestions.map((suggestion) => (
                        <SuggestionChip
                          key={suggestion.id || suggestion.label}
                          suggestion={suggestion}
                          active={selectedSuggestionKey === (suggestion.id || suggestion.label)}
                          onClick={() => applySuggestion(suggestion)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Field label={`Titre affiché ${title.length > 0 ? `(${title.length}/15)` : ""}`} hint={title.length > 45 ? "Trop long, raccourcis pour un meilleur affichage." : ""}>
                  <TextInput
                    value={title}
                    onChange={(event) => setTitle(event.target.value.slice(0, 15))}
                    placeholder="Ex : Guitare folk"
                    maxLength={15}
                  />
                </Field>

                <Field label="Détail utile">
                  <TextInput
                    value={itemDetails}
                    onChange={(event) => setItemDetails(event.target.value)}
                    placeholder="Marque, couleur, modèle..."
                  />
                </Field>
              </div>

              <Field label="Catégorie">
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleCategoryClick(option)}
                      className={[
                        "rounded-full border px-3 py-2 text-[13px] font-black transition active:scale-[0.98]",
                        category === option
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-100 bg-white text-slate-600",
                      ].join(" ")}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="État">
                <div className="grid grid-cols-2 gap-2">
                  {CONDITION_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCondition(option)}
                      className={[
                        "rounded-[17px] border px-3 py-3 text-left text-[13px] font-black transition active:scale-[0.98]",
                        condition === option
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-100 bg-white text-slate-600",
                      ].join(" ")}
                    >
                      {condition === option && <Check size={15} className="mb-1" strokeWidth={2.8} />}
                      {option}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </SectionCard>

          <SectionCard>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
              Détails
            </p>

            <h2 className="mt-1 text-[24px] font-black tracking-[-0.05em] text-[#081225]">
              Un peu de contexte
            </h2>

            <div className="mt-5 space-y-4">
              <Field label="Description">
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-[96px] w-full rounded-[18px] border border-slate-100 bg-white px-4 py-3 text-[15px] font-medium leading-relaxed text-[#081225] outline-none placeholder:text-slate-400 focus:border-emerald-200 focus:ring-4 focus:ring-emerald-50"
                  placeholder="Ex : je ne l’utilise plus depuis mon déménagement..."
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Localisation"
                  hint="Visible publiquement sous forme approximative, jamais comme adresse exacte."
                >
                  <TextInput
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Paris 18e, Montmartre..."
                  />

                  <button
                    type="button"
                    onClick={() => setUseMyLocation((value) => !value)}
                    className={[
                      "mt-3 flex w-full items-center justify-between gap-3 rounded-[18px] border px-4 py-3 text-left text-[13px] font-bold transition active:scale-[0.99]",
                      useMyLocation
                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                        : "border-slate-100 bg-white text-slate-500",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin size={16} strokeWidth={2.25} />
                      Associer cet objet à ma position approximative
                    </span>

                    <span>{useMyLocation ? "Oui" : "Non"}</span>
                  </button>
                </Field>

                <Field label="Disponibilité">
                  <TextInput
                    value={availability}
                    onChange={(event) => setAvailability(event.target.value)}
                    placeholder="Soirs, week-end..."
                  />
                </Field>
              </div>
            </div>
          </SectionCard>

          <TradePreferencesForm
            value={tradePreferences}
            onChange={setTradePreferences}
          />

         
          <div className="sticky bottom-6 z-30 -mx-1 rounded-[24px] border border-[#E4ECE8] bg-white p-3 shadow-[0_4px_20px_rgba(15,23,42,0.10)]">
            <button
              type="submit"
              disabled={saving}
              className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-[#2ECC8A] to-cyan-400 text-[16px] font-black text-white shadow-[0_12px_28px_rgba(46,204,138,0.16)] transition active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Publication...
                </>
              ) : (
                "Publier l’objet"
              )}
            </button>
          </div>
        </form>
      </main>

    </>
  );
}
