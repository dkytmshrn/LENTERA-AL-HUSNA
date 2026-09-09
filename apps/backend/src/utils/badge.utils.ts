import { AccountRole } from '../models/account.model';

export type BadgeName = 'Siswa' | 'Guru' | 'Wali Kelas' | 'Kepala Sekolah' | 'Wakil Kepala Sekolah' | 'TU';

export interface BadgeDefinition {
  name: BadgeName;
  role: AccountRole;
  displayName: string;
}

export const BADGE_DEFINITIONS: Record<BadgeName, BadgeDefinition> = {
  'Siswa': {
    name: 'Siswa',
    role: AccountRole.STUDENT,
    displayName: 'Student',
  },
  'Guru': {
    name: 'Guru',
    role: AccountRole.TEACHER,
    displayName: 'Teacher',
  },
  'Wali Kelas': {
    name: 'Wali Kelas',
    role: AccountRole.TEACHER,
    displayName: 'Homeroom Teacher',
  },
  'Kepala Sekolah': {
    name: 'Kepala Sekolah',
    role: AccountRole.PRINCIPAL,
    displayName: 'Principal',
  },
  'Wakil Kepala Sekolah': {
    name: 'Wakil Kepala Sekolah',
    role: AccountRole.PRINCIPAL,
    displayName: 'Vice Principal',
  },
  'TU': {
    name: 'TU',
    role: AccountRole.SYSADMIN,
    displayName: 'Administrative Staff',
  },
};

export class BadgeUtils {
  /**
   * Get role from badge name(s)
   * Returns the primary role if multiple badges with same role exist
   * Throws error if badges have conflicting roles
   */
  static getRoleFromBadges(badgeString?: string): AccountRole | null {
    if (!badgeString || !badgeString.trim()) {
      return null;
    }

    const badges = badgeString
      .split(',')
      .map((b) => b.trim())
      .filter((b): b is BadgeName => b in BADGE_DEFINITIONS);

    if (badges.length === 0) {
      return null;
    }

    const roles = new Set(badges.map((b) => BADGE_DEFINITIONS[b].role));

    if (roles.size > 1) {
      throw new Error('Cannot assign badges with conflicting roles');
    }

    return Array.from(roles)[0] || null;
  }

  /**
   * Parse badge string into array of valid badge names
   */
  static parseBadges(badgeString?: string): BadgeName[] {
    if (!badgeString || !badgeString.trim()) {
      return [];
    }

    return badgeString
      .split(',')
      .map((b) => b.trim())
      .filter((b): b is BadgeName => b in BADGE_DEFINITIONS);
  }

  /**
   * Get all badges with a specific role
   */
  static getBadgesByRole(role: AccountRole): BadgeName[] {
    return Object.values(BADGE_DEFINITIONS)
      .filter((def) => def.role === role)
      .map((def) => def.name);
  }

  /**
   * Check if two badges have conflicting roles
   */
  static hasConflictingRoles(badge1: BadgeName, badge2: BadgeName): boolean {
    const role1 = BADGE_DEFINITIONS[badge1]?.role;
    const role2 = BADGE_DEFINITIONS[badge2]?.role;
    return role1 !== role2;
  }

  /**
   * Merge multiple badges, ensuring no role conflicts
   */
  static mergeBadges(...badges: (BadgeName | string)[]): string {
    const validBadges = new Set<BadgeName>();

    for (const badge of badges) {
      if (badge && badge.trim() && badge.trim() in BADGE_DEFINITIONS) {
        validBadges.add(badge.trim() as BadgeName);
      }
    }

    const badgeArray = Array.from(validBadges);

    // Check for conflicts
    const roles = new Set(badgeArray.map((b) => BADGE_DEFINITIONS[b].role));
    if (roles.size > 1) {
      throw new Error('Cannot merge badges with conflicting roles');
    }

    return badgeArray.join(', ');
  }

  /**
   * Remove a badge from a badge string
   */
  static removeBadge(badgeString: string | undefined, badgeToRemove: BadgeName): string | undefined {
    if (!badgeString) return undefined;

    const badges = this.parseBadges(badgeString);
    const filtered = badges.filter((b) => b !== badgeToRemove);

    return filtered.length > 0 ? filtered.join(', ') : undefined;
  }

  /**
   * Check if badge string requires MFA
   */
  static requiresMFA(badgeString?: string): boolean {
    if (!badgeString) return false;
    const badges = this.parseBadges(badgeString);
    return badges.includes('TU');
  }
}
