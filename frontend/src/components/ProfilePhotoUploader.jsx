import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { updateProfile } from "firebase/auth";

import { auth, db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function ProfilePhotoUploader({ className = "", onUploaded }) {
  const inputRef = useRef(null);
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file || !user?.uid || uploading) return;

    if (!file.type.startsWith("image/")) {
      alert("Choisis une image.");
      return;
    }

    setUploading(true);

    try {
      const extension = file.name.split(".").pop() || "jpg";
      const storageRef = ref(storage, `users/${user.uid}/profile/avatar-${Date.now()}.${extension}`);

      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
      }

      await setDoc(
        doc(db, "users", user.uid),
        {
          photoURL,
          photoUrl: photoURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      onUploaded?.(photoURL);
    } catch (error) {
      console.error("Erreur upload photo profil :", error);
      alert("Impossible de modifier la photo de profil. Vérifie les règles Firebase Storage.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={[
          "flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0f9f9a] shadow-[0_6px_16px_rgba(15,23,42,0.10)] transition active:scale-95 disabled:opacity-50",
          className,
        ].join(" ")}
        aria-label="Modifier la photo de profil"
      >
        <Camera size={17} strokeWidth={2.25} />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </>
  );
}
