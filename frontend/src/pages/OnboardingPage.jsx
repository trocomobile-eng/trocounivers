import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import TrocoOnboarding from "../components/TrocoOnboarding";

function markSeen() {
  try {
    localStorage.setItem("troco_onboarding_seen", "true");
    localStorage.setItem("troco:onboarding-seen", "true");
  } catch {}
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  async function goToFeed() {
    markSeen();

    if (user?.uid) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          onboardingCompleted: true,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (error) {
        console.error("Erreur sauvegarde onboarding :", error);
      }
    }

    const redirectTo = location.state?.redirectTo || "/feed";
    const nextPath = redirectTo && !["/login", "/signup", "/onboarding"].includes(redirectTo)
      ? redirectTo
      : "/feed";

    navigate("/profile-onboarding", { replace: true, state: { redirectTo: nextPath } });
  }

  return (
    <TrocoOnboarding
      onDone={goToFeed}
      onSkip={goToFeed}
    />
  );
}
