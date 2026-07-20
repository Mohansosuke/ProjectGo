const brevo = require('@getbrevo/brevo');

const sendEmail = async ({ email, subject, html }) => {
  try {
    const apiInstance = new brevo.TransactionalEmailsApi();

    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    await apiInstance.sendTransacEmail({
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
    });

    console.log(`✅ Email sent successfully to ${email}`);
    return true;

  } catch (error) {
    console.error("❌ Brevo API Error");
    console.error(error.response?.body || error.message || error);
    return false;
  }
};

module.exports = sendEmail;