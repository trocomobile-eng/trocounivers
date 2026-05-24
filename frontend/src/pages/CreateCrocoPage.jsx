import { useEffect, useState } from "react";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import BottomNav from "../components/BottomNav";
import CrocoAvatar from "../components/avatar/CrocoAvatar";
import CrocoAvatarPicker from "../components/avatar/CrocoAvatarPicker";
import { DEFAULT_CROCO_AVATAR } from "../utils/crocoAvatarOptions";

export default function CreateCrocoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [avatar, setAvatar] = useState(DEFAULT_CROCO_AVATAR);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    async function loadAvatar() {
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        const saved = snapshot.data()?.crocoAvatar;

        if (saved) {
          setAvatar({ ...DEFAULT_CROCO_AVATAR, ...saved });
        }
      } catch (error) {
        console.error("Erreur chargement croco :", error);
      }
    }

    loadAvatar();
  }, [user?.uid]);

  async function saveCroco() {
    if (!user?.uid || saving) return;

    setSaving(true);

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          crocoAvatar: avatar,
          hasCreatedCroco: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      navigate("/feed", { replace: true });
    } catch (error) {
      console.error("Erreur sauvegarde crocodile :", error);
      alert("Impossible d’enregistrer ton crocodile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="troco-page-bg min-h-screen px-5 pb-28 pt-3 text-[#081225]">
      <main className="mx-auto max-w-[640px]">
        <header className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/85 bg-white/90 shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
          >
            <ArrowLeft size={21} strokeWidth={2.2} />
          </button>

          <img src="/logo.png" alt="Troco" className="w-[132px] object-contain" />

          <button
            type="button"
            onClick={saveCroco}
            disabled={saving}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2ECC8A] text-white shadow-[0_10px_24px_rgba(46,204,138,0.18)] disabled:opacity-50"
          >
            <Check size={21} strokeWidth={2.6} />
          </button>
        </header>

        <section className="mb-5 rounded-[34px] border border-white/85 bg-white/88 p-5 text-center shadow-[0_12px_34px_rgba(15,23,42,0.045)] backdrop-blur-xl">
          <p className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-[#E8F7EF] px-3 py-1.5 text-[12px] font-black uppercase tracking-[0.14em] text-[#22a06b]">
            <Sparkles size={14} strokeWidth={2.3} />
            Ton compagnon Troco
          </p>

          <h1 className="text-[32px] font-black leading-[0.96] tracking-[-0.055em]">
            Crée ton crocodile.
          </h1>

          <p className="mx-auto mt-3 max-w-[320px] text-[14px] font-medium leading-relaxed text-[#64748B]">
            Choisis une forme, une couleur et quelques détails. Tu pourras le modifier plus tard dans ton profil.
          </p>

          <div className="mt-5 flex justify-center">
            <div className="rounded-[38px] bg-gradient-to-br from-white to-[#E8F7EF]/70 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <CrocoAvatar avatar={avatar} size={190} />
            </div>
          </div>
        </section>

        <CrocoAvatarPicker value={avatar} onChange={setAvatar} />

        <button
          type="button"
          onClick={saveCroco}
          disabled={saving}
          className="mt-5 flex h-[56px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#2ECC8A] to-cyan-400 text-[15px] font-black text-white shadow-[0_12px_30px_rgba(46,204,138,0.16)] disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "C’est parti !"}
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
