const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Route to serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route to handle the form submission
app.post("/send-email", (req, res) => {
  const { name, email, message } = req.body;

  const transporter = nodemailer.createTransport({
    host: "smtp.mail.me.com",
    port: 587, // Use 465 for SSL
    secure: false, // true for 465, false for 587
    auth: {
      user: "jawad.dheini@icloud.com",
      pass: "qvfu-owsb-xuxn-lbwu",
    },
  });

  const mailOptions = {
    from: "jawad.dheini@icloud.com", // Must be your iCloud email
    replyTo: email, // User's email for reply
    to: "jawad.dheini@icloud.com",
    subject: `Contact form submission from ${name}`,
    text: message,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).send("Error sending email");
    }
    res.status(200).send("Email sent successfully");
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
