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
    <div className="bg-gray-50 flex min-h-screen overflow-x-hidden">
      <UrgentAnnouncementPopup />
      <SidebarManager />
      <main className={`flex-1 min-h-screen p-8 animate-in fade-in duration-700 transition-all duration-500 ${isSidebarRetracted ? 'ml-32' : 'ml-96'}`}>
        {children}
      </main>
    </div>
  );
}
