import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

async function ensureUserDoc(user) {
  await setDoc(doc(db, "users", user.uid), {
    displayName: user.displayName || user.email?.split("@")[0] || "Utilisateur Troco",
    email: user.email || "",
    avatarUrl: user.photoURL || "",
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/feed", { replace: true });
    } catch (e) {
      console.error(e.code, e.message);
      setError("Email ou mot de passe incorrect.");
    } finally { setLoading(false); }
  };

  const google = async () => {
    setError("");
    setLoading(true);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureUserDoc(credential.user);
      navigate("/feed", { replace: true });
    } catch (e) {
      console.error(e.code, e.message);
      setError("Connexion Google impossible.");
    } finally { setLoading(false); }
  };

  return (
    <div className="page flex items-center justify-center">
      <div className="w-full px-5 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-[0.22em] text-emerald-600">TROCO</h1>
          <p className="mt-2 text-slate-500">Connecte-toi à ton compte</p>
        </div>
        <div className="card p-5 space-y-4">
          <h2 className="text-xl font-black text-slate-950">Connexion</h2>
          {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div>}
          <button onClick={google} disabled={loading} className="btn-secondary w-full">Continuer avec Google</button>
          <div className="flex items-center gap-3 text-xs font-bold text-slate-300"><span className="h-px flex-1 bg-slate-100" />ou<span className="h-px flex-1 bg-slate-100" /></div>
          <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={login} disabled={loading} className="btn-primary w-full">{loading ? "Connexion..." : "Se connecter"}</button>
        </div>
        <p className="text-center text-sm text-slate-500">Pas encore de compte ? <Link to="/signup" className="font-black text-emerald-600">Créer un compte</Link></p>
      </div>
    </div>
  );
}
