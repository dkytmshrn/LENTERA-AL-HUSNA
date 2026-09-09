"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtRefreshStrategy = exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor() {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
                (req) => {
                    if (!req)
                        return null;
                    if (req.cookies && req.cookies['__Host-access_token']) {
                        return req.cookies['__Host-access_token'];
                    }
                    if (req.cookies && req.cookies['access_token']) {
                        return req.cookies['access_token'];
                    }
                    const cookieHeader = req.headers?.cookie;
                    if (typeof cookieHeader === 'string') {
                        let cookie = cookieHeader
                            .split(';')
                            .map((item) => item.trim())
                            .find((item) => item.startsWith('__Host-access_token='));
                        if (cookie) {
                            return decodeURIComponent(cookie.split('=')[1]);
                        }
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
                passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_ACCESS_SECRET,
            issuer: process.env.JWT_ISSUER || 'lentera-school',
            algorithms: ['HS256'],
        });
    }
    async validate(payload) {
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
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], JwtStrategy);
let JwtRefreshStrategy = class JwtRefreshStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt-refresh') {
    constructor() {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
                (req) => {
                    if (!req)
                        return null;
                    if (req.cookies && req.cookies['__Host-refresh_token']) {
                        return req.cookies['__Host-refresh_token'];
                    }
                    if (req.cookies && req.cookies['refresh_token']) {
                        return req.cookies['refresh_token'];
                    }
                    const cookieHeader = req.headers?.cookie;
                    if (typeof cookieHeader === 'string') {
                        let cookie = cookieHeader
                            .split(';')
                            .map((item) => item.trim())
                            .find((item) => item.startsWith('__Host-refresh_token='));
                        if (cookie) {
                            return decodeURIComponent(cookie.split('=')[1]);
                        }
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
    async validate(payload) {
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
};
exports.JwtRefreshStrategy = JwtRefreshStrategy;
exports.JwtRefreshStrategy = JwtRefreshStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], JwtRefreshStrategy);
//# sourceMappingURL=jwt.strategy.js.map