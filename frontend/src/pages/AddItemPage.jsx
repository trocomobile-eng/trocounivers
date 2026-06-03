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
  Check,
  ImagePlus,
  Loader2,
  MapPin,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";

import { db, storage } from "../firebase";
import { isAmbassador } from "../utils/ambassador";
import SurveyModal from "../components/SurveyModal";
import { useAuth } from "../context/AuthContext";
import {
  buildCleanItemFromSuggestion,
  getItemSuggestions,
} from "../utils/itemSuggestions";
import { AIVerificationBox } from "../components/AIVerification";

const CONDITION_OPTIONS = [
  "Comme neuf",
  "Très bon état",
  "Bon état",
  "Quelques traces d'usage",
  "Usé mais fonctionnel",
];

const CATEGORY_OPTIONS = [
  "Maison", "Tech", "Mode", "Musique",
  "Livres", "Sport", "Enfants", "Autre",
];

const TRADE_CATEGORIES = [
  "Maison", "Musique", "Tech", "Mode",
  "Livres", "Sport", "Jeux", "Déco", "Plantes",
];

function getGeoPoint(value) {
  if (!value) return null;
  if (typeof value.lat === "number" && typeof value.lng === "number")
    return { lat: value.lat, lng: value.lng };
  if (typeof value.latitude === "number" && typeof value.longitude === "number")
    return { lat: value.latitude, lng: value.longitude };
  return null;
}

function SectionCard({ children, className = "" }) {
  return (
    <section className={["rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.07)]", className].join(" ")}>
      {children}
    </section>
  );
}

function SectionTitle({ step, title }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f9f9a] text-[13px] font-black text-white">
        {step}
      </span>
      <h2 className="text-[22px] font-black tracking-[-0.04em] text-[#081225]">{title}</h2>
    </div>
  );
}

