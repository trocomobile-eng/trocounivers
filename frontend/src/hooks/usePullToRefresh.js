import { useEffect, useRef, useState } from "react";

/**
 * usePullToRefresh — déclenche onRefresh quand l'user tire vers le bas
 * depuis le haut de la page sur mobile.
 */
export function usePullToRefresh(onRefresh, { threshold = 80 } = {}) {
  const [pulling, setPulling]       = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);

  useEffect(() => {
    function onTouchStart(e) {
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
    }

    function onTouchMove(e) {
      if (startY.current === null) return;
      const dist = e.touches[0].clientY - startY.current;
      if (dist > 0 && window.scrollY === 0) {
        setPulling(true);
        setPullDistance(Math.min(dist, threshold * 1.5));
      }
    }

    async function onTouchEnd() {
      if (pullDistance >= threshold && !refreshing) {
        setRefreshing(true);
        try { await onRefresh(); } finally { setRefreshing(false); }
      }
      setPulling(false);
      setPullDistance(0);
      startY.current = null;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove",  onTouchMove,  { passive: true });
    document.addEventListener("touchend",   onTouchEnd);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove",  onTouchMove);
      document.removeEventListener("touchend",   onTouchEnd);
    };
  }, [onRefresh, pullDistance, refreshing, threshold]);

  return { pulling, pullDistance, refreshing, progress: Math.min(pullDistance / threshold, 1) };
}
