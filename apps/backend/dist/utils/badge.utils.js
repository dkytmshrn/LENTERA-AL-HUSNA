"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgeUtils = exports.BADGE_DEFINITIONS = void 0;
const account_model_1 = require("../models/account.model");
exports.BADGE_DEFINITIONS = {
    'Siswa': {
        name: 'Siswa',
        role: account_model_1.AccountRole.STUDENT,
        displayName: 'Student',
    },
    'Guru': {
        name: 'Guru',
        role: account_model_1.AccountRole.TEACHER,
        displayName: 'Teacher',
    },
    'Wali Kelas': {
        name: 'Wali Kelas',
        role: account_model_1.AccountRole.TEACHER,
        displayName: 'Homeroom Teacher',
    },
    'Kepala Sekolah': {
        name: 'Kepala Sekolah',
        role: account_model_1.AccountRole.PRINCIPAL,
        displayName: 'Principal',
    },
    'Wakil Kepala Sekolah': {
        name: 'Wakil Kepala Sekolah',
        role: account_model_1.AccountRole.PRINCIPAL,
        displayName: 'Vice Principal',
    },
    'TU': {
        name: 'TU',
        role: account_model_1.AccountRole.SYSADMIN,
        displayName: 'Administrative Staff',
    },
};
class BadgeUtils {
    static getRoleFromBadges(badgeString) {
        if (!badgeString || !badgeString.trim()) {
            return null;
        }
        const badges = badgeString
            .split(',')
            .map((b) => b.trim())
            .filter((b) => b in exports.BADGE_DEFINITIONS);
        if (badges.length === 0) {
            return null;
        }
        const roles = new Set(badges.map((b) => exports.BADGE_DEFINITIONS[b].role));
        if (roles.size > 1) {
            throw new Error('Cannot assign badges with conflicting roles');
        }
        return Array.from(roles)[0] || null;
    }
    static parseBadges(badgeString) {
        if (!badgeString || !badgeString.trim()) {
            return [];
        }
        return badgeString
            .split(',')
            .map((b) => b.trim())
            .filter((b) => b in exports.BADGE_DEFINITIONS);
    }
    static getBadgesByRole(role) {
        return Object.values(exports.BADGE_DEFINITIONS)
            .filter((def) => def.role === role)
            .map((def) => def.name);
    }
    static hasConflictingRoles(badge1, badge2) {
        const role1 = exports.BADGE_DEFINITIONS[badge1]?.role;
        const role2 = exports.BADGE_DEFINITIONS[badge2]?.role;
        return role1 !== role2;
    }
    static mergeBadges(...badges) {
        const validBadges = new Set();
        for (const badge of badges) {
            if (badge && badge.trim() && badge.trim() in exports.BADGE_DEFINITIONS) {
                validBadges.add(badge.trim());
            }
        }
        const badgeArray = Array.from(validBadges);
        const roles = new Set(badgeArray.map((b) => exports.BADGE_DEFINITIONS[b].role));
        if (roles.size > 1) {
            throw new Error('Cannot merge badges with conflicting roles');
        }
        return badgeArray.join(', ');
    }
    static removeBadge(badgeString, badgeToRemove) {
        if (!badgeString)
            return undefined;
        const badges = this.parseBadges(badgeString);
        const filtered = badges.filter((b) => b !== badgeToRemove);
        return filtered.length > 0 ? filtered.join(', ') : undefined;
    }
    static requiresMFA(badgeString) {
        if (!badgeString)
            return false;
        const badges = this.parseBadges(badgeString);
        return badges.includes('TU');
    }
}
exports.BadgeUtils = BadgeUtils;
//# sourceMappingURL=badge.utils.js.map