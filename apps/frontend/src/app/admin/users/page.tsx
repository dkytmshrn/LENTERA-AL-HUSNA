'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/Common/Input';
import { Button } from '@/components/Common/Button';
import { Alert } from '@/components/Common/Alert';
import { authApi, UserAdminItem } from '@/lib/api';
import { useProtectedRoute } from '@/hooks/useAuth';
import { AppShell } from '@/components/AppShell';

const ROLES = ['Guest', 'Student', 'Teacher', 'Principal', 'SysAdmin'];
const BADGES = ['TU', 'Wakil Kepala Sekolah', 'Kepala Sekolah', 'Guru', 'Wali Kelas', 'Siswa'];

export default function UserManagementPage() {
  const router = useRouter();
  const { isAuthenticated } = useProtectedRoute();
  const [users, setUsers] = useState<UserAdminItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedUser, setSelectedUser] = useState<UserAdminItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<UserAdminItem | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableBadges, setAvailableBadges] = useState<Array<{ name: string; role: string; displayName: string }>>([]);
  const [showMFAInput, setShowMFAInput] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaExpiration, setMfaExpiration] = useState<Date | null>(null);
  const [disabledBadges, setDisabledBadges] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchAvailableBadges();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = window.setTimeout(() => {
      void fetchUsers();
    }, searchEmail || searchName ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, searchEmail, searchName, filterRole, currentPage]);

  const fetchAvailableBadges = async () => {
    try {
      const data = await authApi.admin.badges();
      setAvailableBadges(data || []);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await authApi.admin.users({
        searchEmail: searchEmail.trim() || undefined,
        searchName: searchName.trim() || undefined,
        role: filterRole || undefined,
        page: currentPage,
        limit: pageSize,
      });
      if (Array.isArray(data)) {
        setUsers(data);
        setTotalCount(data.length);
        setTotalPages(1);
      } else {
        setUsers(data.items || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to fetch users',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDetailModal = (user: UserAdminItem) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const openRoleModal = (user: UserAdminItem) => {
    setSelectedUser(user);
    const badges = user.badge ? user.badge.split(', ').filter(Boolean) : [];
    setSelectedBadges(badges);
    setShowMFAInput(false);
    setMfaCode('');
    setMfaExpiration(null);
    updateDisabledBadges(badges);
    setShowRoleModal(true);
  };

  const updateDisabledBadges = (selectedBadges: string[]) => {
    if (selectedBadges.length === 0) {
      setDisabledBadges(new Set());
      return;
    }

    // Get roles of selected badges
    const selectedRoles = new Set<string>();
    selectedBadges.forEach((badgeName) => {
      const badge = availableBadges.find((b) => b.name === badgeName);
      if (badge) {
        selectedRoles.add(badge.role);
      }
    });

    // If we have a role, disable badges with different roles
    if (selectedRoles.size === 1) {
      const selectedRole = Array.from(selectedRoles)[0];
      const disabled = new Set<string>();

      availableBadges.forEach((badge) => {
        if (badge.role !== selectedRole) {
          disabled.add(badge.name);
        }
      });

      setDisabledBadges(disabled);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || selectedBadges.length === 0) {
      setAlert({ type: 'error', message: 'Please select at least one badge' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.admin.updateUserBadges(selectedUser.id, selectedBadges, mfaCode || undefined);
      const data = response as any;

      if (data.requiresMFA) {
        setShowMFAInput(true);
        setMfaExpiration(new Date(data.mfaExpiration));
        setAlert({
          type: 'error',
          message: 'MFA code sent to user email. Please enter it to proceed.',
        });
        setIsSubmitting(false);
        return;
      }

      setAlert({ type: 'success', message: 'User badges updated successfully' });
      setShowRoleModal(false);
      setShowMFAInput(false);
      setMfaCode('');
      fetchUsers();
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to update user role',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBadgeChange = (badgeName: string, checked: boolean) => {
    const newBadges = checked
      ? [...selectedBadges, badgeName]
      : selectedBadges.filter((b) => b !== badgeName);

    setSelectedBadges(newBadges);
    updateDisabledBadges(newBadges);
  };

  const handleDeleteUser = async () => {
    if (!deleteCandidate) return;
    try {
      await authApi.admin.deleteUser(deleteCandidate.id);
      setAlert({ type: 'success', message: 'User deleted successfully' });
      setDeleteCandidate(null);
      fetchUsers();
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to delete user',
      });
    }
  };

  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + users.length, totalCount);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell title="Manajemen Pengguna">
      <div className="bg-[var(--background)] -m-4 lg:-m-6 p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Search and Filters */}
        <div className="bg-[var(--surface)] rounded-lg shadow p-6 mb-6 border border-[var(--border)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Cari berdasarkan Email"
              placeholder="Masukkan email..."
              value={searchEmail}
              onChange={(e) => { setSearchEmail(e.target.value); setCurrentPage(1); }}
            />
            <Input
              label="Cari berdasarkan Nama"
              placeholder="Masukkan nama..."
              value={searchName}
              onChange={(e) => { setSearchName(e.target.value); setCurrentPage(1); }}
            />
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Filter berdasarkan Peran
              </label>
              <select
                value={filterRole}
                onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-2 border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
              >
                <option value="">Semua Peran</option>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[var(--surface)] rounded-lg shadow overflow-hidden border border-[var(--border)]">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-[var(--muted)]">
              Pengguna tidak ditemukan
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--border)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--foreground)]">Nama</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--foreground)]">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--foreground)]">Peran</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--foreground)]">Lencana</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--foreground)]">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--foreground)]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-[var(--border)] hover:bg-[var(--border)] transition">
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                        <div>{user.fullName}</div>
                        <div className="text-xs text-[var(--muted)]">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role || 'Guest'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{user.badge || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {user.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => openDetailModal(user)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium"
                        >
                          Lihat
                        </button>
                        <button
                          onClick={() => setDeleteCandidate(user)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs font-medium"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-[var(--muted)]">
              Menampilkan {startIndex + 1} sampai {endIndex} dari {totalCount}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[var(--surface)] text-[var(--foreground)] rounded border border-[var(--border)] hover:bg-[var(--border)] disabled:opacity-50 transition text-sm font-medium"
              >
                Sebelumnya
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded transition text-sm font-medium ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--border)]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[var(--surface)] text-[var(--foreground)] rounded border border-[var(--border)] hover:bg-[var(--border)] disabled:opacity-50 transition text-sm font-medium"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-lg shadow-lg p-6 max-w-md w-full border border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">Hapus pengguna?</h2>
            <p className="text-sm text-[var(--muted)] mb-6">
              Pengguna <strong>{deleteCandidate.fullName}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 px-4 py-2 bg-[var(--border)] text-[var(--foreground)] rounded hover:bg-opacity-80 transition font-medium text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium text-sm"
              >
                Hapus permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-lg shadow-lg p-6 max-w-md w-full border border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">Detail Pengguna</h2>

            <div className="space-y-3 mb-6">
              <div>
                <p className="text-xs text-[var(--muted)]">Nama Lengkap</p>
                <p className="text-[var(--foreground)]">{selectedUser.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Email</p>
                <p className="text-[var(--foreground)]">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Role</p>
                <p className="text-[var(--foreground)]">{selectedUser.role || 'Guest'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Badge</p>
                <p className="text-[var(--foreground)]">{selectedUser.badge || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Status</p>
                <p className="text-[var(--foreground)]">{selectedUser.status || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Nomor Telepon</p>
                <p className="text-[var(--foreground)]">{selectedUser.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Tanggal Lahir</p>
                <p className="text-[var(--foreground)]">{selectedUser.birthday || 'N/A'}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 bg-[var(--border)] text-[var(--foreground)] rounded hover:bg-opacity-80 transition font-medium text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-lg shadow-lg p-6 max-w-2xl w-full border border-[var(--border)] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Tetapkan Lencana Pengguna</h2>

            <div className="mb-6 pb-4 border-b border-[var(--border)]">
              <p className="text-sm text-[var(--muted)]">
                <strong>User:</strong> {selectedUser.fullName} ({selectedUser.email})
              </p>
              {selectedUser.role && (
                <p className="text-sm text-[var(--muted)] mt-2">
                  <strong>Current Role:</strong> {selectedUser.role}
                </p>
              )}
            </div>

            {/* Badge Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Select Badges</h3>
              <p className="text-xs text-[var(--muted)] mb-3">
                Select one or more badges for this user. Only badges from the same role can be combined.
              </p>

              {selectedBadges.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-3">
                  <p className="text-sm text-blue-800">
                    <strong>Selected Role:</strong> {
                      availableBadges.find((b) => b.name === selectedBadges[0])?.role || 'Unknown'
                    }
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {availableBadges.map((badge) => {
                  const isDisabled = disabledBadges.has(badge.name);
                  const isSelected = selectedBadges.includes(badge.name);

                  return (
                    <label
                      key={badge.name}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        isDisabled
                          ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                          : isSelected
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-[var(--border)] hover:bg-[var(--border)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleBadgeChange(badge.name, e.target.checked)}
                        disabled={isDisabled}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {badge.displayName}
                        </span>
                        <span className="text-xs text-[var(--muted)] ml-2">
                          ({badge.name})
                        </span>
                        {isDisabled && selectedBadges.length > 0 && (
                          <p className="text-xs text-red-600 mt-1">
                            Not compatible with {availableBadges.find((b) => b.name === selectedBadges[0])?.role}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {selectedBadges.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>Badges:</strong> {selectedBadges.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* MFA Input */}
            {showMFAInput && selectedBadges.includes('TU') && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="text-sm font-semibold text-orange-900 mb-3">Multi-Factor Authentication</h3>
                <p className="text-sm text-orange-800 mb-3">
                  Assigning the TU (Administrative Staff) badge requires MFA verification.
                  An OTP has been sent to the user's email.
                </p>
                <input
                  type="text"
                  placeholder="Enter 6-digit MFA code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.slice(0, 6))}
                  maxLength={6}
                  className="w-full px-3 py-2 border border-orange-300 rounded-md text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500 bg-[var(--background)] text-[var(--foreground)]"
                  disabled={isSubmitting}
                />
                {mfaExpiration && (
                  <p className="text-xs text-orange-700 mt-2">
                    MFA code expires: {new Date(mfaExpiration).toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setShowMFAInput(false);
                  setMfaCode('');
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-[var(--border)] text-[var(--foreground)] rounded hover:bg-opacity-80 disabled:opacity-50 transition font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={isSubmitting || selectedBadges.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition font-medium text-sm"
              >
                {isSubmitting ? 'Updating...' : 'Update Badges'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}
