import { Model } from 'sequelize-typescript';
export declare enum RegistrationStatus {
    PENDING = "Pending",
    APPROVED = "Approved",
    REJECTED = "Rejected"
}
export declare class RegistrationRequest extends Model {
    id: string;
    name: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    birthday: Date;
    gender: string;
    parentName: string;
    parentPhoneNumber: string;
    reasonForRegistration: string;
    status: RegistrationStatus;
    assignedRole: string;
    assignedBadge: string;
    approvedAt: Date;
    approvedBy: string;
    rejectionReason: string;
    verificationCode: string;
    otpResendCount: number;
    lastOtpSentAt: Date;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
