"use client";
import { useUI } from "../../context/UIContext";
import SidebarManager from "../components/SidebarManager";
import UrgentAnnouncementPopup from "../components/UrgentAnnouncementPopup";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarRetracted } = useUI();

  return (
    <div className="flex min-h-screen overflow-x-hidden font-sans text-slate-900 relative">
      <div 
        className="fixed inset-0 z-[-2]"
        style={{
          backgroundImage: 'url("/bg-dashboard.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[-1] pointer-events-none" />
      
      <UrgentAnnouncementPopup />
      <SidebarManager />
      
      {/* 
        Mobile: pt-20 (to clear the top bar), no left margin
        Desktop: lg:pt-8, ml depends on sidebar state
      */}
      <main className={`flex-1 min-h-screen p-4 pt-20 lg:p-8 animate-in fade-in duration-700 transition-all ease-in-out
        ${isSidebarRetracted ? 'lg:ml-32' : 'lg:ml-96'}
      `}>
        {children}
      </main>
    </div>
  );
}
