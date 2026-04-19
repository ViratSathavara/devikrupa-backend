import nodemailer from "nodemailer";
import { logger } from "../utils/logger";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASSWORD,
      SMTP_FROM_EMAIL,
      SMTP_FROM_NAME,
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM_EMAIL) {
      logger.warn("SMTP configuration is incomplete. Email service will not be available.");
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT, 10),
        secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASSWORD,
        },
      });

      logger.info("Email service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize email service", error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      logger.error("Email transporter not initialized");
      return false;
    }

    const { SMTP_FROM_EMAIL, SMTP_FROM_NAME } = process.env;

    try {
      const info = await this.transporter.sendMail({
        from: `"${SMTP_FROM_NAME || "Devikrupa Electricals"}" <${SMTP_FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info("Email sent successfully", { messageId: info.messageId, to: options.to });
      return true;
    } catch (error) {
      logger.error("Failed to send email", { error, to: options.to });
      return false;
    }
  }

  async sendOTPEmail(email: string, otp: string, name: string): Promise<boolean> {
    const subject = "Email Verification - Devikrupa Electricals";
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .otp-box {
            background-color: #fff;
            border: 2px dashed #2563eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #2563eb;
            letter-spacing: 8px;
            margin: 10px 0;
          }
          .content {
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚡ Devikrupa Electricals</div>
            <p>Email Verification</p>
          </div>
          
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Thank you for signing up with Devikrupa Electricals! To complete your registration, please verify your email address using the OTP below:</p>
          </div>
          
          <div class="otp-box">
            <p style="margin: 0; font-size: 14px; color: #666;">Your Verification Code</p>
            <div class="otp-code">${otp}</div>
            <p style="margin: 0; font-size: 12px; color: #999;">Valid for 10 minutes</p>
          </div>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.
          </div>
          
          <div class="content">
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
          
          <div class="footer">
            <p><strong>Devikrupa Electricals</strong></p>
            <p>Station Road, Bharat Nagar, Visnagar, Gujarat 384315</p>
            <p>Phone: +91 94298 19944</p>
            <p>&copy; ${new Date().getFullYear()} Devikrupa Electricals. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hello ${name},

Thank you for signing up with Devikrupa Electricals!

Your email verification OTP is: ${otp}

This OTP is valid for 10 minutes.

If you didn't request this verification, please ignore this email.

Best regards,
Devikrupa Electricals
Station Road, Bharat Nagar, Visnagar, Gujarat 384315
Phone: +91 94298 19944
    `;

    return this.sendEmail({ to: email, subject, html, text });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const subject = "Welcome to Devikrupa Electricals!";
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .content {
            margin: 20px 0;
          }
          .features {
            background-color: #fff;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .feature-item {
            margin: 15px 0;
            padding-left: 25px;
            position: relative;
          }
          .feature-item:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #2563eb;
            font-weight: bold;
          }
          .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: #fff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚡ Devikrupa Electricals</div>
            <h2>Welcome Aboard!</h2>
          </div>
          
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Welcome to Devikrupa Electricals! Your email has been successfully verified and your account is now active.</p>
            <p>We're excited to have you as part of our community. With over 35 years of experience, we're committed to providing you with quality electrical products and expert services.</p>
          </div>
          
          <div class="features">
            <h3 style="margin-top: 0;">What you can do now:</h3>
            <div class="feature-item">Browse our extensive catalog of electrical products</div>
            <div class="feature-item">Save your favorite products for quick access</div>
            <div class="feature-item">Submit product inquiries and get expert guidance</div>
            <div class="feature-item">Request service for electrical repairs</div>
            <div class="feature-item">Chat with our support team for instant help</div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://devikrupaelectricals.in'}/products" class="cta-button">
              Start Browsing Products
            </a>
          </div>
          
          <div class="content">
            <p>If you have any questions or need assistance, feel free to reach out to us anytime.</p>
          </div>
          
          <div class="footer">
            <p><strong>Devikrupa Electricals</strong></p>
            <p>Station Road, Bharat Nagar, Visnagar, Gujarat 384315</p>
            <p>Phone: +91 94298 19944 | Email: info@devikrupaelectricals.in</p>
            <p>Business Hours: Monday - Saturday, 7:30 AM - 7:00 PM</p>
            <p>&copy; ${new Date().getFullYear()} Devikrupa Electricals. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hello ${name},

Welcome to Devikrupa Electricals! Your email has been successfully verified and your account is now active.

We're excited to have you as part of our community. With over 35 years of experience, we're committed to providing you with quality electrical products and expert services.

What you can do now:
- Browse our extensive catalog of electrical products
- Save your favorite products for quick access
- Submit product inquiries and get expert guidance
- Request service for electrical repairs
- Chat with our support team for instant help

Visit us: ${process.env.NEXT_PUBLIC_APP_URL || 'https://devikrupaelectricals.in'}/products

If you have any questions or need assistance, feel free to reach out to us anytime.

Best regards,
Devikrupa Electricals
Station Road, Bharat Nagar, Visnagar, Gujarat 384315
Phone: +91 94298 19944
Business Hours: Monday - Saturday, 7:30 AM - 7:00 PM
    `;

    return this.sendEmail({ to: email, subject, html, text });
  }
}

export const emailService = new EmailService();
