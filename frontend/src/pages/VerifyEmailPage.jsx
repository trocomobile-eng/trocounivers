import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { reload, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);

  const checkVerification = async () => {
    if (!auth.currentUser) {
      navigate("/login");
      return;
    }

    setChecking(true);

    try {
      await reload(auth.currentUser);

      if (auth.currentUser.emailVerified) {
        navigate("/feed", { replace: true });
      } else {
        alert("Ton email n’est pas encore vérifié. Vérifie ta boîte mail ou tes spams.");
      }
    } catch (error) {
      console.error("Erreur vérification email :", error);
      alert("Impossible de vérifier pour l’instant.");
    } finally {
      setChecking(false);
    }
  };

  const resendEmail = async () => {
    if (!auth.currentUser) {
      navigate("/login");
      return;
    }

    setSending(true);

    try {
      await sendEmailVerification(auth.currentUser, {
        url: "https://troco.app/verify-email",
        handleCodeInApp: false,
      });
      alert("Email renvoyé. Pense à vérifier tes spams.");
    } catch (error) {
      console.error("Erreur renvoi email :", error);
      alert("Impossible de renvoyer l’email pour l’instant.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page flex items-center justify-center">
      <div className="w-full px-5">
        <div className="card p-6 text-center space-y-5">
          <div>
            <h1 className="text-4xl font-black tracking-[0.25em] text-emerald-600">
              TROCO
            </h1>
            <p className="mt-2 text-slate-500">Vérifie ton email pour continuer.</p>
          </div>

          <div className="rounded-[28px] bg-emerald-50 p-5">
            <div className="mb-3 text-4xl">✉️</div>
            <h2 className="text-xl font-black text-slate-950">Email envoyé</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Clique sur le lien reçu par email, puis reviens ici pour continuer. Pense à vérifier tes spams.
            </p>
          </div>

          <button onClick={checkVerification} disabled={checking} className="btn-primary w-full">
            {checking ? "Vérification..." : "J’ai vérifié mon email"}
          </button>

          <button onClick={resendEmail} disabled={sending} className="btn-secondary w-full">
            {sending ? "Envoi..." : "Renvoyer l’email"}
          </button>

          <button onClick={() => navigate("/login")} className="text-sm font-bold text-slate-400">
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}
