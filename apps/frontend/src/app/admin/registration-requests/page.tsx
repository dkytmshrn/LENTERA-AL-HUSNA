'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/Common/Input';
import { Button } from '@/components/Common/Button';
import { Alert } from '@/components/Common/Alert';
import { authApi, RegistrationRequestAdminItem, saveUserSession } from '@/lib/api';
import { useProtectedRoute } from '@/hooks/useAuth';
import { AppShell } from '@/components/AppShell';

export default function RegistrationRequestsPage() {
  const router = useRouter();
  const { isAuthenticated } = useProtectedRoute();
  const [requests, setRequests] = useState<RegistrationRequestAdminItem[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RegistrationRequestAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequestAdminItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'approve' | 'reject'>('approve');
  const [assignedBadge, setAssignedBadge] = useState('');
  const [approvalOtp, setApprovalOtp] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const badges = ['TU', 'Wakil Kepala Sekolah', 'Kepala Sekolah', 'Guru', 'Wali Kelas', 'Siswa'];

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchRegistrationRequests();
  }, [isAuthenticated]);

  useEffect(() => {
    let filtered = requests;

    if (searchEmail) {
      filtered = filtered.filter((req) =>
        req.email.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    if (searchName) {
      filtered = filtered.filter(
        (req) =>
          (req.name?.toLowerCase().includes(searchName.toLowerCase()) ||
            req.fullName?.toLowerCase().includes(searchName.toLowerCase()))
      );
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [requests, searchEmail, searchName]);

  const fetchRegistrationRequests = async () => {
    setIsLoading(true);
    try {
      const data = await authApi.admin.registrationRequests();
      setRequests(data || []);
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to fetch registration requests',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openApproveModal = (request: RegistrationRequestAdminItem) => {
    setSelectedRequest(request);
    setModalMode('approve');
    setAssignedBadge('');
    setApprovalOtp('');
    setShowModal(true);
  };

  const openRejectModal = (request: RegistrationRequestAdminItem) => {
    setSelectedRequest(request);
    setModalMode('reject');
    setRejectionReason('');
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    if (modalMode === 'approve' && !assignedBadge) {
      setAlert({ type: 'error', message: 'Please select a badge' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'approve') {
        const result = await authApi.admin.approveRegistration(
          selectedRequest.email,
          '',
          assignedBadge,
          approvalOtp || undefined,
        ) as { requiresMFA?: boolean };
        if (result.requiresMFA) {
          setAlert({ type: 'success', message: 'OTP sent to the administrator email. Enter it to continue.' });
          setApprovalOtp('');
          return;
        }
        setAlert({ type: 'success', message: 'Registration approved successfully' });
      } else {
        await authApi.admin.rejectRegistration(selectedRequest.email, rejectionReason || 'No reason provided');
        setAlert({ type: 'success', message: 'Registration rejected successfully' });
      }
      setShowModal(false);
      fetchRegistrationRequests();
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to process registration',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.ceil(filteredRequests.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + pageSize);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell title="Permohonan Pendaftaran">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Search by Email"
              placeholder="Enter email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            <Input
              label="Search by Name"
              placeholder="Enter name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
        </div>

        {/* Registration Requests Table */}
        <div className="bg-[var(--surface)] rounded-lg shadow overflow-hidden border border-[var(--border)]">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : paginatedRequests.length === 0 ? (
            <div className="p-8 text-center text-[var(--muted)]">
              No registration requests found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--border)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--foreground)]">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--foreground)]">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--foreground)]">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--foreground)]">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--foreground)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.map((request) => (
                    <tr key={request.id} className="border-t border-[var(--border)] hover:bg-[var(--border)] transition">
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                        <div>{request.fullName}</div>
                        <div className="text-xs text-[var(--muted)]">{request.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{request.email}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{request.phoneNumber || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {request.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => openApproveModal(request)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(request)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs font-medium"
                        >
                          Reject
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
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredRequests.length)} of{' '}
              {filteredRequests.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[var(--surface)] text-[var(--foreground)] rounded border border-[var(--border)] hover:bg-[var(--border)] disabled:opacity-50 transition text-sm font-medium"
              >
                Previous
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
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-lg shadow-lg p-6 max-w-md w-full border border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
              {modalMode === 'approve' ? 'Approve Registration' : 'Reject Registration'}
            </h2>

            <div className="mb-4">
              <p className="text-sm text-[var(--muted)]">
                <strong>Name:</strong> {selectedRequest.fullName}
              </p>
              <p className="text-sm text-[var(--muted)]">
                <strong>Email:</strong> {selectedRequest.email}
              </p>
            </div>

            {modalMode === 'approve' ? (
              <div className="mb-4 space-y-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Assign Badge
                </label>
                <select
                  value={assignedBadge}
                  onChange={(e) => setAssignedBadge(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                >
                  <option value="">Select a badge...</option>
                  {badges.map((badge) => (
                    <option key={badge} value={badge}>
                      {badge}
                    </option>
                  ))}
                </select>
                {assignedBadge === 'TU' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Administrator OTP
                    </label>
                    <input
                      value={approvalOtp}
                      onChange={(e) => setApprovalOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter the OTP sent to your email"
                      className="w-full px-4 py-2 border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] resize-none"
                  rows={4}
                  placeholder="Enter reason for rejection..."
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-[var(--border)] text-[var(--foreground)] rounded hover:bg-opacity-80 disabled:opacity-50 transition font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 text-white rounded hover:opacity-90 disabled:opacity-50 transition font-medium text-sm ${
                  modalMode === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? 'Processing...' : modalMode === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}
