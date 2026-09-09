jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';

describe('EmailService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'adm.mts.alhusna@gmail.com';
    process.env.SMTP_PASSWORD = 'test-app-password';
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  it('should not initialize SMTP transport when credentials are missing', () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;

    const service = new EmailService();

    expect(service['transporter']).toBeNull();
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('should send OTP email when SMTP is configured', async () => {
    const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const service = new EmailService();
    const result = await service.sendOTPEmail('student@example.com', '123456', 'Student');

    expect(result).toBe(true);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'student@example.com',
        subject: expect.stringContaining('Email Verification'),
      }),
    );
  });
});
