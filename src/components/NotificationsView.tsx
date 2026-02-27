import React from 'react';
import { AppNotification } from '../types';
import { format } from 'date-fns';
import { Mail, Calendar, Clock, User, Tag, DollarSign } from 'lucide-react';

export default function NotificationsView({ 
  notifications, 
  onMarkRead 
}: { 
  notifications: AppNotification[],
  onMarkRead: () => void
}) {
  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-serif text-slate-800">Notifications Log</h2>
          <p className="text-slate-500 mt-1">A history of all client activities and bookings</p>
        </div>
        <button 
          onClick={onMarkRead}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm">
            <Mail className="mx-auto mb-4 opacity-20" size={48} />
            <p>No notifications yet. New bookings will appear here.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`bg-white border rounded-xl p-6 shadow-sm transition-all ${
                notif.read ? 'border-slate-200 opacity-80' : 'border-blue-200 ring-1 ring-blue-50 shadow-md'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${notif.type === 'booking_received' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{notif.message}</h3>
                    <p className="text-xs text-slate-400">{format(notif.timestamp, 'MMM d, h:mm a')}</p>
                  </div>
                </div>
                {!notif.read && (
                  <span className="bg-blue-600 w-2 h-2 rounded-full"></span>
                )}
              </div>

              {notif.details && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center space-x-3 text-sm">
                    <User size={16} className="text-slate-400" />
                    <span className="text-slate-600 font-medium">{notif.details.customerName}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail size={16} className="text-slate-400" />
                    <span className="text-slate-600">{notif.details.customerEmail || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Tag size={16} className="text-slate-400" />
                    <span className="text-slate-600">{notif.details.serviceName}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="text-slate-600">{notif.details.date}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Clock size={16} className="text-slate-400" />
                    <span className="text-slate-600">{notif.details.time}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <DollarSign size={16} className="text-slate-400" />
                    <span className="text-slate-600 font-mono">${notif.details.price}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
