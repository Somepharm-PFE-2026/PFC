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
    <div className="bg-gray-50 flex min-h-screen overflow-x-hidden">
      <UrgentAnnouncementPopup />
      <SidebarEmployee />
      <main className={`flex-1 min-h-screen p-8 animate-in fade-in duration-700 transition-all duration-500 ${isSidebarRetracted ? 'ml-32' : 'ml-96'}`}>
        {children}
      </main>
    </div>
  );
}
