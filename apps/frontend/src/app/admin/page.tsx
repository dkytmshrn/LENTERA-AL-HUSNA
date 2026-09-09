'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert } from '@/components/Common/Alert';
import { Button } from '@/components/Common/Button';
import { authApi, type RegistrationRequestAdminItem, type UserAdminItem } from '@/lib/api';

const roleOptions = ['Guest', 'Student', 'Teacher', 'Principal', 'SysAdmin'];

export default function AdminPage() {
  const [requests, setRequests] = useState<RegistrationRequestAdminItem[]>([]);
  const [users, setUsers] = useState<UserAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestResponse, userResponse] = await Promise.all([
        authApi.admin.registrationRequests(),
        authApi.admin.users(),
      ]);
      const normalizedUsers = Array.isArray(userResponse) ? userResponse : userResponse?.items || [];
      setRequests(requestResponse || []);
      setUsers(normalizedUsers);
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to load admin data.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === 'Pending'),
    [requests],
  );

  const handleApprove = async (email: string, assignedRole: string, assignedBadge?: string) => {
    try {
      setProcessingId(email);
      await authApi.admin.approveRegistration(email, assignedRole, assignedBadge);
      setAlert({ type: 'success', message: 'Registration approved successfully.' });
      await loadData();
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Approval failed.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (email: string) => {
    const reason = window.prompt('Reason for rejection', 'Application does not meet our criteria.');
    if (!reason) return;

    try {
      setProcessingId(email);
      await authApi.admin.rejectRegistration(email, reason);
      setAlert({ type: 'success', message: 'Registration rejected successfully.' });
      await loadData();
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Rejection failed.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRoleChange = async (userId: string, role: string, badge?: string) => {
    try {
      setProcessingId(userId);
      await authApi.admin.updateUserRole(userId, role, badge);
      setAlert({ type: 'success', message: 'User role updated successfully.' });
      await loadData();
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Role update failed.' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-600 font-semibold">Admin panel</p>
            <h1 className="text-3xl font-bold text-[var(--foreground)] mt-2">Pendaftaran dan manajemen pengguna</h1>
          </div>
          <Button onClick={loadData} variant="secondary">Refresh</Button>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {loading ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-[var(--muted)]">
            Loading admin data...
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <div className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--foreground)]">Permohonan pendaftaran</h2>
                <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">{pendingRequests.length} pending</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[var(--surface-strong)] text-[var(--muted)]">
                    <tr>
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">Email</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Role</th>
                      <th className="px-6 py-3 font-medium">Created</th>
                      <th className="px-6 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-[var(--muted)]">
                          No registration requests found.
                        </td>
                      </tr>
                    ) : (
                      requests.map((request) => (
                        <tr key={request.id} className="border-t border-[var(--border)] align-top">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-[var(--foreground)]">{request.fullName || request.name}</div>
                            <div className="text-[var(--muted)] text-xs">{request.parentName || 'No parent name'}</div>
                          </td>
                          <td className="px-6 py-4 text-[var(--foreground)]">{request.email}</td>
                          <td className="px-6 py-4">
                            <span className="rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700">
                              {request.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              defaultValue={request.assignedRole || 'Student'}
                              className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                              aria-label={`Assign role for ${request.email}`}
                            >
                              {roleOptions.map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-[var(--muted)]">
                            {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="primary"
                                className="px-3 py-2 text-xs"
                                isLoading={processingId === request.email}
                                onClick={() => {
                                  const roleSelect = document.querySelector<HTMLSelectElement>(`select[aria-label="Assign role for ${request.email}"]`);
                                  const selectedRole = roleSelect?.value || 'Student';
                                  void handleApprove(request.email, selectedRole);
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                className="px-3 py-2 text-xs"
                                isLoading={processingId === request.email}
                                onClick={() => void handleReject(request.email)}
                              >
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <div className="border-b border-[var(--border)] px-6 py-4">
                <h2 className="text-xl font-bold text-[var(--foreground)]">Daftar pengguna</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[var(--surface-strong)] text-[var(--muted)]">
                    <tr>
                      <th className="px-6 py-3 font-medium">User</th>
                      <th className="px-6 py-3 font-medium">Role</th>
                      <th className="px-6 py-3 font-medium">Badge</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Joined</th>
                      <th className="px-6 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-[var(--muted)]">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="border-t border-[var(--border)] align-top">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-[var(--foreground)]">{user.fullName || user.name}</div>
                            <div className="text-[var(--muted)] text-xs">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              defaultValue={user.role || 'Guest'}
                              className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                              aria-label={`User role for ${user.email}`}
                            >
                              {roleOptions.map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              defaultValue={user.badge || ''}
                              aria-label={`User badge for ${user.email}`}
                              className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm min-w-[100px]"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <span className="rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700">
                              {user.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[var(--muted)]">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end">
                              <Button
                                variant="secondary"
                                className="px-3 py-2 text-xs"
                                isLoading={processingId === user.id}
                                onClick={() => {
                                  const roleSelect = document.querySelector<HTMLSelectElement>(`select[aria-label="User role for ${user.email}"]`);
                                  const badgeInput = document.querySelector<HTMLInputElement>(`input[aria-label="User badge for ${user.email}"]`);
                                  const selectedRole = roleSelect?.value || user.role || 'Guest';
                                  const selectedBadge = badgeInput?.value || user.badge || '';
                                  void handleRoleChange(user.id, selectedRole, selectedBadge);
                                }}
                              >
                                Save
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
