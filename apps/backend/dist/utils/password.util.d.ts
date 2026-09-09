export declare class PasswordUtil {
    private static readonly SALT_ROUNDS;
    static hashPassword(password: string): Promise<string>;
    static comparePassword(password: string, hashedPassword: string): Promise<boolean>;
    static validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
    };
    static generateTemporaryPassword(length?: number): string;
    static generateOTP(length?: number): string;
    static getPasswordStrengthLevel(password: string): {
        level: 'weak' | 'fair' | 'good' | 'strong';
        score: number;
    };
}
