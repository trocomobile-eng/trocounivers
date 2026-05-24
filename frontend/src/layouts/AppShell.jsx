import { useLocation } from "react-router-dom";

import DesktopLayout from "./DesktopLayout";
import TrocoFooter from "../components/TrocoFooter";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/onboarding",
  "/verify-email",
  "/about",
  "/contact",
  "/safety",
  "/privacy",
  "/terms",
  "/troco-dossier",
];

function isPublicPathname(pathname) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/safety") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/troco-dossier")
  );
}

export default function AppShell({ children }) {
  const location = useLocation();
  const isPublicPath = isPublicPathname(location.pathname);

  if (isPublicPath) {
    return (
      <>
        {children}
        <TrocoFooter />
      </>
    );
  }

  return (
    <>
      <DesktopLayout>{children}</DesktopLayout>
      <TrocoFooter />
    </>
  );
}
