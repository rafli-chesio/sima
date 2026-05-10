"use client";

import { useState, useEffect } from "react";
import { getUnreadNotifications, markAsRead } from "@/app/actions/notifications";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getUnreadNotifications().then(setNotifications);
    // Basic polling every 30 seconds
    const interval = setInterval(() => {
      getUnreadNotifications().then(setNotifications);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors relative"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-sidebar">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-zinc-800 bg-zinc-900/50">
            <h3 className="font-semibold text-white">Notifikasi</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-zinc-500">
                Tidak ada notifikasi baru
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="p-3 border-b border-zinc-800/50 hover:bg-white/5 transition-colors group">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-sm font-medium text-white">{notif.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1">{notif.message}</p>
                      <p className="text-[10px] text-zinc-500 mt-2">{new Date(notif.createdAt).toLocaleString('id-ID')}</p>
                    </div>
                    <button 
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                    >
                      Tandai dibaca
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