function RequiredLabel({ children }) {
  return (
    <span className="mb-2 block text-[13px] font-black text-[#081225]">
      {children} <span className="text-[#0f9f9a]">*</span>
    </span>
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

  const [showSurvey, setShowSurvey] = useState(false);
  const [publishedItemId, setPublishedItemId] = useState(null);

  // Champs objet
  const [rawTitle, setRawTitle] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("Très bon état");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Paris");
  const [useMyLocation, setUseMyLocation] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [selectedSuggestionKey, setSelectedSuggestionKey] = useState("");
  const [aiVerification, setAiVerification] = useState(null);

  // Préférences d'échange
  const [openToAll, setOpenToAll] = useState(true);
  const [tradeCategories, setTradeCategories] = useState([]);
  const [tradeIdeas, setTradeIdeas] = useState("");

  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState("");

  const suggestions = useMemo(() => getItemSuggestions(rawTitle), [rawTitle]);
  const previewUrls = useMemo(() => photos.map((p) => p.previewUrl), [photos]);

  function handleRawTitleChange(value) {
    setRawTitle(value);
    if (!title || title === rawTitle) setTitle(value);
  }

  function applySuggestion(suggestion) {
    const cleanItem = buildCleanItemFromSuggestion(rawTitle, suggestion);
    if (!cleanItem) return;
    setSelectedSuggestionKey(suggestion.id || suggestion.label);
    if (!title) setTitle(cleanItem.itemType || suggestion.label || rawTitle);
    if (cleanItem.category) setCategory(cleanItem.category);
  }

  function handlePhotoSelection(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const next = files.slice(0, 6 - photos.length).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
    }));
    setPhotos((current) => [...current, ...next].slice(0, 6));
    event.target.value = "";
  }

  function removePhoto(photoId) {
    setPhotos((current) => {
      const photo = current.find((p) => p.id === photoId);
      if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      return current.filter((p) => p.id !== photoId);
    });
  }

  function toggleTradeCategory(cat) {
    setTradeCategories((current) =>
      current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat]
    );
  }

  async function uploadPhotos(itemId) {
    const urls = [];
    for (const photo of photos) {
      const safeName = photo.file.name.replace(/\s+/g, "-").toLowerCase();
      const storageRef = ref(storage, `items/${itemId}/${Date.now()}-${safeName}`);
      await uploadBytes(storageRef, photo.file);
      urls.push(await getDownloadURL(storageRef));
    }
    return urls;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const finalTitle = title.trim() || rawTitle.trim();

    if (!finalTitle || !photos.length || !category) {
      setValidationError(
        !finalTitle ? "Ajoute un nom à ton objet."
        : !photos.length ? "Ajoute au moins une photo."
        : "Choisis une catégorie."
      );
      return;
    }

    setValidationError("");

    if (!user?.uid) { navigate("/login"); return; }

    setSaving(true);

    try {
      let ownerLocation = null;
      let ownerIsAmbassador = false;

      const userSnapshot = await getDoc(doc(db, "users", user.uid));
      const userData = userSnapshot.data() || {};
      if (useMyLocation) ownerLocation = getGeoPoint(userData.location);
      ownerIsAmbassador = isAmbassador(userData);

      const tradePreferences = {
        openToAll,
        categories: openToAll ? [] : tradeCategories,
        ideas: openToAll ? "" : tradeIdeas.trim(),
        openToSurprises: openToAll,
      };

      const draftRef = await addDoc(collection(db, "items"), {
        title: finalTitle,
        itemType: finalTitle,
        generatedTitle: finalTitle,
        itemDetails: "",
        category: category.trim() || "Autre",
        condition,
        description: description.trim(),
        location: location.trim() || "Paris",
        locationArea: location.trim() || "Paris",
        locationPrivacy: "approximate",
        geo: ownerLocation,
        hasGeo: Boolean(ownerLocation),
        images: [],
        imageUrl: "",
        tradePreferences,
        ownerId: user.uid,
        userId: user.uid,
        ownerEmail: user.email || "",
        ownerName: user.displayName || user.email || "Utilisateur Troco",
        ownerPhotoURL: user.photoURL || "",
        ownerIsAmbassador,
        status: "available",
        aiVerification: aiVerification || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const imageUrls = await uploadPhotos(draftRef.id);
      if (imageUrls.length) {
        const { updateDoc, doc: firestoreDoc } = await import("firebase/firestore");
        await updateDoc(firestoreDoc(db, "items", draftRef.id), {
          images: imageUrls,
          imageUrl: imageUrls[0],
          updatedAt: serverTimestamp(),
        });
      }

      setPublishedItemId(draftRef.id);
      setShowSurvey(true);
    } catch (error) {
      console.error("Erreur publication objet :", error);
      setValidationError("Impossible de publier. Réessaie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <main className="mx-auto w-full max-w-[430px] px-4 pt-[max(14px,env(safe-area-inset-top))] pb-32 lg:max-w-4xl lg:px-8 lg:pt-10">
        <header className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-[#E4ECE8] bg-white text-[#0d1b2a] shadow-[0_2px_8px_rgba(15,23,42,0.07)] transition active:scale-95"
            aria-label="Retour"
          >
            <ArrowLeft size={21} strokeWidth={2.4} />
          </button>

          <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#0f9f9a]">Publier</p>
          <h1 className="mt-2 text-[38px] font-black leading-[0.94] tracking-[-0.06em] text-[#081225] lg:text-[58px]">
            Ajouter un objet
          </h1>
          <p className="mt-2 text-[13px] font-medium text-slate-400">
            Les champs marqués <span className="text-[#0f9f9a]">*</span> sont obligatoires.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Section 1 : Ton objet ── */}
          <SectionCard>
            <SectionTitle step="1" title="Ton objet" />

            {/* Photos */}
            <div className="mb-5">
              <RequiredLabel>Photos</RequiredLabel>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={[
                  "relative flex min-h-[118px] w-full flex-col items-center justify-center overflow-hidden rounded-[22px] border border-dashed transition active:scale-[0.99]",
                  previewUrls.length
                    ? "border-transparent bg-slate-100"
                    : "border-emerald-200 bg-emerald-50/35 text-[#0f9f9a]",
                ].join(" ")}
              >
                {previewUrls.length ? (
                  <img src={previewUrls[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <>
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#0f9f9a] shadow-[0_8px_20px_rgba(15,23,42,0.035)]">
                      <ImagePlus size={26} strokeWidth={2.2} />
                    </span>
                    <span className="mt-4 text-[17px] font-black">Ajouter des photos</span>
                    <span className="mt-1 text-[13px] font-semibold text-slate-500">Jusqu'à 6 images</span>
                  </>
                )}
                {previewUrls.length > 0 && (
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/88 px-3 py-1.5 text-[12px] font-black text-slate-700 shadow-sm backdrop-blur">
                    {previewUrls.length} photo{previewUrls.length > 1 ? "s" : ""}
                  </span>
                )}
              </button>

              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoSelection} className="hidden" />

              {photos.length > 0 && (
                <div className="mt-3 grid grid-cols-6 gap-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square overflow-hidden rounded-[14px] bg-slate-100">
                      <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm"
                        aria-label="Supprimer"
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
            </div>

            {/* Titre */}
            <div className="mb-5">
              <RequiredLabel>Titre de l'objet</RequiredLabel>

              {suggestions.length > 0 && (
                <div className="mb-3">
                  <div className="mb-2 flex items-center gap-2 text-[12px] font-black text-[#0f9f9a]">
                    <Sparkles size={13} strokeWidth={2.4} />
                    Suggestions
                  </div>
                  <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex min-w-max gap-2 px-1">
                      {suggestions.map((s) => (
                        <SuggestionChip
                          key={s.id || s.label}
                          suggestion={s}
                          active={selectedSuggestionKey === (s.id || s.label)}
                          onClick={() => applySuggestion(s)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <input
                value={rawTitle}
                onChange={(e) => handleRawTitleChange(e.target.value)}
                placeholder="Ex : Guitare folk"
                className="h-[50px] w-full rounded-[18px] border border-slate-100 bg-white px-4 text-[15px] font-semibold text-[#081225] outline-none placeholder:text-slate-400 focus:border-emerald-200 focus:ring-4 focus:ring-emerald-50"
              />
              {rawTitle && rawTitle !== title && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[12px] font-medium text-slate-400">Titre affiché :</span>
                  <span className="text-[12px] font-black text-[#081225]">{title || rawTitle}</span>
                  <button
                    type="button"
                    onClick={() => setTitle(rawTitle)}
                    className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-700"
                  >
                    <Wand2 size={11} /> Utiliser tel quel
                  </button>
                </div>
              )}
            </div>

            {/* Catégorie */}
            <div className="mb-5">
              <RequiredLabel>Catégorie</RequiredLabel>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCategory(option)}
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
            </div>

            {/* État */}
            <div className="mb-5">
              <RequiredLabel>État</RequiredLabel>
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
                    {condition === option && <Check size={14} className="mb-1" strokeWidth={2.8} />}
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-5">
              <span className="mb-2 block text-[13px] font-black text-[#081225]">
                Description <span className="font-semibold text-slate-400">(facultatif)</span>
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] w-full rounded-[18px] border border-slate-100 bg-white px-4 py-3 text-[15px] font-medium leading-relaxed text-[#081225] outline-none placeholder:text-slate-400 focus:border-emerald-200 focus:ring-4 focus:ring-emerald-50"
                placeholder="Ex : je ne l'utilise plus depuis mon déménagement..."
              />
            </div>

            {/* Localisation */}
            <div>
              <span className="mb-2 block text-[13px] font-black text-[#081225]">
                Localisation <span className="font-semibold text-slate-400">(facultatif)</span>
              </span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Paris 18e, Montmartre..."
                className="h-[50px] w-full rounded-[18px] border border-slate-100 bg-white px-4 text-[15px] font-semibold text-[#081225] outline-none placeholder:text-slate-400 focus:border-emerald-200 focus:ring-4 focus:ring-emerald-50"
              />
              <button
                type="button"
                onClick={() => setUseMyLocation((v) => !v)}
                className={[
                  "mt-3 flex w-full items-center justify-between gap-3 rounded-[18px] border px-4 py-3 text-left text-[13px] font-bold transition active:scale-[0.99]",
                  useMyLocation
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                    : "border-slate-100 bg-white text-slate-500",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  <MapPin size={16} strokeWidth={2.25} />
                  Associer à ma position approximative
                </span>
                <span>{useMyLocation ? "Oui" : "Non"}</span>
              </button>
            </div>
          </SectionCard>

          {/* Vérification IA */}
          {photos.length > 0 && category && (
            <SectionCard>
              <AIVerificationBox
                imageFile={photos[0]?.file}
                category={category.toLowerCase()}
                type={(title || rawTitle).toLowerCase()}
                onVerificationComplete={setAiVerification}
              />
            </SectionCard>
          )}

          {/* ── Section 2 : Ce que tu veux en échange ── */}
          <SectionCard>
            <SectionTitle step="2" title="Ce que tu veux en échange" />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpenToAll(true)}
                className={[
                  "flex-1 rounded-[18px] border py-3 text-[13px] font-black transition active:scale-[0.98]",
                  openToAll
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-100 bg-white text-slate-500",
                ].join(" ")}
              >
                <span className="block text-[18px]">🎲</span>
                Ouvert à tout
              </button>
              <button
                type="button"
                onClick={() => setOpenToAll(false)}
                className={[
                  "flex-1 rounded-[18px] border py-3 text-[13px] font-black transition active:scale-[0.98]",
                  !openToAll
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-100 bg-white text-slate-500",
                ].join(" ")}
              >
                <span className="block text-[18px]">🎯</span>
                J'ai une idée
              </button>
            </div>

            {openToAll ? (
              <p className="mt-4 text-[13px] font-medium leading-relaxed text-slate-400">
                Tu seras ouvert à toutes les propositions. Tu pourras affiner tes préférences depuis ton profil.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <span className="mb-2 block text-[13px] font-black text-[#081225]">Catégories souhaitées</span>
                  <div className="flex flex-wrap gap-2">
                    {TRADE_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleTradeCategory(cat)}
                        className={[
                          "rounded-full border px-3 py-2 text-[13px] font-black transition active:scale-[0.98]",
                          tradeCategories.includes(cat)
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-100 bg-white text-slate-600",
                        ].join(" ")}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="mb-2 block text-[13px] font-black text-[#081225]">
                    Précise <span className="font-semibold text-slate-400">(facultatif)</span>
                  </span>
                  <textarea
                    value={tradeIdeas}
                    onChange={(e) => setTradeIdeas(e.target.value)}
                    className="min-h-[72px] w-full rounded-[18px] border border-slate-100 bg-white px-4 py-3 text-[14px] font-medium leading-relaxed text-[#081225] outline-none placeholder:text-slate-400 focus:border-emerald-200 focus:ring-4 focus:ring-emerald-50"
                    placeholder="Ex : lampe vintage, plantes, vinyles..."
                  />
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── Section 3 : Publication ── */}
          <div className="sticky bottom-6 z-30 -mx-1 rounded-[24px] border border-[#E4ECE8] bg-white p-3 shadow-[0_4px_20px_rgba(15,23,42,0.10)]">
            {validationError && (
              <p className="mb-3 rounded-[16px] bg-rose-50 px-4 py-2.5 text-[13px] font-bold text-rose-600">
                ⚠️ {validationError}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              onClick={handleSubmit}
              className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-[#2ECC8A] to-cyan-400 text-[16px] font-black text-white shadow-[0_12px_28px_rgba(46,204,138,0.16)] transition active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 size={20} className="animate-spin" /> Publication...</>
              ) : (
                "Publier mon objet"
              )}
            </button>
          </div>
        </form>
      </main>

      {showSurvey && (
        <SurveyModal
          surveyId="after_add_item"
          metadata={{ itemId: publishedItemId }}
          onDone={() => {
            setShowSurvey(false);
            navigate(`/items/${publishedItemId}`, { replace: true });
          }}
        />
      )}
    </>
  );
}
