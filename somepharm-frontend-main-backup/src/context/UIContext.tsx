"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface UIContextType {
  isSidebarRetracted: boolean;
  setSidebarRetracted: (value: boolean) => void;
  activeModalCount: number;
  incrementModalCount: () => void;
  decrementModalCount: () => void;
  activeHRRequest: any | null;
  setActiveHRRequest: (request: any | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isSidebarRetracted, setSidebarRetracted] = useState(false);
  const [activeModalCount, setActiveModalCount] = useState(0);
  const [activeHRRequest, setActiveHRRequest] = useState<any | null>(null);

  const incrementModalCount = () => setActiveModalCount((prev) => prev + 1);
  const decrementModalCount = () => setActiveModalCount((prev) => Math.max(0, prev - 1));

  return (
    <UIContext.Provider
      value={{
        isSidebarRetracted,
        setSidebarRetracted,
        activeModalCount,
        incrementModalCount,
        decrementModalCount,
        activeHRRequest,
        setActiveHRRequest,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
