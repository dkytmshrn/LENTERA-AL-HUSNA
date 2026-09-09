'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/Common/Input';
import { Button } from '@/components/Common/Button';
import { Alert } from '@/components/Common/Alert';
import { authApi, saveTokens, getTokens } from '@/lib/api';

interface PasswordStrength {
  level: 'weak' | 'fair' | 'good' | 'strong';
  score: number;
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const [accountId, setAccountId] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    level: 'weak',
    score: 0,
  });

  function calculatePasswordStrength(password: string): PasswordStrength {
    let score = 0;

    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 15;
    if (/[@$!%*?&]/.test(password)) score += 15;

    let level: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
    if (score >= 70) level = 'strong';
    else if (score >= 50) level = 'good';
    else if (score >= 30) level = 'fair';

    return { level, score: Math.min(100, score) };
  }

  useEffect(() => {
    // Check if already logged in with a valid token (shouldn't access this page)
    const { accessToken } = getTokens();
    if (accessToken) {
      router.replace('/dashboard');
      return;
    }

    // Check if accountId is in session (required for first login flow)
    const id = sessionStorage.getItem('accountId');
    if (!id) {
      router.replace('/login');
      return;
    }

    setAccountId(id);
    setIsInitializing(false);
  }, [router]);

  useEffect(() => {
    const strength = calculatePasswordStrength(newPassword);
    setPasswordStrength(strength);
  }, [newPassword]);

  // Show loading while checking session
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'strong':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'fair':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  const validatePassword = (): string[] => {
    const errors: string[] = [];

    if (newPassword.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(newPassword)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(newPassword)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(newPassword)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[@$!%*?&]/.test(newPassword)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    if (newPassword !== confirmPassword) {
      errors.push('Passwords do not match');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const errors = validatePassword();
    if (errors.length > 0) {
      setAlert({
        type: 'error',
        message: errors[0],
      });
      return;
    }

    setIsLoading(true);

    try {
      await authApi.changePassword(accountId, {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setAlert({
        type: 'success',
        message: 'Password changed successfully! Redirecting to login...',
      });

      setTimeout(() => {
        sessionStorage.removeItem('accountId');
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to change password. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Ubah Kata Sandi</h1>
        <p className="text-gray-600 text-center mb-6">Set a new password for your account</p>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter your current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-900 mb-1">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
            
            {newPassword && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Password Strength</span>
                  <span className="text-xs font-semibold text-gray-600">{passwordStrength.level}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getStrengthColor(passwordStrength.level)}`}
                    style={{ width: `${passwordStrength.score}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-semibold mb-2">Password Requirements:</p>
            <ul className="space-y-1 text-xs">
              <li>✓ Minimum 8 characters</li>
              <li>✓ At least one uppercase letter (A-Z)</li>
              <li>✓ At least one lowercase letter (a-z)</li>
              <li>✓ At least one number (0-9)</li>
              <li>✓ At least one special character (@$!%*?&)</li>
            </ul>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
          >
            Change Password
          </Button>
        </form>
      </div>
    </div>
  );
}
