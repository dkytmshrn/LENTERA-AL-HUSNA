export declare class RegisterAccountDto {
    name: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    birthday?: string;
    gender?: string;
    parentName?: string;
    parentPhoneNumber?: string;
    reasonForRegistration?: string;
}
export declare class VerifyEmailDto {
    email: string;
    verificationCode: string;
    registrationRequestId?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class UpdatePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    email: string;
    resetCode: string;
    newPassword: string;
    confirmPassword: string;
}
export declare class UpdateProfileDto {
    name?: string;
    fullName?: string;
    phoneNumber?: string;
}
export declare class DeactivateAccountDto {
    otp: string;
}
export declare class CreateTemporaryPasswordDto {
    email: string;
}
