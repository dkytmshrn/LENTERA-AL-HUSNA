"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidationGuard = void 0;
const common_1 = require("@nestjs/common");
let AuthValidationGuard = class AuthValidationGuard {
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        if (!user) {
            throw new common_1.UnauthorizedException('Authentication required.');
        }
        const requiredFields = ['userId', 'email', 'role', 'jti', 'iss', 'aud', 'iat', 'nbf', 'exp'];
        const missing = requiredFields.filter((field) => user[field] === undefined || user[field] === null || user[field] === '');
        if (missing.length > 0) {
            throw new common_1.UnauthorizedException(`Authentication validation failed. Missing claims: ${missing.join(', ')}`);
        }
        return true;
    }
};
exports.AuthValidationGuard = AuthValidationGuard;
exports.AuthValidationGuard = AuthValidationGuard = __decorate([
    (0, common_1.Injectable)()
], AuthValidationGuard);
//# sourceMappingURL=auth-validation.guard.js.map