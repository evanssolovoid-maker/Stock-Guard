require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

// Initialize Supabase (with error handling)
let supabase = null;
try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.warn(
      "⚠️  Supabase credentials not set. SMS notifications will not work."
    );
    console.warn(
      "   Set SUPABASE_URL and SUPABASE_SERVICE_KEY in Railway Variables."
    );
  } else {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    console.log("✅ Supabase initialized successfully");
  }
} catch (error) {
  console.error("❌ Failed to initialize Supabase:", error.message);
  console.warn("   Server will start but SMS features will not work.");
}

// Initialize Africa's Talking (if credentials provided)
let africastalking = null;
if (process.env.AT_API_KEY && process.env.AT_USERNAME) {
  try {
    africastalking = require("africastalking")({
      apiKey: process.env.AT_API_KEY,
      username: process.env.AT_USERNAME,
    });
    console.log("✅ Africa's Talking initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Africa's Talking:", error.message);
  }
}

// Initialize Nodemailer (if credentials provided)
let emailTransporter = null;
if (
  process.env.EMAIL_HOST &&
  process.env.EMAIL_PORT &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS
) {
  try {
    emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure:
        process.env.EMAIL_PORT === "465" || process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log("✅ Email transporter initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize email transporter:", error.message);
  }
} else {
  console.warn(
    "⚠️  Email credentials not set. Email notifications will not work."
  );
  console.warn(
    "   Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS in Railway Variables."
  );
}

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    supabase: supabase ? "connected" : "not configured",
    africastalking: africastalking ? "configured" : "not configured",
    email: emailTransporter ? "configured" : "not configured",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "StockGuard Backend API",
    status: "running",
    endpoints: {
      health: "/health",
      notifyOwner: "POST /api/notify-owner",
      testSMS: "POST /api/test-sms",
      testEmail: "POST /api/test-email",
    },
  });
});

