"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

type LayoutMode = "mobile" | "web";

interface LayoutContextType {
  layout: LayoutMode;
  setLayout: (mode: LayoutMode) => void;
  toggleLayout: () => void;
  isHydrated: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const STORAGE_KEY = "espanyol-layout-mode";
const BREAKPOINT = 1024; // lg breakpoint — below this always mobile

export function LayoutProvider({ children }: { children: ReactNode }) {
  // Always start with mobile to match server render
  const [layout, setLayoutState] = useState<LayoutMode>("mobile");
  const [isHydrated, setIsHydrated] = useState(false);

  // Auto-detect layout from viewport + sync with localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as LayoutMode | null;
    const isWide = window.innerWidth >= BREAKPOINT;

    // If viewport is narrow, force mobile regardless of stored preference
    if (!isWide) {
      setLayoutState("mobile");
    } else if (stored === "web" || stored === "mobile") {
      setLayoutState(stored);
    } else {
      // No preference stored — auto-detect from viewport
      setLayoutState(isWide ? "web" : "mobile");
    }
    setIsHydrated(true);

    // Listen for resize to auto-switch
    const mq = window.matchMedia(`(min-width: ${BREAKPOINT}px)`);
    const handler = (e: MediaQueryListEvent) => {
      if (!e.matches) {
        // Viewport went narrow → force mobile
        setLayoutState("mobile");
      } else {
        // Viewport went wide → restore user preference or default to web
        const pref = localStorage.getItem(STORAGE_KEY) as LayoutMode | null;
        setLayoutState(pref || "web");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setLayout = useCallback((mode: LayoutMode) => {
    setLayoutState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const toggleLayout = useCallback(() => {
    setLayoutState((prev) => {
      const newMode = prev === "mobile" ? "web" : "mobile";
      localStorage.setItem(STORAGE_KEY, newMode);
      return newMode;
    });
  }, []);

  return (
    <LayoutContext.Provider value={{ layout, setLayout, toggleLayout, isHydrated }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
