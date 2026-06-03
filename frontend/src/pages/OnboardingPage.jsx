import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import TrocoOnboarding from "../components/TrocoOnboarding";

function markSeen() {
  try {
    localStorage.setItem("troco_onboarding_seen", "true");
    localStorage.setItem("troco:onboarding-seen", "true");
  } catch {}
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  function goToFeed() {
    markSeen();
    navigate("/feed", { replace: true });
  }

  return (
    <TrocoOnboarding
      onDone={goToFeed}
      onSkip={goToFeed}
    />
  );
}
