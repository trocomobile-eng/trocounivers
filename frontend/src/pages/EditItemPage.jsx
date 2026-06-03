// src/pages/EditItemPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";

import TrocoPageHeader from "../components/TrocoPageHeader";
import ItemPhotoManager from "../components/ItemPhotoManager";
import ItemConditionSelector from "../components/ItemConditionSelector";

import { CATEGORIES, guessCategoryFromText } from "../constants/categories";
import { getItemImages } from "../utils/format";

function makePreview(file) {
  return URL.createObjectURL(file);
}

function makeExistingPhoto(url, index) {
  return {
    id: `existing-${index}-${url}`,
    kind: "existing",
    url,
  };
}

// Compression image via canvas
async function compressImage(file, { maxWidth = 1200, maxSizeKB = 400, quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const scale = Math.min(1, maxWidth / img.width);
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      function tryQuality(q) {
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            if (blob.size / 1024 > maxSizeKB && q > 0.5) {
              tryQuality(Math.round((q - 0.08) * 100) / 100);
              return;
            }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            }));
          },
          "image/jpeg",
          q
        );
      }

      tryQuality(quality);
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

async function makeNewPhoto(file, index) {
  const compressed = await compressImage(file);
  return {
    id: `new-${Date.now()}-${index}-${file.name}`,
    kind: "new",
    file: compressed,
    url: makePreview(compressed),
  };
}

function moveArrayItem(array, from, to) {
  if (to < 0 || to >= array.length || from === to) return array;

  const copy = [...array];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);

  return copy;
}

