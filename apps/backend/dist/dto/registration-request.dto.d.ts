import { AccountRole } from '../models/account.model';
export declare class ApproveRegistrationDto {
    email: string;
    assignedRole?: AccountRole;
    assignedBadge?: string;
    mfaCode?: string;
}
export declare class RejectRegistrationDto {
    email: string;
    rejectionReason: string;
}
export declare class UpdateRegistrationRequestDto {
    name?: string;
    fullName?: string;
    phoneNumber?: string;
    gender?: string;
    parentName?: string;
    parentPhoneNumber?: string;
    reasonForRegistration?: string;
}
