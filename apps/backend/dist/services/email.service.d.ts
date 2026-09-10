export declare class EmailService {
    private transporter;
    private readonly fromAddress;
    private readonly fromName;
    constructor();
    private getMailFrom;
    private sendMailWithFallback;
    sendOTPEmail(email: string, otp: string, name: string): Promise<boolean>;
    sendAdminApprovalOTPEmail(email: string, otp: string, name: string): Promise<boolean>;
    sendTemporaryPasswordEmail(email: string, temporaryPassword: string, name: string): Promise<boolean>;
    sendPasswordResetOTPEmail(email: string, resetCode: string, name: string): Promise<boolean>;
    sendAccountDeactivationOTPEmail(email: string, otp: string, name: string): Promise<boolean>;
    sendRegistrationRejectionEmail(email: string, name: string, reason: string): Promise<boolean>;
}
