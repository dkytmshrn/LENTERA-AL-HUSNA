import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => {
          if (!req) return null;
          
          // Try production cookie name first
          if (req.cookies && req.cookies['__Host-access_token']) {
            return req.cookies['__Host-access_token'];
          }

          // Fall back to development cookie name
          if (req.cookies && req.cookies['access_token']) {
            return req.cookies['access_token'];
          }

          const cookieHeader = req.headers?.cookie;
          if (typeof cookieHeader === 'string') {
            // Try production cookie name first
            let cookie = cookieHeader
              .split(';')
              .map((item) => item.trim())
              .find((item) => item.startsWith('__Host-access_token='));

            if (cookie) {
              return decodeURIComponent(cookie.split('=')[1]);
            }

            // Fall back to development cookie name
            cookie = cookieHeader
              .split(';')
              .map((item) => item.trim())
              .find((item) => item.startsWith('access_token='));

            if (cookie) {
              return decodeURIComponent(cookie.split('=')[1]);
            }
          }

          return null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
      issuer: process.env.JWT_ISSUER || 'lentera-school',
      algorithms: ['HS256'],
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
      iss: payload.iss,
      aud: payload.aud,
      iat: payload.iat,
      nbf: payload.nbf,
      exp: payload.exp,
    };
  }
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => {
          if (!req) return null;
          
          // Try production cookie name first
          if (req.cookies && req.cookies['__Host-refresh_token']) {
            return req.cookies['__Host-refresh_token'];
          }

          // Fall back to development cookie name
          if (req.cookies && req.cookies['refresh_token']) {
            return req.cookies['refresh_token'];
          }

          const cookieHeader = req.headers?.cookie;
          if (typeof cookieHeader === 'string') {
            // Try production cookie name first
            let cookie = cookieHeader
              .split(';')
              .map((item) => item.trim())
              .find((item) => item.startsWith('__Host-refresh_token='));

            if (cookie) {
              return decodeURIComponent(cookie.split('=')[1]);
            }

            // Fall back to development cookie name
            cookie = cookieHeader
              .split(';')
              .map((item) => item.trim())
              .find((item) => item.startsWith('refresh_token='));

            if (cookie) {
              return decodeURIComponent(cookie.split('=')[1]);
            }
          }

          if (req.body && req.body.refreshToken) {
            return req.body.refreshToken;
          }

          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      issuer: process.env.JWT_ISSUER || 'lentera-school',
      algorithms: ['HS256'],
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      jti: payload.jti,
      iss: payload.iss,
      aud: payload.aud,
      iat: payload.iat,
      nbf: payload.nbf,
      exp: payload.exp,
    };
  }
}
