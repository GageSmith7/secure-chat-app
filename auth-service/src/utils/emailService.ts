import nodemailer from 'nodemailer';
import { logger } from '../config/logger';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Test email configuration
  static async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connected successfully');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }

  // Send verification email
  static async sendVerificationEmail(to: string, username: string, token: string): Promise<boolean> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to,
        subject: 'Verify Your Email - Secure Chat App',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Welcome to Secure Chat App!</h1>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p>Hi <strong>${username}</strong>,</p>
              
              <p>Thank you for signing up! Please click the button below to verify your email address:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: #007bff; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
                This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
            
            <p style="text-align: center; color: #666; font-size: 12px;">
              © 2024 Secure Chat App. All rights reserved.
            </p>
          </div>
        `,
        text: `
          Welcome to Secure Chat App!
          
          Hi ${username},
          
          Please verify your email address by visiting: ${verificationUrl}
          
          This link will expire in 24 hours.
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to ${to}`);
      return true;
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      return false;
    }
  }

  // Send password reset email
  static async sendPasswordResetEmail(to: string, username: string, token: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to,
        subject: 'Reset Your Password - Secure Chat App',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Password Reset Request</h1>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p>Hi <strong>${username}</strong>,</p>
              
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: #dc3545; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
                This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.
              </p>
            </div>
            
            <p style="text-align: center; color: #666; font-size: 12px;">
              © 2024 Secure Chat App. All rights reserved.
            </p>
          </div>
        `,
        text: `
          Password Reset Request
          
          Hi ${username},
          
          Reset your password by visiting: ${resetUrl}
          
          This link will expire in 1 hour.
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${to}`);
      return true;
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      return false;
    }
  }

  // Send welcome email (after verification)
  static async sendWelcomeEmail(to: string, username: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to,
        subject: 'Welcome to Secure Chat App!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #28a745; text-align: center;">🎉 Welcome to Secure Chat App!</h1>
            
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <p>Hi <strong>${username}</strong>,</p>
              
              <p>Your email has been verified successfully! You can now:</p>
              
              <ul style="margin: 20px 0;">
                <li>Send and receive real-time messages</li>
                <li>Add friends and create group chats</li>
                <li>Share files and images securely</li>
                <li>Customize your profile</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/login" 
                   style="background: #28a745; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  Start Chatting Now
                </a>
              </div>
              
              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            
            <p style="text-align: center; color: #666; font-size: 12px;">
              © 2024 Secure Chat App. All rights reserved.
            </p>
          </div>
        `,
        text: `
          Welcome to Secure Chat App!
          
          Hi ${username},
          
          Your email has been verified! Start chatting at: ${process.env.FRONTEND_URL}/login
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${to}`);
      return true;
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      return false;
    }
  }
}