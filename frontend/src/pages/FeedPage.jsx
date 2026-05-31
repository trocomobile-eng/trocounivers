import { useEffect, useState } from "react";

import DesktopFeedPage from "./feed/DesktopFeedPage";
import MobileFeedPage from "./feed/MobileFeedPage";

const DESKTOP_BREAKPOINT = 1024;

export default function FeedPage() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= DESKTOP_BREAKPOINT
  );

  useEffect(() => {
    function update() {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return isDesktop ? <DesktopFeedPage /> : <MobileFeedPage />;
}
