import { Model } from 'sequelize-typescript';
export declare enum AccountRole {
    GUEST = "Guest",
    STUDENT = "Student",
    TEACHER = "Teacher",
    PRINCIPAL = "Principal",
    SYSADMIN = "SysAdmin"
}
export declare enum AccountStatus {
    PENDING = "Pending",
    ACTIVE = "Active",
    INACTIVE = "Inactive",
    SUSPENDED = "Suspended"
}
export declare enum AccountGender {
    MALE = "Male",
    FEMALE = "Female"
}
export declare class Account extends Model {
    id: string;
    name: string;
    fullName: string;
    badge: string;
    role: AccountRole;
    birthday: Date;
    gender: AccountGender;
    email: string;
    password: string;
    phoneNumber: string;
    parentName: string;
    status: AccountStatus;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    refreshToken?: string;
    refreshTokenExpiresAt?: Date;
    emailVerified: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
