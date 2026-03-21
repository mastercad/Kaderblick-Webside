import { useEffect, useRef, useState } from 'react';


interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPullDistance?: number;
  isEnabled?: boolean;
}

/**
 * Prüft, ob das Touch-Target oder ein scrollbarer Vorfahre NICHT ganz oben ist.
 * Berücksichtigt sowohl overflow-scroll/auto Container als auch window.scrollY.
 * So wird Pull-to-Refresh z.B. in scroll-snap-containern korrekt blockiert,
 * wenn der Container nicht am Anfang steht.
 */
const isAtAbsoluteScrollTop = (el: EventTarget | null): boolean => {
  // Zuerst: Wenn das Window nicht am Anfang ist, sind wir nicht oben
  if (window.scrollY > 0) return false;

  if (!(el instanceof Element)) return true;

  let current: Element | null = el;
  while (current && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const isScrollable =
      (overflowY === 'auto' || overflowY === 'scroll') &&
      current.scrollHeight > current.clientHeight;

    if (isScrollable && current.scrollTop > 1) {
      // scrollTop > 1 statt > 0 wegen float-Rundungsfehlern
      return false;
    }
    current = current.parentElement;
  }
  return true;
};

const isOverlayOrMenu = (el: EventTarget | null): boolean => {
  if (!(el instanceof Element)) return false;
  const overlaySelectors = [
    '.MuiDrawer-root',
    '.MuiModal-root',
    '.MuiPopover-root',
    '.MuiMenu-root',
    '.dropdown-menu',
    '[role="dialog"]',
    '[role="menu"]',
    '[role="listbox"]',
    '[role="presentation"]',
  ];
  for (const selector of overlaySelectors) {
    if (el.closest(selector)) return true;
  }
  return false;
};

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  maxPullDistance = 150,
  isEnabled = true,
}: UsePullToRefreshOptions) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs für Gesture-State — vermeidet dependency-Probleme im useEffect
  const startY = useRef(0);
  const touchTarget = useRef<EventTarget | null>(null);
  const gestureActive = useRef(false); // Ob PTR-Geste aktiv werden KANN
  const committed = useRef(false);     // Ob PTR-Geste tatsächlich aktiviert wurde
  const isRefreshingRef = useRef(false);
  const isPullingRef = useRef(false);
  const pullDistanceRef = useRef(0);

  // Sync refs mit state
  isRefreshingRef.current = isRefreshing;

  // Stabiler onRefresh-Ref, damit sich der Effect nicht neu registriert
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const thresholdRef = useRef(threshold);
  thresholdRef.current = threshold;
  const maxPullRef = useRef(maxPullDistance);
  maxPullRef.current = maxPullDistance;

  // Dead zone: Mindestens so viele px bewegen, bevor PTR aktiviert wird.
  // Das verhindert Konflikte mit kurzem Scrollen.
  const DEAD_ZONE = 10;

  useEffect(() => {
    if (!isEnabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;

      // Kein PTR auf Overlays/Menus/Dialogen
      if (isOverlayOrMenu(e.target)) {
        gestureActive.current = false;
        return;
      }

      touchTarget.current = e.target;

      // Prüfe ob wir wirklich ganz oben sind (Window UND alle scrollbaren Container)
      if (isAtAbsoluteScrollTop(e.target)) {
        startY.current = e.touches[0].clientY;
        gestureActive.current = true;
        committed.current = false;
      } else {
        gestureActive.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!gestureActive.current || isRefreshingRef.current) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      // Wenn der Finger nach oben geht (Seite nach unten scrollen) → PTR abbrechen
      if (diff < 0) {
        gestureActive.current = false;
        if (committed.current) {
          // Geste war schon aktiv, jetzt abbrechen
          committed.current = false;
          isPullingRef.current = false;
          pullDistanceRef.current = 0;
          setIsPulling(false);
          setPullDistance(0);
        }
        return;
      }

      // Dead zone: Erst aktivieren wenn der Finger deutlich nach unten bewegt wurde
      if (!committed.current) {
        if (diff < DEAD_ZONE) {
          // Noch in der Dead Zone — KEIN preventDefault, normales Scrollen erlauben
          return;
        }

        // Am Punkt der Aktivierung nochmal prüfen ob wir noch ganz oben sind.
        // Ein scrollbarer Container könnte durch Momentum-Scroll inzwischen
        // weiter gescrollt haben.
        if (!isAtAbsoluteScrollTop(touchTarget.current)) {
          gestureActive.current = false;
          return;
        }

        // PTR aktivieren
        committed.current = true;
        // Start-Position auf aktuelle Position setzen, damit der Pull bei 0 anfängt
        startY.current = currentY;
      }

      // Ab hier: committed PTR-Geste
      const pullDiff = currentY - startY.current;
      const distance = Math.min(
        pullDiff * 0.5, // Easing: Reduziere die Bewegung um 50%
        maxPullRef.current
      );

      if (distance > 0) {
        e.preventDefault();
        isPullingRef.current = true;
        pullDistanceRef.current = distance;
        setIsPulling(true);
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = async () => {
      if (isRefreshingRef.current) return;

      if (committed.current && isPullingRef.current && pullDistanceRef.current >= thresholdRef.current) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        try {
          await onRefreshRef.current();
        } catch (error) {
          console.error('Refresh failed:', error);
        } finally {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
        }
      }

      // Reset
      gestureActive.current = false;
      committed.current = false;
      isPullingRef.current = false;
      pullDistanceRef.current = 0;
      setIsPulling(false);
      setPullDistance(0);
    };

    // passive: false nur für touchmove, weil nur dort preventDefault nötig ist
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isEnabled]); // Minimale Dependencies — Gesture-State lebt in Refs

  return {
    isPulling: isPulling || isRefreshing,
    pullDistance,
    isRefreshing,
  };
};