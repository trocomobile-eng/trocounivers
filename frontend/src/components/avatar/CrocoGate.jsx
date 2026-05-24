import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

const ALLOWED_WITHOUT_CROCO = new Set([
  "/create-croco",
  "/onboarding",
  "/login",
  "/signup",
  "/verify-email",
]);

export default function CrocoGate({ children }) {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [checking, setChecking] = useState(true);
  const [hasCreatedCroco, setHasCreatedCroco] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkCroco() {
      if (authLoading) return;

      if (!user?.uid) {
        if (!cancelled) {
          setHasCreatedCroco(true);
          setChecking(false);
        }
        return;
      }

      if (ALLOWED_WITHOUT_CROCO.has(location.pathname)) {
        if (!cancelled) {
          setHasCreatedCroco(true);
          setChecking(false);
        }
        return;
      }

      try {
        setChecking(true);

        const snapshot = await getDoc(doc(db, "users", user.uid));
        const data = snapshot.exists() ? snapshot.data() : {};

        if (!cancelled) {
          setHasCreatedCroco(Boolean(data?.hasCreatedCroco || data?.crocoAvatar));
          setChecking(false);
        }
      } catch (error) {
        console.error("Erreur vérification crocodile :", error);

        if (!cancelled) {
          setHasCreatedCroco(true);
          setChecking(false);
        }
      }
    }

    checkCroco();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.uid, location.pathname]);

  if (authLoading || checking) return null;

  if (user?.uid && !hasCreatedCroco && !ALLOWED_WITHOUT_CROCO.has(location.pathname)) {
    return <Navigate to="/create-croco" replace state={{ from: location.pathname }} />;
  }

  return children;
}
