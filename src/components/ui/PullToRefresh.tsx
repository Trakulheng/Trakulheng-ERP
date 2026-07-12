"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const THRESHOLD = 72; // px of pull needed to trigger refresh

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [isActive, setIsActive] = useState(false); // finger currently down
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  // Disable native browser pull-to-refresh on Android Chrome
  useEffect(() => {
    const prev = document.body.style.overscrollBehaviorY;
    document.body.style.overscrollBehaviorY = "none";
    return () => { document.body.style.overscrollBehaviorY = prev; };
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY !== 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [refreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) { pulling.current = false; setPull(0); setIsActive(false); return; }
    setIsActive(true);
    // Rubber-band resistance: travel slows the further you pull
    setPull(Math.min(delta * 0.45, THRESHOLD + 20));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!pulling.current) return;
    pulling.current = false;
    setIsActive(false);
    setPull((p) => {
      if (p >= THRESHOLD * 0.65) {
        setRefreshing(true);
        // Refresh server data + notify client pages via custom event
        router.refresh();
        window.dispatchEvent(new CustomEvent("pull-refresh"));
        setTimeout(() => { setRefreshing(false); setPull(0); }, 1400);
        return THRESHOLD; // hold indicator while loading
      }
      return 0; // snap back
    });
  }, [router]);

  useEffect(() => {
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pull / (THRESHOLD * 0.65), 1);
  const triggered = pull >= THRESHOLD * 0.65;
  const transition = isActive ? "none" : "transform 0.25s cubic-bezier(0.4,0,0.2,1)";

  return (
    <>
      {/* Indicator pill — slides in from the top of the viewport */}
      <div
        className="fixed top-0 inset-x-0 z-[200] flex justify-center pointer-events-none"
        style={{ transform: `translateY(${pull - 56}px)`, transition }}
      >
        <div className={cn(
          "mt-3 w-10 h-10 rounded-full shadow-lg border-2 flex items-center justify-center transition-colors duration-150",
          triggered || refreshing
            ? "bg-blue-600 border-blue-500"
            : "bg-white border-slate-200"
        )}>
          <RefreshCw
            size={16}
            className={cn(
              "transition-colors duration-150",
              triggered || refreshing ? "text-white" : "text-slate-400",
              refreshing && "animate-spin"
            )}
            style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
          />
        </div>
      </div>

      {/* Page content shifts down slightly while pulling */}
      <div style={{ transform: `translateY(${pull}px)`, transition }}>
        {children}
      </div>
    </>
  );
}
