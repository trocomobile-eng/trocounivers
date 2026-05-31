import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

function normalizePhone(value) {
  return value.trim().replace(/\s+/g, " ");
}

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || "/onboarding";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanName = displayName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = normalizePhone(phone);

    if (!cleanName) {
      alert("Ajoute ton prénom ou pseudo.");
      return;
    }

    if (!cleanEmail) {
      alert("Ajoute ton e-mail.");
      return;
    }

    if (!cleanPhone) {
      alert("Ajoute ton numéro de téléphone. Il servira uniquement au moment d’une rencontre confirmée.");
      return;
    }

    if (password.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setSaving(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);

      await updateProfile(credential.user, {
        displayName: cleanName,
      });

      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        displayName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        phoneNumber: cleanPhone,
        city: "Paris",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error("Erreur inscription :", error);
      alert("Impossible de créer le compte. Vérifie les informations.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="troco-page-bg min-h-screen px-5 py-8 text-[#081225]">
      <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[430px] flex-col justify-center">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Troco" className="mx-auto w-[150px] object-contain" />

          <h1 className="mt-7 text-[42px] font-black leading-[0.95] tracking-[-0.055em]">
            Créer ton compte
          </h1>

          <p className="mt-3 text-[15px] font-medium leading-relaxed text-slate-500">
            Le téléphone reste privé et s’affiche uniquement quand une rencontre est confirmée.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[34px] border border-white/80 bg-white/78 p-5 shadow-[0_16px_42px_rgba(15,23,42,0.055)] backdrop-blur-xl">
          <label className="block">
            <span className="text-sm font-black text-[#081225]">Prénom ou pseudo</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-2 w-full rounded-[22px] border border-white/80 bg-white px-4 py-3 text-sm font-bold outline-none"
              placeholder="Ex : Alex"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-black text-[#081225]">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-[22px] border border-white/80 bg-white px-4 py-3 text-sm font-bold outline-none"
              placeholder="ton@email.com"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-black text-[#081225]">Téléphone</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-2 w-full rounded-[22px] border border-white/80 bg-white px-4 py-3 text-sm font-bold outline-none"
              placeholder="06 12 34 56 78"
            />
            <span className="mt-2 block text-[12px] font-semibold leading-relaxed text-slate-500">
              Utilisé seulement pour faciliter une rencontre confirmée.
            </span>
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-black text-[#081225]">Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-[22px] border border-white/80 bg-white px-4 py-3 text-sm font-bold outline-none"
              placeholder="Minimum 6 caractères"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 w-full rounded-[24px] bg-gradient-to-r from-[#2ECC8A] to-cyan-400 px-5 py-4 text-base font-black text-white shadow-[0_12px_24px_rgba(46,204,138,0.18)] disabled:opacity-50"
          >
            {saving ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm font-semibold text-slate-500">
          Déjà inscrit ?{" "}
          <Link to="/login" className="font-black text-[#0f9f9a]">
            Se connecter
          </Link>
        </p>
      </section>
    </main>
  );
}
