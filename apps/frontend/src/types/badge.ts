export type BadgeName = 'Siswa' | 'Guru' | 'Wali Kelas' | 'Kepala Sekolah' | 'Wakil Kepala Sekolah' | 'TU';
export type UserRole = 'Student' | 'Teacher' | 'Principal' | 'SysAdmin' | 'Guest';

export interface Badge {
  name: BadgeName;
  role: UserRole;
  displayName: string;
}

export interface UserBadgeAssignment {
  userId: string;
  badges: BadgeName[];
  role: UserRole;
  requiresMFA: boolean;
  mfaCode?: string;
}

export const BADGE_ROLE_MAP: Record<BadgeName, UserRole> = {
  'Siswa': 'Student',
  'Guru': 'Teacher',
  'Wali Kelas': 'Teacher',
  'Kepala Sekolah': 'Principal',
  'Wakil Kepala Sekolah': 'Principal',
  'TU': 'SysAdmin',
};

export const ROLE_BADGES: Record<UserRole, BadgeName[]> = {
  'Student': ['Siswa'],
  'Teacher': ['Guru', 'Wali Kelas'],
  'Principal': ['Kepala Sekolah', 'Wakil Kepala Sekolah'],
  'SysAdmin': ['TU'],
  'Guest': [],
};
