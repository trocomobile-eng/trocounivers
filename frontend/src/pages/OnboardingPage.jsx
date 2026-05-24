import { useNavigate } from "react-router-dom";

import TrocoOnboarding from "../components/TrocoOnboarding";

export default function OnboardingPage() {
  const navigate = useNavigate();

  function finishOnboarding() {
    try {
      localStorage.setItem("troco_onboarding_seen", "true");
      localStorage.setItem("troco:onboarding-seen", "true");
    } catch {
      // ignore localStorage errors
    }

    navigate("/feed", { replace: true });
  }

  return <TrocoOnboarding onDone={finishOnboarding} onSkip={finishOnboarding} />;
}
