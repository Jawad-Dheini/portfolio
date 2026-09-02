const nodemailer = require("nodemailer");

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

module.exports = async (req, res) => {
  const { name, email, message, turnstileToken, company } = req.body || {};

  // Honeypot: real visitors never fill this hidden field. Pretend success
  // so bots don't learn to leave it blank, but never send the email.
  if (company) {
    return res
      .status(200)
      .json({ status: "success", message: "Message sent" });
  }

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ status: "error", message: "Missing required fields." });
  }

  const remoteip = req.headers["x-forwarded-for"];
  const verification = await verifyTurnstile(turnstileToken, remoteip);
  if (!verification.success) {
    return res.status(400).json({
      status: "error",
      message: "Verification failed. Please retry the challenge.",
    });
  }

  const transporter = nodemailer.createTransport({
    service: "icloud",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    replyTo: email,
    to: process.env.EMAIL_USER,
    subject: `Contact form submission from ${name}`,
    text: `You have a new message from ${name} (${email}):\n\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json({ status: "success", message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
