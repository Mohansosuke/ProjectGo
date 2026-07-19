const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_USER === 'your_email@gmail.com') {
    console.log("=== EMAIL SERVICE LOG (LOCAL DEVELOPMENT) ===");
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body (HTML length): ${html.length} chars`);
    console.log("=============================================");
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000, 
  socketTimeout: 30000,
});

    const mailOptions = {
      from: `"ProjectGo" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Nodemailer sendMail Error:", error);
    console.log("=== EMAIL FALLBACK LOG (SMTP FAILED) ===");
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log("========================================");
    return false;
  }
};

module.exports = sendEmail;
