import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Scissors, Bell, UserPlus, X, Mail } from 'lucide-react';
import { io } from 'socket.io-client';
import { Booking, Service, AppNotification } from './types';
import { defaultServices } from './data';
import CalendarView from './components/CalendarView';
import ServiceManagement from './components/ServiceManagement';
import ClientSimulator from './components/ClientSimulator';
import PublicBookingForm from './components/PublicBookingForm';
import NotificationsView from './components/NotificationsView';
import { cn } from './utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'services' | 'simulator' | 'notifications'>('calendar');
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Check if we are on the public booking route
  const [isPublicRoute, setIsPublicRoute] = useState(false);

  useEffect(() => {
    // Simple client-side routing check
    if (window.location.pathname === '/booking') {
      setIsPublicRoute(true);
    }

    // Fetch initial bookings
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => setBookings(data))
      .catch(err => console.error("Failed to load bookings", err));

    // Listen for real-time updates via WebSockets
    const socket = io();
    
    socket.on('booking_added', (newBooking: any) => {
      setBookings(prev => {
        // Prevent duplicates
        if (prev.some(b => b.id === newBooking.id)) return prev;
        return [...prev, newBooking];
      });
      
      // Add notification for admin
      if (newBooking.type === 'booking') {
        setNotifications(prev => {
          // Prevent duplicate notifications
          if (prev.some(n => n.details?.date === newBooking.date && n.details?.time === newBooking.startTime && n.details?.customerName === newBooking.customerName)) {
            return prev;
          }
          
          const newNotif: AppNotification = {
            id: Math.random().toString(36).substring(7),
            type: 'booking_received',
            message: `New booking: ${newBooking.customerName}`,
            details: {
              customerName: newBooking.customerName,
              customerEmail: newBooking.customerEmail,
              serviceName: newBooking.serviceName || 'Unknown',
              date: newBooking.date,
              time: newBooking.startTime,
              price: newBooking.price || 0
            },
            timestamp: new Date(),
            read: false,
          };
          return [newNotif, ...prev];
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleAddBooking = async (booking: any) => {
    // Send to server instead of just updating local state
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      });
    } catch (error) {
      console.error("Failed to save booking", error);
    }
  };

  const handleUpdateBooking = (updatedBooking: Booking) => {
    setBookings((prev) => prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)));
  };

  const markNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // If we are on the public route, ONLY show the booking form
  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <PublicBookingForm services={services} onBook={handleAddBooking} bookings={bookings} />
        </div>
      </div>
    );
  }

  // Otherwise, show the full Admin Dashboard
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-6">
          <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-wider uppercase">Good Vibes</h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Admin Dashboard</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('calendar')}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
              activeTab === 'calendar' ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <CalendarIcon size={20} />
            <span>Daily Schedule</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors relative",
              activeTab === 'notifications' ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Mail size={20} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
              activeTab === 'services' ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Scissors size={20} />
            <span>Services Menu</span>
          </button>
          
          <div className="pt-8 pb-2">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Testing & Integration</p>
          </div>
          <button
            onClick={() => setActiveTab('simulator')}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
              activeTab === 'simulator' ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <UserPlus size={20} />
            <span>Simulate & Embed</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <h2 className="text-xl font-medium text-slate-800">
            {activeTab === 'calendar' && 'Manager Calendar'}
            {activeTab === 'services' && 'Service Management'}
            {activeTab === 'simulator' && 'Client Booking Simulator'}
          </h2>
          
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) markNotificationsRead();
              }}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors relative"
            >
              <Bell size={20} className="text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-medium text-slate-800">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No notifications yet</div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <p className="text-sm text-slate-700">{notif.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{notif.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-50">
          {activeTab === 'calendar' && (
            <CalendarView 
              bookings={bookings} 
              services={services} 
              onUpdateBooking={handleUpdateBooking}
              onAddBlock={handleAddBooking}
            />
          )}
          {activeTab === 'notifications' && (
            <NotificationsView 
              notifications={notifications} 
              onMarkRead={markNotificationsRead} 
            />
          )}
          {activeTab === 'services' && (
            <ServiceManagement services={services} setServices={setServices} />
          )}
          {activeTab === 'simulator' && (
            <ClientSimulator services={services} onBook={handleAddBooking} bookings={bookings} />
          )}
        </div>
      </main>
    </div>
  );
}
