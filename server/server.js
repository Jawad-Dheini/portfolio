const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function verifyTurnstile(token, remoteip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { success: false, reason: "not-configured" };
  }
  if (!token) {
    return { success: false, reason: "missing-token" };
  }

  const params = new URLSearchParams();
  params.append("secret", secret);
  params.append("response", token);
  if (remoteip) params.append("remoteip", remoteip);

  const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    body: params,
  });
  const data = await verifyRes.json();
  return { success: !!data.success, errorCodes: data["error-codes"] || [] };
}

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "..", "public")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Route to serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// Route to handle the form submission
app.post("/send-email", async (req, res) => {
  const { name, email, message, turnstileToken, company } = req.body;

  // Honeypot: real visitors never fill this hidden field. Pretend success
  // so bots don't learn to leave it blank, but never send the email.
  if (company) {
    return res.status(200).json({ status: "success", message: "Message sent" });
  }

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ status: "error", message: "Missing required fields." });
  }

  const verification = await verifyTurnstile(turnstileToken, req.ip);
  if (!verification.success) {
    return res.status(400).json({
      status: "error",
      message: "Verification failed. Please retry the challenge.",
    });
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.mail.me.com",
    port: 587, // Use 465 for SSL
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER, // Must be your iCloud email
    replyTo: email, // User's email for reply
    to: process.env.EMAIL_USER,
    subject: `Contact form submission from ${name}`,
    text: message,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ status: "error", message: "Error sending email" });
    }
    res.status(200).json({ status: "success", message: "Email sent successfully" });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
