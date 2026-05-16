"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Trash2, Clock, X } from 'lucide-react';

interface Notification {
  idNotification: number;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const [notifsRes, countRes] = await Promise.all([
        fetch("http://localhost:8080/api/notifications", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8080/api/notifications/unread-count", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (notifsRes.ok) setNotifications(await notifsRes.json());
      if (countRes.ok) setUnreadCount(await countRes.json());
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: number) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:8080/api/notifications/${id}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchNotifications();
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:8080/api/notifications/read-all`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchNotifications();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all group"
      >
        <Bell size={20} className={`text-gray-500 group-hover:text-blue-600 transition-colors ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white border-2 border-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/20 z-[100] overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="p-5 border-b border-gray-100/50 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-black text-xs uppercase tracking-widest text-gray-800 italic">Centre de Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-700 underline underline-offset-4"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-100/50">
                {notifications.map((notif) => (
                  <div 
                    key={notif.idNotification} 
                    className={`p-4 hover:bg-white/50 transition-colors group relative ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                  >
                    {!notif.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />
                    )}
                    <div className="flex gap-3">
                      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${notif.isRead ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                        <Bell size={14} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={`text-xs leading-relaxed ${notif.isRead ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                          <Clock size={10} />
                          {new Date(notif.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          <span>•</span>
                          {new Date(notif.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      {!notif.isRead && (
                        <button 
                          onClick={() => markAsRead(notif.idNotification)}
                          className="shrink-0 p-1 rounded-lg hover:bg-blue-100 text-blue-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                          title="Marquer comme lu"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                <Bell size={32} className="text-gray-200" />
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Aucune notification</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-gray-50/50 border-t border-gray-100/50 text-center">
             <button className="text-[9px] font-black uppercase text-gray-400 hover:text-gray-600 tracking-widest transition-colors">
                Voir tout l'historique
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
