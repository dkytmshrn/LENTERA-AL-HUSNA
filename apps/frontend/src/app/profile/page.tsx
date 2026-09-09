'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/Common/Alert';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input';
import { authApi, clearTokens, saveUserSession } from '@/lib/api';
import { useProtectedRoute } from '@/hooks/useAuth';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useProtectedRoute();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('');
  const [badge, setBadge] = useState('');
  const [accountId, setAccountId] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivationOtp, setDeactivationOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpRequestLoading, setOtpRequestLoading] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const storedFullName = localStorage.getItem('userFullName') || localStorage.getItem('userName') || 'User';
    const storedEmail = localStorage.getItem('userEmail') || '';
    const storedPhoneNumber = localStorage.getItem('userPhoneNumber') || '';
    const storedRole = localStorage.getItem('userRole') || 'Guest';
    const storedBadge = localStorage.getItem('userBadge') || '';
    const storedAccountId = localStorage.getItem('accountId') || sessionStorage.getItem('accountId') || '';

    setFullName(storedFullName);
    setEmail(storedEmail);
    setPhoneNumber(storedPhoneNumber);
    setRole(storedRole);
    setBadge(storedBadge);
    setAccountId(storedAccountId);
  }, [isAuthenticated]);

  const profileSummary = useMemo(
    () => [
      { label: 'Full Name', value: fullName || 'Not available' },
      { label: 'Email', value: email || 'Not available' },
      { label: 'Phone Number', value: phoneNumber || 'Not set' },
      { label: 'Role', value: role || 'Guest' },
      { label: 'Badge', value: badge || 'N/A' },
    ],
    [fullName, email, phoneNumber, role, badge],
  );

  const handlePhoneUpdate = async () => {
    if (!accountId) {
      setAlert({ type: 'error', message: 'Account session is missing. Please log in again.' });
      return;
    }

    if (!phoneNumber.trim()) {
      setAlert({ type: 'error', message: 'Phone number is required.' });
      return;
    }

    setIsSavingPhone(true);
    setAlert(null);

    try {
      const updated = await authApi.updateProfile(accountId, { phoneNumber });
      localStorage.setItem('userPhoneNumber', updated.phoneNumber || phoneNumber);
      setAlert({ type: 'success', message: 'Phone number updated successfully.' });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Unable to update phone number.' });
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!accountId) {
      setAlert({ type: 'error', message: 'Account session is missing. Please log in again.' });
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setAlert({ type: 'error', message: 'Please fill in all password fields.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setAlert({ type: 'error', message: 'New password and confirm password do not match.' });
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.changePassword(accountId, {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setAlert({
        type: 'success',
        message: 'Password changed successfully.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Password change failed.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDeactivationOtp = async () => {
    if (!accountId) {
      setAlert({ type: 'error', message: 'Account session is missing. Please log in again.' });
      return;
    }

    setOtpRequestLoading(true);
    setAlert(null);

    try {
      const result = await authApi.requestDeactivationOTP(accountId);
      setOtpSent(true);
      setOtpRequested(true);
      setAlert({ type: 'success', message: result.message || 'Deactivation confirmation sent to your email.' });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Unable to request deactivation confirmation.' });
    } finally {
      setOtpRequestLoading(false);
    }
  };

  const confirmDeactivation = async () => {
    if (!accountId) {
      setAlert({ type: 'error', message: 'Account session is missing. Please log in again.' });
      return;
    }

    if (!deactivationOtp.trim()) {
      setAlert({ type: 'error', message: 'Please enter the OTP sent to your email.' });
      return;
    }

    setDeactivateLoading(true);
    setAlert(null);

    try {
      const response = await authApi.confirmDeactivation(accountId, deactivationOtp);
      setAlert({ type: 'success', message: response.message || 'Account deactivated successfully.' });
      clearTokens();
      setShowDeactivateModal(false);
      setTimeout(() => router.push('/login'), 1200);
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Unable to deactivate account.' });
    } finally {
      setDeactivateLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Profil Saya</h1>
            <p className="mt-1 text-[var(--muted)]">Kelola informasi akun pribadi dan keamanan Anda.</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Detail Akun</h2>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{role || 'Guest'}</span>
            </div>

            <div className="space-y-3">
              {profileSummary.map((item) => (
                <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{item.label}</p>
                  <p className="mt-2 text-base font-medium text-[var(--foreground)]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Nomor Telepon</h2>
              </div>

              <div className="space-y-4">
                <Input
                  label="Phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Example: +628123456789"
                />
                <Button type="button" onClick={handlePhoneUpdate} isLoading={isSavingPhone} className="w-full">
                  Save Phone Number
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Keamanan</h2>
              </div>

              <Button type="button" variant="secondary" className="w-full" onClick={() => setShowPasswordModal(true)}>
                Change Password
              </Button>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-red-700">Deactivate Account</h2>
              </div>
              <p className="mb-4 text-sm text-red-700">
                Deactivating your account will block access to the system and require a confirmation email OTP.
              </p>
              <Button type="button" variant="danger" className="w-full" onClick={() => setShowDeactivateModal(true)}>
                Deactivate My Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[var(--foreground)]">Change Password</h2>
              <button type="button" onClick={() => setShowPasswordModal(false)} className="text-xl text-[var(--muted)]">×</button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} className="flex-1">
                  Save Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-[var(--surface)] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-red-700">Confirm Deactivation</h2>
              <button type="button" onClick={() => setShowDeactivateModal(false)} className="text-xl text-[var(--muted)]">×</button>
            </div>

            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              This action is permanent. Your account will no longer be accessible and you will need to contact support to restore it.
            </div>

            {!otpRequested ? (
              <div className="space-y-4">
                <p className="text-sm text-[var(--muted)]">We will send an OTP to your registered email to confirm this action.</p>
                <Button type="button" variant="danger" className="w-full" isLoading={otpRequestLoading} onClick={requestDeactivationOtp}>
                  Send OTP to My Email
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Confirmation OTP"
                  value={deactivationOtp}
                  onChange={(e) => setDeactivationOtp(e.target.value)}
                  placeholder="Enter the OTP from your email"
                />

                <div className="flex gap-3">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowDeactivateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="button" variant="danger" className="flex-1" isLoading={deactivateLoading} onClick={confirmDeactivation}>
                    Confirm Deactivation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
