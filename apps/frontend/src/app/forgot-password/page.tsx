'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/Common/Input';
import { Button } from '@/components/Common/Button';
import { Alert } from '@/components/Common/Alert';
import { authApi } from '@/lib/api';
import { useRedirectIfAuthenticated } from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const isReady = useRedirectIfAuthenticated();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
    setIsLoading(true);
    setAlert(null);

    try {
      const response = await authApi.forgotPassword(email);
      sessionStorage.setItem('resetPasswordEmail', email);
      if (response.resetCode) {
        sessionStorage.setItem('resetPasswordCode', response.resetCode);
      }
      setAlert({
        type: 'success',
        message:
          response.resetCode
            ? `${response.message} Dev code: ${response.resetCode}`
            : response.message || 'Password reset code sent to your email.',
      });

      setTimeout(() => {
        router.push('/reset-password');
      }, 1500);
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Unable to send reset code.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Lupa Kata Sandi</h1>
        <p className="text-gray-600 text-center mb-6">Enter your email to receive a reset code</p>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button type="submit" isLoading={isLoading} className="w-full">
            Send Reset Code
          </Button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Remember your password?{' '}
          <a href="/login" className="text-blue-600 hover:underline font-semibold">
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}
