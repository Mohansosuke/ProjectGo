const sendEmail = async ({ email, subject, html }) => {
  // Local development fallback
  if (!process.env.BREVO_API_KEY) {
    console.log("=== EMAIL SERVICE LOG (LOCAL DEVELOPMENT) ===");
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body (HTML length): ${html.length} chars`);
    console.log("=============================================");
    return true;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "ProjectGo",
          email: "mohanrox647@gmail.com", // Your verified sender
        },
        to: [
          {
            email,
          },
        ],
        subject,
        htmlContent: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Brevo API Error:", data);
      return false;
    }

    console.log("✅ Email sent successfully:", data);
    return true;

  } catch (error) {
    console.error("❌ Fetch Error:", error);
    return false;
  }
};

module.exports = sendEmail;