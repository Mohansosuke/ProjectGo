const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, html }) => {
  // Local development fallback
  if (
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS ||
    process.env.EMAIL_USER === 'your_email@gmail.com'
  ) {
    console.log("=== EMAIL SERVICE LOG (LOCAL DEVELOPMENT) ===");
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body (HTML length): ${html.length} chars`);
    console.log("=============================================");
    return true;
  }

  try {
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Test SMTP connection
    await transporter.verify();
    console.log("✅ SMTP Connected Successfully");

    await transporter.sendMail({
      from: `"ProjectGo" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log(`✅ Email sent successfully to ${email}`);
    return true;

  } catch (error) {
    console.error("❌ Nodemailer Error");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Command:", error.command);

    return false;
  }
};

module.exports = sendEmail;