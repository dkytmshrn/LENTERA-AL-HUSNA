import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Put,
  Patch,
  Param,
  BadRequestException,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '../services/auth.service';
import {
  RegisterAccountDto,
  LoginDto,
  UpdatePasswordDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
  DeactivateAccountDto,
} from '../dto/account.dto';
import {
  ApproveRegistrationDto,
  RejectRegistrationDto,
} from '../dto/registration-request.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    // In production: use __Host- prefix (requires Secure flag)
    // In development: use regular cookie names without Secure flag for localhost
    const isProduction = process.env.NODE_ENV === 'production';
    const accessTokenName = isProduction ? '__Host-access_token' : 'access_token';
    const refreshTokenName = isProduction ? '__Host-refresh_token' : 'refresh_token';

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      priority: 'high' as const,
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

  // Registration - Step 1: User submits registration data
  @Post('register')
  async register(@Body() registerDto: RegisterAccountDto) {
    return this.authService.registerUser(registerDto);
  }

  // Registration - Step 1b: User verifies email with OTP
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmailOTP(
      verifyEmailDto.email,
      verifyEmailDto.verificationCode,
      verifyEmailDto.registrationRequestId,
    );
  }

  @Post('resend-verification-email')
  async resendVerificationEmail(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  // Login
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    if (result.accessToken && result.refreshToken) {
      this.setAuthCookies(res, result.accessToken, result.refreshToken);
    }

    return result;
  }

  // Change temporary password on first login
  @Post('change-password')
  async changePassword(
    @Req() req: any,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    // In a real application, this should be protected by JWT guard
    const accountId = req.headers['x-account-id'];
    if (!accountId) {
      throw new BadRequestException('Account ID is required');
    }
    return this.authService.changeTemporaryPassword(accountId, updatePasswordDto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(forgotPasswordDto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Patch('me/profile')
  async updateCurrentUserProfile(
    @Req() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const accountId = req.headers['x-account-id'];
    if (!accountId) {
      throw new BadRequestException('Account ID is required');
    }

    return this.authService.updateCurrentUserProfile(String(accountId), updateProfileDto);
  }

  @Post('me/deactivation/request-otp')
  async requestAccountDeactivationOTP(@Req() req: any) {
    const accountId = req.headers['x-account-id'];
    if (!accountId) {
      throw new BadRequestException('Account ID is required');
    }

    return this.authService.requestAccountDeactivationOTP(String(accountId));
  }

  @Post('me/deactivation/confirm')
  async confirmAccountDeactivation(
    @Req() req: any,
    @Body() dto: DeactivateAccountDto,
  ) {
    const accountId = req.headers['x-account-id'];
    if (!accountId) {
      throw new BadRequestException('Account ID is required');
    }

    return this.authService.confirmAccountDeactivation(String(accountId), dto.otp);
  }

  // Refresh access token
  @Post('refresh-token')
  async refreshToken(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Body('refreshToken') refreshToken?: string,
  ) {
    const cookieHeader = typeof req?.headers?.cookie === 'string' ? req.headers.cookie : '';
    const rawCookieMap = new Map<string, string>();

    for (const pair of cookieHeader.split(';')) {
      const [name, ...rest] = pair.split('=');
      if (!name) continue;
      const key = name.trim();
      const value = rest.join('=').trim();
      if (key && value) {
        rawCookieMap.set(key, value);
      }
    }

    const refreshTokenFromCookie =
      req.cookies?.['__Host-refresh_token'] ??
      req.cookies?.['refresh_token'] ??
      rawCookieMap.get('__Host-refresh_token') ??
      rawCookieMap.get('refresh_token');

    const refreshTokenFromBody = typeof refreshToken === 'string' ? refreshToken.trim() : '';
    const normalizedRefreshToken = refreshTokenFromCookie || refreshTokenFromBody;

    try {
      if (!normalizedRefreshToken) {
        throw new BadRequestException('Refresh token is required');
      }

      if (normalizedRefreshToken.length < 64) {
        throw new UnauthorizedException('Refresh token is invalid or malformed');
      }

      const result = await this.authService.refreshAccessToken(normalizedRefreshToken);

      if (result.accessToken && result.refreshToken) {
        this.setAuthCookies(res, result.accessToken, result.refreshToken);
      }

      return result;
    } catch (error) {
      await this.authService.clearRefreshSession(normalizedRefreshToken);
      this.clearAuthCookies(res);
      throw error;
    }
  }

  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const cookieHeader = typeof req?.headers?.cookie === 'string' ? req.headers.cookie : '';
    const refreshToken = req.cookies?.['__Host-refresh_token']
      ?? req.cookies?.['refresh_token']
      ?? cookieHeader.split(';')
        .map((part: string) => part.trim())
        .find((part: string) => part.startsWith('__Host-refresh_token=') || part.startsWith('refresh_token='))
        ?.split('=').slice(1).join('=');

    await this.authService.clearRefreshSession(refreshToken);
    this.clearAuthCookies(res);

    return { message: 'Logged out successfully' };
  }

  private clearAuthCookies(res: Response) {
    const baseOptions = { path: '/', httpOnly: true, sameSite: 'lax' as const };
    for (const secure of [false, true]) {
      const cookieOptions = { ...baseOptions, secure };
      res.clearCookie('__Host-access_token', cookieOptions);
      res.clearCookie('access_token', cookieOptions);
      res.clearCookie('__Host-refresh_token', cookieOptions);
      res.clearCookie('refresh_token', cookieOptions);
    }
  }

  // Health check
  @Get('health')
  async health() {
    return { status: 'OK', message: 'Auth service is running' };
  }
}
