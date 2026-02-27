import React, { useState } from 'react';
import { Service, Booking } from '../types';
import { format, addMinutes } from 'date-fns';

export default function PublicBookingForm({ 
  services, 
  onBook,
  bookings
}: { 
  services: Service[], 
  onBook: (b: Booking) => void,
  bookings: Booking[]
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('10:00');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    // Calculate end time
    const [hours, minutes] = time.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = addMinutes(startDate, service.durationMinutes);
    const endTime = format(endDate, 'HH:mm');

    // Check for conflicts
    const hasConflict = bookings.some(b => {
      if (b.status !== 'active' || b.date !== date) return false;
      return (time >= b.startTime && time < b.endTime) || 
             (endTime > b.startTime && endTime <= b.endTime) ||
             (time <= b.startTime && endTime >= b.endTime);
    });

    if (hasConflict) {
      alert('This time slot is already occupied. Please choose another time.');
      return;
    }

    const payload = {
      id: Math.random().toString(36).substring(7),
      customerName: name,
      customerEmail: email,
      serviceId,
      date,
      startTime: time,
      endTime,
      status: 'active',
      type: 'booking',
      serviceName: service.name,
      price: service.price
    };

    setIsSubmitting(true);

    try {
      // Pass the full payload to the parent component which handles the server request
      await onBook(payload as any);
    } catch (error) {
      console.error('Error sending booking:', error);
    }

    setIsSubmitting(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
    setName('');
    setEmail('');
  };

  if (success) {
    return (
      <div className="bg-white p-12 rounded-2xl shadow-xl text-center max-w-2xl mx-auto border border-slate-100">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-serif text-slate-800 mb-4">Booking Confirmed!</h2>
        <p className="text-slate-600 text-lg mb-8">
          Thank you for booking with Good Vibes. We've sent a confirmation email to your address with all the details.
        </p>
        <button 
          onClick={() => setSuccess(false)}
          className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          Book Another Appointment
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-slate-100">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-serif text-slate-900 mb-3 uppercase tracking-wider">Good Vibes</h1>
        <p className="text-slate-500 text-lg">Book your next appointment</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 uppercase tracking-wider">Your Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-4 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-shadow"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-4 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-shadow"
              placeholder="john@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-4 uppercase tracking-wider">Select Service</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(service => {
              const isSelected = serviceId === service.id;
              const colorClasses = service.color.split(' ');
              const bgClass = colorClasses.find(c => c.startsWith('bg-'));
              const borderClass = colorClasses.find(c => c.startsWith('border-'));
              const textClass = colorClasses.find(c => c.startsWith('text-'));

              return (
                <div 
                  key={service.id}
                  onClick={() => setServiceId(service.id)}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? `${bgClass} ${borderClass} shadow-md scale-[1.02]` 
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-semibold ${isSelected ? textClass : 'text-slate-800'}`}>{service.name}</span>
                    <span className={`font-mono font-medium ${isSelected ? textClass : 'text-slate-600'}`}>${service.price}</span>
                  </div>
                  <div className={`text-sm ${isSelected ? textClass : 'text-slate-500'} opacity-80`}>{service.durationMinutes} min</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 uppercase tracking-wider">Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-4 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-shadow"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 uppercase tracking-wider">Time</label>
            <input 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              min="09:00"
              max="17:30"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-4 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-shadow"
              required
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-slate-900 hover:bg-black text-white font-bold py-5 rounded-xl uppercase tracking-wider transition-colors mt-8 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {isSubmitting ? 'Processing...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
}
