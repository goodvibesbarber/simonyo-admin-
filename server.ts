import express from "express";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";

const BOOKINGS_FILE = path.join(process.cwd(), "bookings.json");

// Initialize file if it doesn't exist
if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([]));
}

function getBookings() {
  try {
    const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveBooking(booking: any) {
  const bookings = getBookings();
  // Prevent duplicates
  if (!bookings.some((b: any) => b.id === booking.id)) {
    bookings.push(booking);
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });
  const PORT = 3000;

  // Robust CORS for Vercel integration
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept']
  }));
  app.use(express.json());

  app.get("/api/bookings", (req, res) => {
    res.json(getBookings());
  });

  // Test endpoint to verify webhook is reachable
  app.get("/api/test-webhook", (req, res) => {
    res.json({ status: "Webhook endpoint is active and reachable!" });
  });

  // API routes FIRST
  app.post("/api/bookings", async (req, res) => {
    let bookingData = req.body;

    // Handle FormSubmit Webhook Payload
    if (bookingData.name && bookingData.service && !bookingData.customerName) {
      let estimatedPrice = 35;
      if (bookingData.service.includes('Student')) estimatedPrice = 25;
      if (bookingData.service.includes('Beard')) estimatedPrice = 25;
      if (bookingData.service.includes('Shave')) estimatedPrice = 30;
      if (bookingData.service === 'Vibes Experience') estimatedPrice = 55;
      if (bookingData.service === 'Good Vibes Experience') estimatedPrice = 70;
      if (bookingData.service.includes('Wax')) estimatedPrice = 8;

      const [timeStr, modifier] = (bookingData.time || "12:00 PM").split(' ');
      let [hours, minutes] = timeStr.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      
      const startTime24 = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const endTime24 = `${(hours + 1).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      bookingData = {
        id: Math.random().toString(36).substring(7),
        customerName: bookingData.name,
        customerEmail: bookingData.email,
        serviceId: 'external',
        serviceName: bookingData.service,
        date: bookingData.date,
        startTime: startTime24,
        endTime: endTime24,
        status: 'active',
        type: 'booking',
        price: estimatedPrice
      };
    }

    if (!bookingData.id) {
      bookingData.id = Math.random().toString(36).substring(7);
    }

    // Save to persistent file storage
    saveBooking(bookingData);
    
    // Broadcast to all connected clients (Admin Dashboard)
    io.emit("booking_added", bookingData);

    // Send email if it's a real customer booking
    if (bookingData.type === 'booking' && bookingData.customerEmail) {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          const { customerEmail, customerName, serviceName, date, startTime, price } = bookingData;
          
          // 1. Send confirmation to Customer
          await resend.emails.send({
            from: "Good Vibes <onboarding@resend.dev>",
            to: customerEmail,
            subject: "Booking Confirmation - Good Vibes",
            html: `
              <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h1 style="color: #C5A059; text-transform: uppercase; letter-spacing: 1px;">Good Vibes</h1>
                <h2 style="color: #1A1A1A;">Booking Confirmation</h2>
                <p>Hi ${customerName},</p>
                <p>Your appointment at Good Vibes has been confirmed. Here are the details:</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Service</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Date</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Time</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${startTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Price</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${price}</td>
                  </tr>
                </table>
                <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 4px;">
                  <h3 style="margin-top: 0; color: #1A1A1A;">Location</h3>
                  <p style="margin-bottom: 0;">123 Luxury Ave, Suite 400<br>Beverly Hills, CA 90210</p>
                </div>
              </div>
            `,
          });

          // 2. Send notification to Admin (You)
          await resend.emails.send({
            from: "Good Vibes System <onboarding@resend.dev>",
            to: "pasposip@gmail.com",
            subject: `New Booking: ${customerName} - ${serviceName}`,
            html: `
              <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #1A1A1A;">New Appointment Received</h2>
                <p>You have a new booking on your calendar:</p>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Customer:</strong> ${customerName}</li>
                  <li><strong>Email:</strong> ${customerEmail}</li>
                  <li><strong>Service:</strong> ${serviceName}</li>
                  <li><strong>Date:</strong> ${date}</li>
                  <li><strong>Time:</strong> ${startTime}</li>
                  <li><strong>Price:</strong> $${price}</li>
                </ul>
                <p style="margin-top: 20px;">
                  <a href="${process.env.APP_URL || '#'}" style="background-color: #1A1A1A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Open Admin Dashboard</a>
                </p>
              </div>
            `,
          });
        } catch (error) {
          console.error("Resend error:", error);
        }
      }
    }

    res.json({ success: true, booking: bookingData });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
