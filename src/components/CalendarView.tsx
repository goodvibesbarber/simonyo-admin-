import React, { useState } from 'react';
import { format, parse, addMinutes, isSameDay } from 'date-fns';
import { Booking, Service } from '../types';
import { Clock, Ban, X, Check } from 'lucide-react';
import { cn } from '../utils';

const START_HOUR = 9;
const END_HOUR = 18;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
const HOUR_HEIGHT = 100; // pixels per hour
const MINUTE_HEIGHT = HOUR_HEIGHT / 60;

type CalendarViewProps = {
  bookings: Booking[];
  services: Service[];
  onUpdateBooking: (booking: Booking) => void;
  onAddBlock: (booking: Booking) => void;
};

export default function CalendarView({ bookings, services, onUpdateBooking, onAddBlock }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  
  // Filter active bookings for the selected date
  const activeBookings = bookings.filter(
    (b) => b.status === 'active' && b.date === format(selectedDate, 'yyyy-MM-dd')
  );

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const handleCancelBooking = () => {
    if (selectedBooking) {
      onUpdateBooking({ ...selectedBooking, status: 'cancelled' });
      setSelectedBooking(null);
    }
  };

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-serif text-slate-800">Daily Schedule</h2>
          <p className="text-slate-500 mt-1">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex space-x-4">
          <input 
            type="date" 
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
          <button 
            onClick={() => setShowBlockModal(true)}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
          >
            <Ban size={16} />
            <span>Manual Block</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden relative shadow-sm">
        <div className="absolute top-0 left-0 w-20 h-full border-r border-slate-200 bg-slate-50 z-10"></div>
        
        <div className="relative" style={{ height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px` }}>
          {/* Time Lines */}
          {HOURS.map((hour, i) => {
            if (i === HOURS.length - 1) return null; // Don't draw line for the very end if we don't want an extra row
            return (
              <div 
                key={hour} 
                className="absolute w-full border-t border-slate-100 flex items-start"
                style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
              >
                <div className="w-20 shrink-0 text-right pr-4 py-2 text-xs text-slate-400 font-mono z-20">
                  {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                </div>
              </div>
            );
          })}

          {/* Bookings */}
          {activeBookings.map((booking) => {
            const [startH, startM] = booking.startTime.split(':').map(Number);
            const [endH, endM] = booking.endTime.split(':').map(Number);
            
            const top = ((startH - START_HOUR) * 60 + startM) * MINUTE_HEIGHT;
            const duration = (endH * 60 + endM) - (startH * 60 + startM);
            const height = duration * MINUTE_HEIGHT;
            
            const isBlock = booking.type === 'block';
            const service = services.find(s => s.id === booking.serviceId);
            const colorClass = isBlock ? "bg-slate-100 border-slate-300 text-slate-600" : (service?.color || "bg-blue-100 border-blue-300 text-blue-800");

            return (
              <div
                key={booking.id}
                onClick={() => handleBookingClick(booking)}
                className={cn(
                  "absolute left-24 right-4 rounded-md p-3 cursor-pointer transition-transform hover:scale-[1.01] shadow-sm border",
                  colorClass
                )}
                style={{ top: `${top}px`, height: `${height}px` }}
              >
                <div className="flex justify-between items-start h-full">
                  <div>
                    <h4 className="font-bold text-sm leading-tight">
                      {isBlock ? 'Blocked Time' : booking.customerName}
                    </h4>
                    {!isBlock && service && (
                      <p className="text-xs opacity-90 mt-1 font-medium">{service.name}</p>
                    )}
                  </div>
                  <div className="text-xs font-mono font-semibold opacity-80">
                    {booking.startTime} - {booking.endTime}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-serif text-slate-800">
                {selectedBooking.type === 'block' ? 'Blocked Time Details' : 'Booking Details'}
              </h3>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {selectedBooking.type === 'booking' && (
                <>
                  <div>
                    <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Customer</p>
                    <p className="text-lg font-medium text-slate-900">{selectedBooking.customerName}</p>
                    {selectedBooking.customerEmail && (
                      <p className="text-sm text-slate-500 mt-1">{selectedBooking.customerEmail}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Service</p>
                    <p className="text-lg text-slate-900">
                      {services.find(s => s.id === selectedBooking.serviceId)?.name || 'Unknown'}
                    </p>
                  </div>
                </>
              )}
              
              <div className="flex space-x-8">
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Date</p>
                  <p className="font-mono text-slate-900">{selectedBooking.date}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Time</p>
                  <p className="font-mono text-slate-900">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex space-x-4 bg-slate-50">
              <button 
                onClick={handleCancelBooking}
                className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 py-3 rounded-lg font-medium transition-colors"
              >
                {selectedBooking.type === 'block' ? 'Remove Block' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Block Modal */}
      {showBlockModal && (
        <BlockModal 
          onClose={() => setShowBlockModal(false)} 
          onAdd={(block) => {
            onAddBlock(block);
            setShowBlockModal(false);
          }}
          selectedDate={format(selectedDate, 'yyyy-MM-dd')}
        />
      )}
    </div>
  );
}

function BlockModal({ onClose, onAdd, selectedDate }: { onClose: () => void, onAdd: (b: Booking) => void, selectedDate: string }) {
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: Math.random().toString(36).substring(7),
      customerName: 'Blocked',
      serviceId: null,
      date: selectedDate,
      startTime,
      endTime,
      status: 'active',
      type: 'block'
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-serif text-slate-800">Add Manual Block</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-2">Start Time</label>
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">End Time</label>
              <input 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none shadow-sm"
                required
              />
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-lg transition-colors shadow-sm"
          >
            Block Time Slot
          </button>
        </form>
      </div>
    </div>
  );
}
