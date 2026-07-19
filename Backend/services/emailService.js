const fs = require('fs');
const path = require('path');
const sendEmail = require('../utils/sendEmail');

const getHtmlTemplate = (templateName, replacements) => {
  const filePath = path.join(__dirname, '../templates', templateName);
  let html = '';
  try {
    html = fs.readFileSync(filePath, 'utf-8');
    Object.keys(replacements).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, replacements[key]);
    });
  } catch (error) {
    console.error(`Error loading HTML template ${templateName}:`, error);
    html = Object.keys(replacements).reduce((acc, key) => acc + ` ${key}: ${replacements[key]}`, `Template ${templateName}`);
  }
  return html;
};

const sendVerificationEmail = async (email, token, name) => {
  const verifyUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/verify/${token}`;
  const html = getHtmlTemplate('verifyEmail.html', { name, verifyUrl });
  return await sendEmail({
    email,
    subject: "Verify Your Email - ProjectGo",
    html
  });
};

const sendResetPasswordEmail = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/forgot-password?resetToken=${token}`;
  const html = getHtmlTemplate('resetPassword.html', { resetUrl });
  return await sendEmail({
    email,
    subject: "Reset Your Password - ProjectGo",
    html
  });
};

const sendWorkspaceInvitationEmail = async (email, token, workspaceName, inviterName) => {
  const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
  const inviteUrl = `${serverUrl}/api/invitations/accept/${token}`;
  const html = getHtmlTemplate('inviteWorkspace.html', { inviterName, workspaceName, inviteUrl });
  return await sendEmail({
    email,
    subject: `Invitation to join workspace "${workspaceName}" - ProjectGo`,
    html
  });
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendWorkspaceInvitationEmail
};
