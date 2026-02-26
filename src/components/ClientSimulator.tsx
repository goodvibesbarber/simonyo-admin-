import React, { useState } from 'react';
import { Service, Booking } from '../types';
import { format, addMinutes } from 'date-fns';

export default function ClientSimulator({ 
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
  const [showEmbedCode, setShowEmbedCode] = useState(false);

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

    setIsSubmitting(true);

    try {
      // Send confirmation email via backend
      const response = await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          serviceName: service.name,
          date,
          time,
          price: service.price
        }),
      });

      if (!response.ok) {
        console.error('Failed to send confirmation email');
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }

    onBook({
      id: Math.random().toString(36).substring(7),
      customerName: name,
      customerEmail: email,
      serviceId,
      date,
      startTime: time,
      endTime,
      status: 'active',
      type: 'booking'
    });

    setIsSubmitting(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setName('');
    setEmail('');
  };

  const appUrl = process.env.APP_URL || window.location.origin;
  const embedCode = `<iframe src="${appUrl}/booking" width="100%" height="800" frameborder="0" style="border:none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"></iframe>`;

  return (
    <div className="p-6 w-full">
      <div className="mb-8 border-b border-slate-200 pb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-serif text-slate-800">Good Vibes Booking</h2>
          <p className="text-slate-500 mt-1">Simulate a client booking an appointment on the frontend.</p>
        </div>
        <button 
          onClick={() => setShowEmbedCode(!showEmbedCode)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showEmbedCode ? 'Hide Embed Code' : 'Get Embed Code'}
        </button>
      </div>

      {showEmbedCode && (
        <div className="mb-8 bg-slate-800 text-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-medium mb-2">How to link this to your website</h3>
          <p className="text-slate-300 text-sm mb-4">
            Copy and paste this HTML code into your website (e.g., WordPress, Squarespace, Wix, or custom HTML) to embed the booking form directly on your page.
          </p>
          <div className="relative">
            <pre className="bg-slate-900 p-4 rounded-lg text-sm font-mono overflow-x-auto text-green-400">
              {embedCode}
            </pre>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(embedCode);
                alert('Copied to clipboard!');
              }}
              className="absolute top-3 right-3 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-xs transition-colors"
            >
              Copy
            </button>
          </div>
          <div className="mt-4 text-sm text-slate-400">
            <strong>Alternative:</strong> You can also just link directly to <a href={`${appUrl}/booking`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{appUrl}/booking</a> from a "Book Now" button on your site.
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6 shadow-sm">
          Booking confirmed! Check the Admin Dashboard to see the notification and calendar update.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 uppercase tracking-wider">Your Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-shadow"
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
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-shadow"
              placeholder="john@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3 uppercase tracking-wider">Select Service</label>
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
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
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
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-shadow"
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
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-shadow"
              required
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg uppercase tracking-wider transition-colors mt-6 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processing...' : 'Book Appointment'}
        </button>
      </form>
    </div>
  );
}
