"use client";
import { useUI } from "../../context/UIContext";
import SidebarEmployee from "../components/SidebarEmployee";
import UrgentAnnouncementPopup from "../components/UrgentAnnouncementPopup";

export default function EmployeeLayout({
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
      <SidebarEmployee />
      <main className={`flex-1 min-h-screen p-4 pt-20 lg:p-8 animate-in fade-in duration-700 transition-all duration-500 ml-0 ${isSidebarRetracted ? 'lg:ml-32' : 'lg:ml-96'}`}>
        {children}
      </main>
    </div>
  );
}
