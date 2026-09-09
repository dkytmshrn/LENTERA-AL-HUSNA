"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const isDevelopment = process.env.NODE_ENV !== 'production';
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const payload = exception instanceof common_1.HttpException
            ? exception.getResponse()
            : {
                message: exception instanceof Error ? exception.message : 'Internal server error',
                stack: exception instanceof Error ? exception.stack : undefined,
            };
        const safeMessage = typeof payload === 'object' && payload !== null
            ? payload.message || 'Request failed'
            : 'Request failed';
        const safeErrors = typeof payload === 'object' && payload !== null && Array.isArray(payload.errors)
            ? payload.errors
            : undefined;
        const actualError = isDevelopment && exception instanceof Error
            ? {
                name: exception.name,
                message: exception.message,
                stack: exception.stack,
            }
            : undefined;
        response.status(status).json({
            statusCode: status,
            message: isDevelopment ? safeMessage : this.formatMessage(safeMessage),
            path: request.url,
            ...(isDevelopment && actualError ? { error: actualError } : {}),
            ...(safeErrors ? { errors: safeErrors } : {}),
        });
    }
    formatMessage(message) {
        if (!message || typeof message !== 'string') {
            return 'Request failed';
        }
        const normalized = message.trim();
        if (normalized.toLowerCase().includes('duplicate')) {
            return 'This email is already in use.';
        }
        if (normalized.toLowerCase().includes('invalid') || normalized.toLowerCase().includes('required')) {
            return 'The submitted data is invalid.';
        }
        if (normalized.toLowerCase().includes('not found')) {
            return 'The requested resource was not found.';
        }
        if (normalized.toLowerCase().includes('unauthorized')) {
            return 'You are not authorized to perform this action.';
        }
        if (normalized.toLowerCase().includes('forbidden')) {
            return 'Access is forbidden.';
        }
        if (normalized.toLowerCase().includes('expired')) {
            return 'This request has expired. Please try again.';
        }
        return 'Request failed';
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map