import express from "express";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/send-confirmation", async (req, res) => {
    const { email, name, serviceName, date, time, price } = req.body;

    if (!email || !name || !serviceName || !date || !time || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY is not set. Simulating email sending.");
      return res.json({ 
        success: true, 
        simulated: true,
        message: `Simulated email sent to ${email} for ${serviceName} on ${date} at ${time}.` 
      });
    }

    try {
      const resend = new Resend(resendApiKey);
      
      const { data, error } = await resend.emails.send({
        from: "Good Vibes <onboarding@resend.dev>", // Using Resend's testing domain
        to: email,
        subject: "Booking Confirmation - Good Vibes",
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h1 style="color: #C5A059; text-transform: uppercase; letter-spacing: 1px;">Good Vibes</h1>
            <h2 style="color: #1A1A1A;">Booking Confirmation</h2>
            <p>Hi ${name},</p>
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
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${time}</td>
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
            <p style="margin-top: 30px; color: #888; font-size: 12px; text-align: center;">
              If you need to cancel or reschedule, please contact us at least 24 hours in advance.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
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
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
