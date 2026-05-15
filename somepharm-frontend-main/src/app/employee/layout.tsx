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
    <div className="bg-slate-50 flex min-h-screen overflow-x-hidden font-sans text-slate-900">
      <UrgentAnnouncementPopup />
      <SidebarEmployee />
      <main className={`flex-1 min-h-screen p-4 pt-20 lg:p-8 animate-in fade-in duration-700 transition-all duration-500 ml-0 ${isSidebarRetracted ? 'lg:ml-32' : 'lg:ml-96'}`}>
        {children}
      </main>
    </div>
  );
}
