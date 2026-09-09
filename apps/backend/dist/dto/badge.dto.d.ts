export declare class AssignBadgesDto {
    badges: string[];
}
export declare class UpdateUserBadgesDto {
    badges: string[];
    mfaCode?: string;
}
export declare class VerifyBadgeAssignmentMfaDto {
    userId: string;
    mfaCode: string;
    badges: string[];
}
