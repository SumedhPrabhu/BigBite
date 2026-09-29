import nodemailer from "nodemailer";

/**
 * Creates and returns a Nodemailer transporter based on environment configuration.
 * Supports standard SMTP (Mailtrap, Brevo, Sendgrid, AWS SES) and direct services (Gmail).
 */
const createTransporter = () => {
  // If service like 'gmail' is specified
  if (process.env.SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: {
        user:
          process.env.SMTP_USER ||
          process.env.SMTP_EMAIL ||
          process.env.EMAIL_USERNAME,
        pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Standard SMTP configuration
  return nodemailer.createTransport({
    host:
      process.env.SMTP_HOST ||
      process.env.EMAIL_HOST ||
      "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587),
    secure: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) === 465,
    auth: {
      user:
        process.env.SMTP_USER ||
        process.env.SMTP_EMAIL ||
        process.env.EMAIL_USERNAME,
      pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Direct sendEmail helper function
 */
export const sendEmail = async (options) => {
  const transporter = createTransporter();

  const fromName = process.env.SMTP_FROM_NAME || "Snackr Food Delivery";
  const fromEmail =
    process.env.SMTP_FROM_EMAIL ||
    process.env.SMTP_USER ||
    process.env.SMTP_EMAIL ||
    process.env.EMAIL_FROM ||
    "noreply@snackr.com";

  const message = {
    from: `${fromName} <${fromEmail}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message,
  };

  return await transporter.sendMail(message);
};

/**
 * Class-based Email handler for templated emails (Password Reset, Welcome, etc.)
 */
export class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name ? user.name.split(" ")[0] : "Foodie";
    this.url = url;
    this.from = `${process.env.SMTP_FROM_NAME || "Snackr"} <${
      process.env.SMTP_FROM_EMAIL ||
      process.env.SMTP_USER ||
      process.env.SMTP_EMAIL ||
      "noreply@snackr.com"
    }>`;
  }

  async send(subject, htmlContent, textContent) {
    const transporter = createTransporter();

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html: htmlContent,
      text: textContent,
    };

    return await transporter.sendMail(mailOptions);
  }

  async sendPasswordReset() {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #059669; margin: 0; font-size: 28px; font-weight: 800;">Snackr</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Password Reset Request</p>
        </div>
        <p style="font-size: 16px; color: #111827;">Hi <strong>${this.firstName}</strong>,</p>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
          You requested to reset your password for your Snackr account. Click the button below to set a new password. This link is valid for <strong>10 minutes</strong> only.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${this.url}" style="background-color: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">Reset My Password</a>
        </div>
        <p style="font-size: 12px; color: #9ca3af; line-height: 1.5;">
          If you did not request a password reset, please safely ignore this email. Your password will remain unchanged.
        </p>
        <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          © ${new Date().getFullYear()} Snackr Inc. All rights reserved.
        </p>
      </div>
    `;

    const text = `Hi ${this.firstName},\n\nYou requested to reset your Snackr password. Use the following link to reset it (valid for 10 minutes):\n\n${this.url}\n\nIf you did not request this, please ignore this email.`;

    await this.send("Snackr - Password Reset Request", html, text);
  }

  async sendWelcome() {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 16px; background-color: #ffffff;">
        <h1 style="color: #059669; text-align: center;">Welcome to Snackr! 🍔</h1>
        <p style="font-size: 16px; color: #111827;">Hi <strong>${this.firstName}</strong>,</p>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
          We're thrilled to have you join Snackr! Discover top restaurants, order your favorite meals, and enjoy personalized food recommendations.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${this.url || process.env.FRONTEND_URL}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">Start Ordering</a>
        </div>
      </div>
    `;

    const text = `Welcome to Snackr, ${this.firstName}!\n\nDiscover great food and order from your favorite restaurants now: ${process.env.FRONTEND_URL}`;

    await this.send("Welcome to Snackr! 🎉", html, text);
  }
}

export default Email;
