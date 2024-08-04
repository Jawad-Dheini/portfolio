const nodemailer = require("nodemailer");

module.exports = async (req, res) => {
  const { name, email, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: "icloud",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: process.env.EMAIL,
    subject: `Contact from ${name}`,
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
