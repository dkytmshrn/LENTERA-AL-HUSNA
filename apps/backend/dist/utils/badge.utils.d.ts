import { AccountRole } from '../models/account.model';
export type BadgeName = 'Siswa' | 'Guru' | 'Wali Kelas' | 'Kepala Sekolah' | 'Wakil Kepala Sekolah' | 'TU';
export interface BadgeDefinition {
    name: BadgeName;
    role: AccountRole;
    displayName: string;
}
export declare const BADGE_DEFINITIONS: Record<BadgeName, BadgeDefinition>;
export declare class BadgeUtils {
    static getRoleFromBadges(badgeString?: string): AccountRole | null;
    static parseBadges(badgeString?: string): BadgeName[];
    static getBadgesByRole(role: AccountRole): BadgeName[];
    static hasConflictingRoles(badge1: BadgeName, badge2: BadgeName): boolean;
    static mergeBadges(...badges: (BadgeName | string)[]): string;
    static removeBadge(badgeString: string | undefined, badgeToRemove: BadgeName): string | undefined;
    static requiresMFA(badgeString?: string): boolean;
}
