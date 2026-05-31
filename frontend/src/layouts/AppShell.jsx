import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import DesktopLayout from "./DesktopLayout";

const DESKTOP_BREAKPOINT = 1024;

export default function AppShell({ children }) {
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    function update() {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    }

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  // mobile = app normale
  if (!isDesktop) {
    return children;
  }

  // Feed desktop gère déjà son propre DesktopLayout
  if (location.pathname === "/feed") {
    return children;
  }

  // Sidebar desktop globale partout ailleurs
  return (
    <DesktopLayout>
      {children}
    </DesktopLayout>
  );
}
