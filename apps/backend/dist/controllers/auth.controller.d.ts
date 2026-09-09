import type { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterAccountDto, LoginDto, UpdatePasswordDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, UpdateProfileDto, DeactivateAccountDto } from '../dto/account.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    private setAuthCookies;
    register(registerDto: RegisterAccountDto): Promise<any>;
    verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<any>;
    resendVerificationEmail(email: string): Promise<any>;
    login(loginDto: LoginDto, res: Response): Promise<any>;
    changePassword(req: any, updatePasswordDto: UpdatePasswordDto): Promise<any>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<any>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<any>;
    updateCurrentUserProfile(req: any, updateProfileDto: UpdateProfileDto): Promise<any>;
    requestAccountDeactivationOTP(req: any): Promise<any>;
    confirmAccountDeactivation(req: any, dto: DeactivateAccountDto): Promise<any>;
    refreshToken(req: any, res: Response, refreshToken?: string): Promise<any>;
    logout(req: any, res: Response): Promise<{
        message: string;
    }>;
    private clearAuthCookies;
    health(): Promise<{
        status: string;
        message: string;
    }>;
}
