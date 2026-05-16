"use client";
import { UIProvider } from "../context/UIContext";
import "./globals.css";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const mustChange = localStorage.getItem("mustChangePassword");
    const token = localStorage.getItem("token");
    
    if (token && mustChange === "true" && pathname !== "/change-password" && pathname !== "/login") {
      router.push("/change-password");
    }
  }, [pathname, router]);

  return (
    <html lang="fr" className="no-scrollbar">
      <body className="bg-gray-50 flex flex-col min-h-screen overflow-x-hidden antialiased">
          <UIProvider>
            {children}
          </UIProvider>
      </body>
    </html>
  );
}