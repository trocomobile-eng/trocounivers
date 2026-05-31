import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import TrocoLogo from "../components/TrocoLogo";

async function ensureUserDoc(user) {
  await setDoc(doc(db, "users", user.uid), {
    displayName: user.displayName || user.email?.split("@")[0] || "Utilisateur Troco",
    email: user.email || "",
    avatarUrl: user.photoURL || "",
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export default function LoginPage() {
  const navigate   = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function loginWithEmail() {
    if (!email || !password) { setError("Remplis tous les champs."); return; }
    setError(""); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/feed", { replace: true });
    } catch (e) {
      if (e.code === "auth/user-not-found" || e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setError("Email ou mot de passe incorrect.");
      } else {
        setError("Connexion impossible. Réessaie.");
      }
    } finally { setLoading(false); }
  }

  async function loginWithGoogle() {
    setError(""); setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result   = await signInWithPopup(auth, provider);
      await ensureUserDoc(result.user);
      navigate("/feed", { replace: true });
    } catch (e) {
      // Compte email existant — proposer de fusionner
      if (e.code === "auth/account-exists-with-different-credential") {
        const email = e.customData?.email;
        if (email) {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.includes("password")) {
            setError(`Un compte existe déjà avec cet email. Connecte-toi avec ton mot de passe d'abord.`);
          }
        }
      } else {
        setError("Connexion Google impossible. Vérifie que les popups sont autorisés.");
      }
    } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--troco-bg)] px-5">
      <div className="w-full max-w-[400px] space-y-6">

        {/* Logo */}
        <div className="flex justify-center">
          <TrocoLogo size="m" />
        </div>

        <div className="rounded-[24px] bg-white p-6 shadow-[0_2px_24px_rgba(15,23,42,0.08)]">
          <h1 className="text-[22px] font-extrabold tracking-[-0.03em] text-[#0d1b2a]">
            Connexion
          </h1>
          <p className="mt-1 text-[13px] font-medium text-slate-500">
            Bienvenue sur Troco 👋
          </p>

          {error && (
            <div className="mt-4 rounded-[14px] border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] font-bold text-rose-600">
              {error}
            </div>
          )}

          <div className="mt-5 space-y-3">
            {/* Google */}
            <button
              type="button"
              onClick={loginWithGoogle}
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-[16px] border border-[#E4ECE8] bg-white text-[14px] font-bold text-[#0d1b2a] shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition active:scale-[0.98] disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </button>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[#E4ECE8]" />
              <span className="text-[12px] font-bold text-[#94a3b8]">ou</span>
              <span className="h-px flex-1 bg-[#E4ECE8]" />
            </div>

            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-[16px] border border-[#E4ECE8] bg-white px-4 text-[14px] font-medium text-[#0d1b2a] outline-none placeholder:text-[#94a3b8] focus:border-[#1ABEA3] focus:ring-1 focus:ring-[#1ABEA3]/20"
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") loginWithEmail(); }}
              className="h-12 w-full rounded-[16px] border border-[#E4ECE8] bg-white px-4 text-[14px] font-medium text-[#0d1b2a] outline-none placeholder:text-[#94a3b8] focus:border-[#1ABEA3] focus:ring-1 focus:ring-[#1ABEA3]/20"
            />

            <button
              type="button"
              onClick={loginWithEmail}
              disabled={loading}
              className="troco-primary-btn h-12 w-full rounded-full"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </div>
        </div>

        <p className="text-center text-[13px] font-medium text-slate-500">
          Pas encore de compte ?{" "}
          <Link to="/signup" className="font-bold text-[#1ABEA3]">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
