'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/Common/Input';
import { Button } from '@/components/Common/Button';
import { Alert } from '@/components/Common/Alert';
import { authApi } from '@/lib/api';
import { useRedirectIfAuthenticated } from '@/hooks/useAuth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const isReady = useRedirectIfAuthenticated();
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('resetPasswordEmail');
    const storedCode = sessionStorage.getItem('resetPasswordCode');

    if (!storedEmail) {
      router.push('/forgot-password');
      return;
    }
    setEmail(storedEmail);
    if (storedCode) {
      setResetCode(storedCode);
    }
  }, [router]);

  // Don't render page until auth check is complete
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (newPassword !== confirmPassword) {
      setAlert({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setAlert({
        type: 'error',
        message: 'Password must contain uppercase, lowercase, number, and special character.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.resetPassword({
        email,
        resetCode,
        newPassword,
        confirmPassword,
      }) as unknown as { message: string };

      setAlert({
        type: 'success',
        message: response.message || 'Password reset successful. Redirecting to login...',
      });

      sessionStorage.removeItem('resetPasswordEmail');
      setTimeout(() => router.push('/login'), 1800);
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Unable to reset your password.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Atur Ulang Kata Sandi</h1>
        <p className="text-gray-600 text-center mb-6">Enter the code sent to your email and set a new password</p>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <span className="font-semibold">Email:</span> {email || 'Loading...'}
          </div>

          <Input
            label="Reset Code"
            type="text"
            value={resetCode}
            onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            maxLength={6}
            required
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            Password must include: uppercase, lowercase, number, and special character.
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full">
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
}
