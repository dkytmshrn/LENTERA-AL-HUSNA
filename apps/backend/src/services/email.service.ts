import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null;
  private readonly fromAddress: string;
  private readonly fromName: string;

  constructor() {
    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPassword = process.env.SMTP_PASSWORD?.trim();
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;

    this.fromName = process.env.SMTP_FROM_NAME?.trim() || 'LENTERA';
    this.fromAddress = process.env.SMTP_FROM?.trim() || smtpUser || 'noreply@localhost';

    if (!smtpHost || !smtpUser || !smtpPassword) {
      this.transporter = null;
      console.warn('SMTP is not configured. Email sending is disabled until SMTP_HOST, SMTP_USER, and SMTP_PASSWORD are set.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number.isNaN(smtpPort) ? 587 : smtpPort,
      secure: smtpPort === 465,
      requireTLS: true,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  private getMailFrom(): string {
    return `${this.fromName} <${this.fromAddress}>`;
  }

  private async sendMailWithFallback(
    email: string,
    subject: string,
    html: string,
    context: string,
  ): Promise<boolean> {
    if (!this.transporter) {
      console.warn(`SMTP is disabled. Skipping ${context} email for ${email}.`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.getMailFrom(),
        to: email,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error(`Failed to send ${context} email to ${email}:`, error);
      return false;
    }
  }

  async sendOTPEmail(email: string, otp: string, name: string): Promise<boolean> {
    return this.sendMailWithFallback(
      email,
      'Email Verification - LENTERA E-School',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333;">Welcome to LENTERA, ${name}!</h2>
            <p style="color: #666; font-size: 16px;">
              Thank you for registering with LENTERA. To complete your email verification, please use the following OTP:
            </p>
            <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 5px;">${otp}</p>
            </div>
            <p style="color: #666; font-size: 14px;">
              This OTP is valid for 10 minutes. Do not share this code with anyone.
            </p>
            <p style="color: #999; font-size: 12px;">
              If you did not request this verification, please ignore this email.
            </p>
          </div>
        </div>
      `,
      'OTP',
    );
  }

  async sendAdminApprovalOTPEmail(email: string, otp: string, name: string): Promise<boolean> {
    return this.sendMailWithFallback(
      email,
      'TU Badge Approval OTP - LENTERA E-School',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px;">
            <h2 style="color: #9a3412;">TU badge approval confirmation</h2>
            <p style="color: #444; font-size: 16px;">Hello ${name}, use this OTP to approve the TU badge assignment:</p>
            <div style="background-color: #ea580c; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 5px;">${otp}</p>
            </div>
            <p style="color: #666; font-size: 14px;">This OTP expires in 10 minutes.</p>
          </div>
        </div>
      `,
      'TU badge approval',
    );
  }

  async sendTemporaryPasswordEmail(
    email: string,
    temporaryPassword: string,
    name: string,
  ): Promise<boolean> {
    return this.sendMailWithFallback(
      email,
      'Your Temporary Password - LENTERA E-School',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333;">Registration Approved!</h2>
            <p style="color: #666; font-size: 16px;">
              Dear ${name},
            </p>
            <p style="color: #666; font-size: 16px;">
              Your registration request has been approved by the administrator. Your account is now ready to use.
              Please log in using the temporary password below:
            </p>
            <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="font-size: 24px; font-weight: bold; margin: 0; word-break: break-all;">${temporaryPassword}</p>
            </div>
            <p style="color: #ff6b6b; font-size: 14px;">
              <strong>Important:</strong> On your first login, you will be required to change this temporary password to a new one that only you know.
            </p>
            <p style="color: #666; font-size: 14px;">
              <strong>Password Requirements:</strong>
            </p>
            <ul style="color: #666; font-size: 14px;">
              <li>Minimum 8 characters</li>
              <li>At least one uppercase letter (A-Z)</li>
              <li>At least one lowercase letter (a-z)</li>
              <li>At least one number (0-9)</li>
              <li>At least one special character (@$!%*?&)</li>
            </ul>
            <p style="color: #999; font-size: 12px;">
              If you did not register for this account, please contact the administrator.
            </p>
          </div>
        </div>
      `,
      'temporary password',
    );
  }

  async sendPasswordResetOTPEmail(
    email: string,
    resetCode: string,
    name: string,
  ): Promise<boolean> {
    return this.sendMailWithFallback(
      email,
      'Password Reset Code - LENTERA E-School',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="color: #666; font-size: 16px;">Dear ${name},</p>
            <p style="color: #666; font-size: 16px;">
              We received a request to reset your password. Use the code below to continue with the reset process.
            </p>
            <div style="background-color: #0ea5e9; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 5px;">${resetCode}</p>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code is valid for 15 minutes. If you did not request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
      'password reset',
    );
  }

  async sendAccountDeactivationOTPEmail(
    email: string,
    otp: string,
    name: string,
  ): Promise<boolean> {
    return this.sendMailWithFallback(
      email,
      'Account Deactivation Confirmation - LENTERA E-School',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333;">Account Deactivation Request</h2>
            <p style="color: #666; font-size: 16px;">Dear ${name},</p>
            <p style="color: #666; font-size: 16px;">
              We received a request to deactivate your account. To confirm this action, please use the OTP below.
            </p>
            <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 5px;">${otp}</p>
            </div>
            <p style="color: #666; font-size: 14px;">
              This confirmation is valid for 10 minutes. If you did not request deactivation, please ignore this email and contact support immediately.
            </p>
          </div>
        </div>
      `,
      'account deactivation',
    );
  }

  async sendRegistrationRejectionEmail(
    email: string,
    name: string,
    reason: string,
  ): Promise<boolean> {
    return this.sendMailWithFallback(
      email,
      'Registration Status - LENTERA E-School',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333;">Registration Update</h2>
            <p style="color: #666; font-size: 16px;">
              Dear ${name},
            </p>
            <p style="color: #666; font-size: 16px;">
              Thank you for your registration request. Unfortunately, your registration has been reviewed and the following reason was provided:
            </p>
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="color: #333; margin: 0;">${reason}</p>
            </div>
            <p style="color: #666; font-size: 14px;">
              If you believe this is an error or would like to reapply, please contact the administrator.
            </p>
            <p style="color: #999; font-size: 12px;">
              Best regards,<br/>
              LENTERA Administration Team
            </p>
          </div>
        </div>
      `,
      'registration rejection',
    );
  }
}
