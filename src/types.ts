export type Service = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  color: string;
};

export type Booking = {
  id: string;
  customerName: string;
  customerEmail?: string;
  serviceId: string | null; // null for manual blocks
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'active' | 'cancelled';
  type: 'booking' | 'block';
};

export type AppNotification = {
  id: string;
  type: 'booking_received' | 'booking_cancelled';
  message: string;
  details?: {
    customerName: string;
    customerEmail?: string;
    serviceName: string;
    date: string;
    time: string;
    price: number;
  };
  timestamp: Date;
  read: boolean;
};