// Send sale notification
app.post("/api/notify-owner", async (req, res) => {
  const { saleId } = req.body;

  if (!saleId) {
    return res.status(400).json({ error: "Sale ID is required" });
  }

  if (!supabase) {
    return res.status(503).json({
      error: "Supabase not configured",
      message: "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set",
    });
  }

  try {
    // Fetch sale with multi-item support
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select(
        `
        *,
        items:sales_items(
          *,
          product:products(name, unit_of_measure)
        ),
        worker:user_profiles!sales_worker_id_fkey(id, username, business_name, phone_number),
        owner:user_profiles!sales_owner_id_fkey(id, phone_number, email, sms_notifications, sms_threshold, email_notifications, email_threshold)
      `
      )
      .eq("id", saleId)
      .single();

    if (saleError || !sale) {
      console.error("Sale fetch error:", saleError);
      return res.status(404).json({ error: "Sale not found" });
    }

    const owner = sale.owner;
    if (!owner) {
      return res.status(404).json({ error: "Owner not found" });
    }

    // Check if phone number exists
    if (!owner.phone_number) {
      return res.json({
        success: true,
        skipped: true,
        reason: "Phone number not set for owner",
      });
    }

    // Check if SMS notifications are enabled
    if (!owner.sms_notifications) {
      return res.json({
        success: true,
        skipped: true,
        reason: "SMS notifications disabled",
      });
    }

    // Check threshold (use final_total instead of total_amount)
    const saleAmount = parseFloat(sale.final_total || 0);
    const threshold = parseFloat(owner.sms_threshold || 0);

    if (threshold > 0 && saleAmount < threshold) {
      return res.json({
        success: true,
        skipped: true,
        reason: `Sale amount (UGX ${saleAmount.toLocaleString()}) below threshold (UGX ${threshold.toLocaleString()})`,
      });
    }

    // Format message for multi-item sales
    const items = sale.items || [];
    const workerName =
      sale.worker?.business_name || sale.worker?.username || "Worker";

    let message = "";

    if (items.length === 0) {
      // Fallback if no items found
      message = `New sale: UGX ${saleAmount.toLocaleString()} by ${workerName}. - StockGuard`;
    } else if (items.length === 1) {
      // Single item - simple message
      const item = items[0];
      const productName = item.product?.name || "Product";
      const quantity = item.quantity_sold || 0;
      message = `Sale: ${productName} x${quantity} = UGX ${saleAmount.toLocaleString()} by ${workerName}. - StockGuard`;
    } else {
      // Multiple items - summarize
      const totalItems = items.reduce(
        (sum, item) => sum + (item.quantity_sold || 0),
        0
      );
      if (items.length <= 3) {
        // List all items if 3 or fewer
        const itemList = items
          .map((item) => {
            const qty = item.quantity_sold || 0;
            const name = item.product?.name || "Item";
            return `${name}(${qty})`;
          })
          .join(", ");
        message = `Sale: ${itemList} = UGX ${saleAmount.toLocaleString()} by ${workerName}. - StockGuard`;
      } else {
        // Summarize if more than 3 items
        message = `Sale: ${totalItems} items = UGX ${saleAmount.toLocaleString()} by ${workerName}. - StockGuard`;
      }
    }

    // Send SMS if Africa's Talking is configured
    let smsSent = false;
    if (africastalking && owner.phone_number) {
      try {
        const result = await africastalking.SMS.send({
          to: [owner.phone_number],
          message,
          from: "StockGuard", // Your sender ID (must be approved by Africa's Talking)
        });

        console.log("SMS sent successfully:", result);
        smsSent = true;
      } catch (smsError) {
        console.error("SMS error:", smsError);
      }
    }

    // Send Email if email notifications are enabled
    let emailSent = false;
    if (owner.email_notifications && owner.email && emailTransporter) {
      // Check email threshold
      const emailThreshold = parseFloat(owner.email_threshold || 0);
      if (emailThreshold === 0 || saleAmount >= emailThreshold) {
        try {
          // Format email content
          const items = sale.items || [];
          const workerName =
            sale.worker?.business_name || sale.worker?.username || "Worker";

          let emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">New Sale Notification - StockGuard</h2>
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 10px 0;"><strong>Sale Amount:</strong> UGX ${saleAmount.toLocaleString()}</p>
                <p style="margin: 10px 0;"><strong>Worker:</strong> ${workerName}</p>
                <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(
                  sale.created_at
                ).toLocaleString()}</p>
              </div>
          `;

          if (items.length > 0) {
            emailHtml += `
              <h3 style="color: #374151; margin-top: 30px;">Items Sold:</h3>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="background-color: #e5e7eb;">
                    <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">Product</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">Quantity</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">Price</th>
                  </tr>
                </thead>
                <tbody>
            `;

            items.forEach((item) => {
              const productName = item.product?.name || "Product";
              const quantity = item.quantity_sold || 0;
              const price = parseFloat(item.unit_price || 0).toLocaleString();
              emailHtml += `
                <tr>
                  <td style="padding: 10px; border: 1px solid #d1d5db;">${productName}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">${quantity}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">UGX ${price}</td>
                </tr>
              `;
            });

            emailHtml += `
                </tbody>
              </table>
            `;
          }

          emailHtml += `
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                This is an automated notification from StockGuard.
              </p>
            </div>
          `;

          const emailText = `New Sale: UGX ${saleAmount.toLocaleString()} by ${workerName}\n\n${items
            .map(
              (item) =>
                `${item.product?.name || "Product"} x${item.quantity_sold || 0}`
            )
            .join("\n")}\n\nDate: ${new Date(
            sale.created_at
          ).toLocaleString()}`;

          const emailResult = await emailTransporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: owner.email,
            subject: `New Sale: UGX ${saleAmount.toLocaleString()} - StockGuard`,
            text: emailText,
            html: emailHtml,
          });

          console.log("Email sent successfully:", emailResult.messageId);
          emailSent = true;
        } catch (emailError) {
          console.error("Email error:", emailError);
        }
      }
    }

    // Return response
    return res.json({
      success: true,
      sms: smsSent
        ? { sent: true }
        : { sent: false, reason: "SMS service not configured or disabled" },
      email: emailSent
        ? { sent: true }
        : { sent: false, reason: "Email service not configured or disabled" },
      message,
    });
  } catch (error) {
    console.error("Notification error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Test Email endpoint
app.post("/api/test-email", async (req, res) => {
  const { ownerId } = req.body;

  if (!ownerId) {
    return res.status(400).json({ error: "Owner ID is required" });
  }

  if (!supabase) {
    return res.status(503).json({
      error: "Supabase not configured",
      message: "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set",
    });
  }

  try {
    const { data: owner, error } = await supabase
      .from("user_profiles")
      .select("email, email_notifications, email_threshold")
      .eq("id", ownerId)
      .single();

    if (error || !owner) {
      console.error("Owner fetch error:", error);
      return res.status(404).json({ error: "Owner not found" });
    }

    if (!owner.email) {
      return res.json({
        success: false,
        skipped: true,
        reason: "Email address not set in your profile",
        error:
          "Please add your email address in Settings to receive email notifications",
      });
    }

    // Check if email notifications are enabled
    if (!owner.email_notifications) {
      return res.json({
        success: false,
        skipped: true,
        reason: "Email notifications are disabled",
        error: "Please enable email notifications in Settings first",
      });
    }

    if (!emailTransporter) {
      return res.json({
        success: true,
        skipped: true,
        reason: "Email service not configured",
        message: "Email service is not configured on the server",
      });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Test Email from StockGuard</h2>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>This is a test email to verify that your email notifications are working correctly.</p>
          <p>If you received this email, your email notification settings are properly configured!</p>
        </div>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated test notification from StockGuard.
        </p>
      </div>
    `;

    const emailText = `Test Email from StockGuard\n\nThis is a test email to verify that your email notifications are working correctly.\n\nIf you received this email, your email notification settings are properly configured!`;

    try {
      const result = await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: owner.email,
        subject: "Test Email - StockGuard",
        text: emailText,
        html: emailHtml,
      });

      console.log("Test email sent successfully:", result.messageId);
      return res.json({
        success: true,
        messageId: result.messageId,
        message: "Test email sent successfully!",
      });
    } catch (emailError) {
      console.error("Test email sending error:", emailError);
      return res.status(500).json({
        success: false,
        error: "Failed to send test email",
        details: emailError.message,
      });
    }
  } catch (error) {
    console.error("Test email error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Test SMS endpoint
app.post("/api/test-sms", async (req, res) => {
  const { ownerId } = req.body;

  if (!ownerId) {
    return res.status(400).json({ error: "Owner ID is required" });
  }

  if (!supabase) {
    return res.status(503).json({
      error: "Supabase not configured",
      message: "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set",
    });
  }

  try {
    const { data: owner, error } = await supabase
      .from("user_profiles")
      .select("phone_number, sms_notifications, sms_threshold")
      .eq("id", ownerId)
      .single();

    if (error || !owner) {
      console.error("Owner fetch error:", error);
      return res.status(404).json({ error: "Owner not found" });
    }

    if (!owner.phone_number) {
      return res.json({
        success: false,
        skipped: true,
        reason: "Phone number not set in your profile",
        error:
          "Please add your phone number in Settings to receive SMS notifications",
      });
    }

    // Check if SMS notifications are enabled
    if (!owner.sms_notifications) {
      return res.json({
        success: false,
        skipped: true,
        reason: "SMS notifications are disabled",
        error: "Please enable SMS notifications in Settings first",
      });
    }

    const message =
      "Test SMS from StockGuard. Your SMS notifications are working!";

    if (africastalking) {
      try {
        const result = await africastalking.SMS.send({
          to: [owner.phone_number],
          message,
          from: "StockGuard",
        });

        console.log("Test SMS sent successfully:", result);
        return res.json({
          success: true,
          messageId: result.SMSMessageData?.Recipients?.[0]?.messageId,
          message: "Test SMS sent successfully!",
        });
      } catch (smsError) {
        console.error("Test SMS sending error:", smsError);
        return res.status(500).json({
          success: false,
          error: "Failed to send test SMS",
          details: smsError.message,
        });
      }
    } else {
      return res.json({
        success: true,
        skipped: true,
        reason: "SMS service not configured",
        message:
          "SMS service (Africa's Talking) is not configured on the server",
      });
    }
  } catch (error) {
    console.error("Test SMS error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Railway sets PORT automatically - parse and validate it
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Validate PORT is a valid number between 0-65535 (Railway requirement)
if (isNaN(PORT) || PORT < 0 || PORT > 65535) {
  console.error("❌ Invalid PORT value:", process.env.PORT);
  console.error("   PORT must be a number between 0 and 65535");
  process.exit(1);
}

console.log(`🚀 Starting server on port ${PORT}...`);

// Start server with comprehensive error handling
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Root: http://localhost:${PORT}/`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `✅ Supabase: ${
      supabase ? "Connected" : "Not configured (check variables)"
    }`
  );
  console.log(
    `✅ Africa's Talking: ${
      africastalking ? "Configured" : "Not configured (optional)"
    }`
  );
  console.log(
    `✅ Email Service: ${
      emailTransporter ? "Configured" : "Not configured (optional)"
    }`
  );
  console.log(`✅ Server started successfully!`);
});

// Handle server errors
server.on("error", (error) => {
  console.error("❌ Server error:", error);
  if (error.code === "EADDRINUSE") {
    console.error(`   Port ${PORT} is already in use`);
  } else if (error.code === "EACCES") {
    console.error(`   Permission denied to use port ${PORT}`);
  } else {
    console.error(`   Error code: ${error.code}`);
    console.error(`   Error message: ${error.message}`);
  }
  process.exit(1);
});

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  console.error("   Stack:", error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise);
  console.error("   Reason:", reason);
  if (reason instanceof Error) {
    console.error("   Stack:", reason.stack);
  }
  process.exit(1);
});
