"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
let EmailService = class EmailService {
    transporter;
    fromAddress;
    fromName;
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
    getMailFrom() {
        return `${this.fromName} <${this.fromAddress}>`;
    }
    async sendMailWithFallback(email, subject, html, context) {
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
        }
        catch (error) {
            console.error(`Failed to send ${context} email to ${email}:`, error);
            return false;
        }
    }
    async sendOTPEmail(email, otp, name) {
        return this.sendMailWithFallback(email, 'Email Verification - LENTERA E-School', `
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
      `, 'OTP');
    }
    async sendTemporaryPasswordEmail(email, temporaryPassword, name) {
        return this.sendMailWithFallback(email, 'Your Temporary Password - LENTERA E-School', `
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
      `, 'temporary password');
    }
    async sendPasswordResetOTPEmail(email, resetCode, name) {
        return this.sendMailWithFallback(email, 'Password Reset Code - LENTERA E-School', `
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
      `, 'password reset');
    }
    async sendAccountDeactivationOTPEmail(email, otp, name) {
        return this.sendMailWithFallback(email, 'Account Deactivation Confirmation - LENTERA E-School', `
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
      `, 'account deactivation');
    }
    async sendRegistrationRejectionEmail(email, name, reason) {
        return this.sendMailWithFallback(email, 'Registration Status - LENTERA E-School', `
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
      `, 'registration rejection');
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map