export default function EditItemPage() {
  const { itemId, id } = useParams();
  const currentItemId = itemId || id;

  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");

  const [arrondissement, setArrondissement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");

  const [photos, setPhotos] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const shouldPromptDelete =
    new URLSearchParams(location.search).get("delete") === "1";

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      navigate("/login", { replace: true });
      return;
    }

    async function loadItem() {
      setLoading(true);

      try {
        const itemSnapshot = await getDoc(doc(db, "items", currentItemId));

        if (!itemSnapshot.exists()) {
          setItem(null);
          return;
        }

        const itemData = {
          id: itemSnapshot.id,
          ...itemSnapshot.data(),
        };

        const userId = String(user.uid);
const userEmail = String(user.email || "").toLowerCase();

const isOwner =
  String(itemData.ownerId || "") === userId ||
  String(itemData.userId || "") === userId ||
  String(itemData.ownerUid || "") === userId ||
  String(itemData.createdBy || "") === userId ||
  String(itemData.uid || "") === userId ||
  (userEmail && String(itemData.ownerEmail || "").toLowerCase() === userEmail) ||
  (userEmail && String(itemData.userEmail || "").toLowerCase() === userEmail) ||
  (userEmail && String(itemData.createdByEmail || "").toLowerCase() === userEmail);

if (!isOwner) {
  navigate("/profile", { replace: true });
  return;
}

        setItem(itemData);
        setTitle(itemData.title || itemData.type || itemData.itemType || "");
        setCategory(itemData.category || "");
        setDescription(itemData.description || "");
        setCondition(itemData.condition || itemData.itemCondition || "");
        setArrondissement(itemData.arrondissement || itemData.locationArea || "");
        setNeighborhood(itemData.neighborhood || itemData.quartier || "");

        const loadedImages = getItemImages(itemData);
        setPhotos(loadedImages.map(makeExistingPhoto));

        const initialMain =
          typeof itemData.mainImageIndex === "number" &&
          loadedImages[itemData.mainImageIndex]
            ? itemData.mainImageIndex
            : 0;

        setMainImageIndex(initialMain);
      } catch (error) {
        console.error("Erreur chargement édition objet :", error);
        setItem(null);
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [authLoading, user?.uid, currentItemId, navigate]);

  useEffect(() => {
    if (!title.trim()) return;
    if (category) return;

    const guessed = guessCategoryFromText?.(title);

    if (guessed && guessed !== "Autre") {
      setCategory(guessed);
    }
  }, [title, category]);

  useEffect(() => {
    if (!shouldPromptDelete || !item || saving) return;

    const timer = window.setTimeout(() => {
      deleteItem();
    }, 250);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldPromptDelete, item]);

  const previewImages = useMemo(() => photos.map((photo) => photo.url), [photos]);

  const canSubmit = useMemo(() => {
    return Boolean(title.trim() && photos.length > 0 && !saving);
  }, [title, photos.length, saving]);

  const addFiles = async (files) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) return;

    setPhotos((current) => {
      const remaining = Math.max(0, 8 - current.length);
      const accepted = imageFiles.slice(0, remaining);
      // makeNewPhoto est async — on retourne des Promises qu'on résout après
      // Pour garder l'UI réactive, on ajoute les photos avec des placeholders puis on les met à jour
      return current; // mis à jour ci-dessous
    });

    // Compression async puis mise à jour de l'état
    const remaining = Math.max(0, 8 - photos.length);
    const accepted = imageFiles.slice(0, remaining);
    const newPhotos = await Promise.all(
      accepted.map((file, index) => makeNewPhoto(file, index))
    );
    setPhotos((current) => [...current, ...newPhotos].slice(0, 8));
  };

  const removeImage = (index) => {
    setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index));

    setMainImageIndex((current) => {
      if (index === current) return 0;
      if (index < current) return Math.max(0, current - 1);
      return Math.min(current, Math.max(0, photos.length - 2));
    });
  };

  const moveImage = (from, to) => {
    setPhotos((current) => moveArrayItem(current, from, to));

    setMainImageIndex((current) => {
      if (current === from) return to;
      if (from < current && to >= current) return current - 1;
      if (from > current && to <= current) return current + 1;
      return current;
    });
  };

  const uploadPhoto = async (photo, index) => {
    if (photo.kind === "existing") return photo.url;

    const cleanName = photo.file.name.replace(/\s+/g, "-").toLowerCase();
    const path = `items/${user.uid}/${Date.now()}-${index}-${cleanName}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, photo.file);
    return getDownloadURL(storageRef);
  };

  const deleteItem = async () => {
    const ok = window.confirm("Supprimer cet objet définitivement ?");
    if (!ok) return;

    setSaving(true);

    try {
      await deleteDoc(doc(db, "items", currentItemId));
      navigate("/profile", { replace: true });
    } catch (error) {
      console.error("Erreur suppression objet :", error);
      alert("Impossible de supprimer l’objet.");
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!canSubmit) {
      alert("Ajoute un titre, une catégorie, un état et au moins une photo.");
      return;
    }

    setSaving(true);

    try {
      const finalImages = [];

      for (const [index, photo] of photos.entries()) {
        const url = await uploadPhoto(photo, index);
        finalImages.push(url);
      }

      const safeMainIndex = finalImages[mainImageIndex] ? mainImageIndex : 0;
      const mainImageUrl = finalImages[safeMainIndex] || finalImages[0] || "";

      await updateDoc(doc(db, "items", currentItemId), {
        title: title.trim(),
        type: title.trim(),
        itemType: title.trim(),
        category,
        description: description.trim(),
        condition,
        itemCondition: condition,
        arrondissement: arrondissement.trim(),
        locationArea: arrondissement.trim(),
        neighborhood: neighborhood.trim(),
        quartier: neighborhood.trim(),

        images: finalImages,
        imageUrl: mainImageUrl,
        mainImageIndex: safeMainIndex,

        updatedAt: serverTimestamp(),
      });

      navigate(`/items/${currentItemId}`);
    } catch (error) {
      console.error("Erreur modification objet :", error);
      alert("Impossible de modifier l’objet.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="page">
        <TrocoPageHeader compact showNotifications={false} showAvatar={false} />
        <div className="px-5 pt-8 text-center text-sm font-bold text-slate-500">
          Chargement...
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page">
        <TrocoPageHeader compact showNotifications={false} showAvatar={false} />
        <div className="px-5 pt-8 text-center text-sm font-bold text-slate-500">
          Objet introuvable.
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <TrocoPageHeader showBack compact showNotifications={false} showAvatar={false} />

      <main className="mx-auto max-w-[760px] px-5 pb-36 pt-5">
        <section className="mb-6">
          <p className="text-[11px] font-black uppercase tracking-[0.20em] text-emerald-600">
            Modifier
          </p>

          <h1 className="mt-2 text-[34px] font-black leading-none tracking-[-0.05em] text-slate-950">
            Modifier l’objet
          </h1>

          <p className="mt-3 text-[15px] font-medium leading-relaxed text-slate-500">
            Ajoute, supprime, réorganise les photos ou choisis la photo principale.
          </p>
        </section>

        <div className="space-y-5">
          <ItemPhotoManager
            images={previewImages}
            mainImageIndex={mainImageIndex}
            onAddFiles={addFiles}
            onRemoveImage={removeImage}
            onSetMainImage={setMainImageIndex}
            onMoveImage={moveImage}
          />

          <section className="rounded-[34px] border border-white/80 bg-white/80 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.055)] backdrop-blur-xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">
              Informations
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-[13px] font-black text-slate-700">
                  Nom de l’objet
                </span>

                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-[22px] border border-white bg-slate-50/80 px-4 py-3 text-[15px] font-semibold text-slate-800 outline-none placeholder:text-slate-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-black text-slate-700">
                  Catégorie
                </span>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-[22px] border border-white bg-slate-50/80 px-4 py-3 text-[15px] font-semibold text-slate-800 outline-none"
                >
                  <option value="">Choisir une catégorie</option>
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-black text-slate-700">
                  Description
                </span>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-[22px] border border-white bg-slate-50/80 px-4 py-3 text-[15px] font-semibold text-slate-800 outline-none placeholder:text-slate-500"
                />
              </label>
            </div>
          </section>

          <ItemConditionSelector value={condition} onChange={setCondition} />

          <section className="rounded-[34px] border border-white/80 bg-white/80 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.055)] backdrop-blur-xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">
              Localisation
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input
                value={arrondissement}
                onChange={(event) => setArrondissement(event.target.value)}
                placeholder="Paris 18e"
                className="w-full rounded-[22px] border border-white bg-slate-50/80 px-4 py-3 text-[15px] font-semibold text-slate-800 outline-none placeholder:text-slate-500"
              />

              <input
                value={neighborhood}
                onChange={(event) => setNeighborhood(event.target.value)}
                placeholder="Montmartre"
                className="w-full rounded-[22px] border border-white bg-slate-50/80 px-4 py-3 text-[15px] font-semibold text-slate-800 outline-none placeholder:text-slate-500"
              />
            </div>
          </section>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="w-full rounded-[24px] bg-gradient-to-r from-sky-500 to-emerald-400 px-4 py-4 text-[15px] font-black text-white shadow-[0_14px_30px_rgba(16,185,129,0.18)] transition active:scale-[0.98] disabled:opacity-45"
          >
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>

          <button
            type="button"
            onClick={deleteItem}
            disabled={saving}
            className="w-full rounded-[24px] border border-rose-100 bg-rose-50 px-4 py-4 text-[15px] font-black text-rose-600 transition active:scale-[0.98] disabled:opacity-45"
          >
            Supprimer l’objet
          </button>
        </div>
      </main>

    </div>
  );
}
