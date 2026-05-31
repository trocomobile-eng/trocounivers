import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import DesktopLayout from "./DesktopLayout";
import MobileLayout from "./MobileLayout";

function usePageTransition() {
  const location = useLocation();
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("troco-page-enter");
    // Force reflow
    void el.offsetHeight;
    el.classList.add("troco-page-enter");
  }, [location.pathname]);

  return ref;
}

function DesktopPage({ children }) {
  const ref = usePageTransition();
  return (
    <div ref={ref} className="troco-page-enter">
      {children}
    </div>
  );
}

function MobilePage({ children }) {
  const ref = usePageTransition();
  return (
    <MobileLayout>
      <div ref={ref} className="troco-page-enter">
        {children}
      </div>
    </MobileLayout>
  );
}

export default function PageLayout({ children }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        <DesktopLayout>
          <DesktopPage>{children}</DesktopPage>
        </DesktopLayout>
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <MobilePage>{children}</MobilePage>
      </div>
    </>
  );
}
