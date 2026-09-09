import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

@Injectable()
export class AuthValidationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest() as any;
    const user = req.user as any;

    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    const requiredFields = ['userId', 'email', 'role', 'jti', 'iss', 'aud', 'iat', 'nbf', 'exp'];
    const missing = requiredFields.filter((field) => user[field] === undefined || user[field] === null || user[field] === '');

    if (missing.length > 0) {
      throw new UnauthorizedException(`Authentication validation failed. Missing claims: ${missing.join(', ')}`);
    }

    return true;
  }
}
