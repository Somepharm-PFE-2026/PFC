"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Search, Menu, X } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  userName?: string;
  userRole?: string;
  pageTitle?: string;
}

export default function AppShell({ 
  children, 
  navItems, 
  userName = "User", 
  userRole = "Role", 
  pageTitle = "Dashboard" 
}: AppShellProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 text-sm antialiased">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 flex flex-col z-30 transition-all duration-300 ease-in-out shadow-sm
        ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"} 
        md:translate-x-0 md:w-20 
        lg:w-64
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          <span className="text-teal-600 font-heading font-bold text-xl tracking-tight md:hidden lg:block">SomePharm</span>
          <span className="text-teal-600 font-heading font-bold text-xl tracking-tight hidden md:block lg:hidden mx-auto">SP</span>
          <button 
            className="md:hidden text-slate-400 hover:text-slate-600 transition-colors"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                title={item.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? "bg-teal-50 text-teal-700 font-medium shadow-sm" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                } md:justify-center lg:justify-start`}
              >
                {React.cloneElement(item.icon as React.ReactElement, {
                  className: `w-5 h-5 shrink-0 transition-colors ${isActive ? "text-teal-600" : "text-slate-400"}`
                })}
                <span className="truncate md:hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen w-full min-w-0 transition-all duration-300 md:ml-20 lg:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-10 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 gap-4 shadow-sm">
          <div className="flex items-center gap-4 shrink-0">
            <button 
              className="md:hidden text-slate-500 hover:text-slate-700 p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-heading font-semibold text-slate-800 truncate max-w-[150px] sm:max-w-xs lg:max-w-md">{pageTitle}</h1>
          </div>

          <div className="hidden sm:flex flex-1 max-w-lg mx-6">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-5 shrink-0">
            <button className="sm:hidden text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-slate-400 hover:text-slate-600 relative p-2 rounded-full hover:bg-slate-50 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-3 pl-1">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-slate-900 leading-none">{userName}</p>
                <p className="text-xs text-slate-500 mt-1">{userRole}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border border-teal-200 shrink-0 shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
