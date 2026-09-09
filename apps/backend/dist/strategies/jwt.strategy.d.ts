declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: any): Promise<{
        userId: any;
        email: any;
        role: any;
        jti: any;
        iss: any;
        aud: any;
        iat: any;
        nbf: any;
        exp: any;
    }>;
}
declare const JwtRefreshStrategy_base: new (...args: any) => any;
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    constructor();
    validate(payload: any): Promise<{
        userId: any;
        email: any;
        jti: any;
        iss: any;
        aud: any;
        iat: any;
        nbf: any;
        exp: any;
    }>;
}
export {};
