"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface UIContextType {
  isSidebarRetracted: boolean;
  setSidebarRetracted: (value: boolean) => void;
  activeModalCount: number;
  incrementModalCount: () => void;
  decrementModalCount: () => void;
  activeHRRequest: any | null;
  setActiveHRRequest: (request: any | null) => void;
  addToast: (type: Toast['type'], message: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isSidebarRetracted, setSidebarRetracted] = useState(false);
  const [activeModalCount, setActiveModalCount] = useState(0);
  const [activeHRRequest, setActiveHRRequest] = useState<any | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const incrementModalCount = () => setActiveModalCount((prev) => prev + 1);
  const decrementModalCount = () => setActiveModalCount((prev) => Math.max(0, prev - 1));

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
        addToast,
      }}
    >
      {children}
      
      {/* Global Toast Container */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 items-end pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          
          return (
            <div 
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 w-max max-w-sm p-4 rounded-xl shadow-lg border animate-in slide-in-from-right-8 fade-in duration-300 ${
                isSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                isError ? 'bg-rose-50 border-rose-200 text-rose-800' :
                isWarning ? 'bg-amber-50 border-amber-200 text-amber-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="shrink-0">
                {isSuccess && <CheckCircle2 className="text-emerald-600" size={20} />}
                {isError && <AlertCircle className="text-rose-600" size={20} />}
                {isWarning && <AlertTriangle className="text-amber-600" size={20} />}
                {!isSuccess && !isError && !isWarning && <Info className="text-blue-600" size={20} />}
              </div>
              <p className="text-sm font-semibold tracking-wide flex-1">{toast.message}</p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
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
