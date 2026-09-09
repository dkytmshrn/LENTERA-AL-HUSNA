import { CanActivate, ExecutionContext } from '@nestjs/common';
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}
export declare class AuthValidationGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
