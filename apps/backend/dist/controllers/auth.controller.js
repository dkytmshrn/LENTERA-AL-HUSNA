"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../services/auth.service");
const account_dto_1 = require("../dto/account.dto");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    setAuthCookies(res, accessToken, refreshToken) {
        const isProduction = process.env.NODE_ENV === 'production';
        const accessTokenName = isProduction ? '__Host-access_token' : 'access_token';
        const refreshTokenName = isProduction ? '__Host-refresh_token' : 'refresh_token';
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            priority: 'high',
        };
        res.cookie(accessTokenName, accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
        });
        res.cookie(refreshTokenName, refreshToken, {
            ...cookieOptions,
            maxAge: 10 * 60 * 60 * 1000,
        });
    }
    async register(registerDto) {
        return this.authService.registerUser(registerDto);
    }
    async verifyEmail(verifyEmailDto) {
        return this.authService.verifyEmailOTP(verifyEmailDto.email, verifyEmailDto.verificationCode, verifyEmailDto.registrationRequestId);
    }
    async resendVerificationEmail(email) {
        return this.authService.resendVerificationEmail(email);
    }
    async login(loginDto, res) {
        const result = await this.authService.login(loginDto);
        if (result.accessToken && result.refreshToken) {
            this.setAuthCookies(res, result.accessToken, result.refreshToken);
        }
        return result;
    }
    async changePassword(req, updatePasswordDto) {
        const accountId = req.headers['x-account-id'];
        if (!accountId) {
            throw new common_1.BadRequestException('Account ID is required');
        }
        return this.authService.changeTemporaryPassword(accountId, updatePasswordDto);
    }
    async forgotPassword(forgotPasswordDto) {
        return this.authService.requestPasswordReset(forgotPasswordDto.email);
    }
    async resetPassword(resetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }
    async updateCurrentUserProfile(req, updateProfileDto) {
        const accountId = req.headers['x-account-id'];
        if (!accountId) {
            throw new common_1.BadRequestException('Account ID is required');
        }
        return this.authService.updateCurrentUserProfile(String(accountId), updateProfileDto);
    }
    async requestAccountDeactivationOTP(req) {
        const accountId = req.headers['x-account-id'];
        if (!accountId) {
            throw new common_1.BadRequestException('Account ID is required');
        }
        return this.authService.requestAccountDeactivationOTP(String(accountId));
    }
    async confirmAccountDeactivation(req, dto) {
        const accountId = req.headers['x-account-id'];
        if (!accountId) {
            throw new common_1.BadRequestException('Account ID is required');
        }
        return this.authService.confirmAccountDeactivation(String(accountId), dto.otp);
    }
    async refreshToken(req, res, refreshToken) {
        const cookieHeader = typeof req?.headers?.cookie === 'string' ? req.headers.cookie : '';
        const rawCookieMap = new Map();
        for (const pair of cookieHeader.split(';')) {
            const [name, ...rest] = pair.split('=');
            if (!name)
                continue;
            const key = name.trim();
            const value = rest.join('=').trim();
            if (key && value) {
                rawCookieMap.set(key, value);
            }
        }
        const refreshTokenFromCookie = req.cookies?.['__Host-refresh_token'] ??
            req.cookies?.['refresh_token'] ??
            rawCookieMap.get('__Host-refresh_token') ??
            rawCookieMap.get('refresh_token');
        const refreshTokenFromBody = typeof refreshToken === 'string' ? refreshToken.trim() : '';
        const normalizedRefreshToken = refreshTokenFromCookie || refreshTokenFromBody;
        try {
            if (!normalizedRefreshToken) {
                throw new common_1.BadRequestException('Refresh token is required');
            }
            if (normalizedRefreshToken.length < 64) {
                throw new common_1.UnauthorizedException('Refresh token is invalid or malformed');
            }
            const result = await this.authService.refreshAccessToken(normalizedRefreshToken);
            if (result.accessToken && result.refreshToken) {
                this.setAuthCookies(res, result.accessToken, result.refreshToken);
            }
            return result;
        }
        catch (error) {
            await this.authService.clearRefreshSession(normalizedRefreshToken);
            this.clearAuthCookies(res);
            throw error;
        }
    }
    async logout(req, res) {
        const cookieHeader = typeof req?.headers?.cookie === 'string' ? req.headers.cookie : '';
        const refreshToken = req.cookies?.['__Host-refresh_token']
            ?? req.cookies?.['refresh_token']
            ?? cookieHeader.split(';')
                .map((part) => part.trim())
                .find((part) => part.startsWith('__Host-refresh_token=') || part.startsWith('refresh_token='))
                ?.split('=').slice(1).join('=');
        await this.authService.clearRefreshSession(refreshToken);
        this.clearAuthCookies(res);
        return { message: 'Logged out successfully' };
    }
    clearAuthCookies(res) {
        const baseOptions = { path: '/', httpOnly: true, sameSite: 'lax' };
        for (const secure of [false, true]) {
            const cookieOptions = { ...baseOptions, secure };
            res.clearCookie('__Host-access_token', cookieOptions);
            res.clearCookie('access_token', cookieOptions);
            res.clearCookie('__Host-refresh_token', cookieOptions);
            res.clearCookie('refresh_token', cookieOptions);
        }
    }
    async health() {
        return { status: 'OK', message: 'Auth service is running' };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [account_dto_1.RegisterAccountDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [account_dto_1.VerifyEmailDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('resend-verification-email'),
    __param(0, (0, common_1.Body)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerificationEmail", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [account_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('change-password'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, account_dto_1.UpdatePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [account_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [account_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Patch)('me/profile'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, account_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateCurrentUserProfile", null);
__decorate([
    (0, common_1.Post)('me/deactivation/request-otp'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestAccountDeactivationOTP", null);
__decorate([
    (0, common_1.Post)('me/deactivation/confirm'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, account_dto_1.DeactivateAccountDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "confirmAccountDeactivation", null);
__decorate([
    (0, common_1.Post)('refresh-token'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, common_1.Body)('refreshToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "health", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('api/auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map