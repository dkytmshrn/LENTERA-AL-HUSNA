'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/Common/Input';
import { Button } from '@/components/Common/Button';
import { Alert } from '@/components/Common/Alert';
import { authApi, saveTokens, saveUserSession } from '@/lib/api';
import { useRedirectIfAuthenticated } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const isReady = useRedirectIfAuthenticated();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      saveUserSession(undefined);
      const response = await authApi.login(email, password);

      if (response.requirePasswordChange) {
        // First login - need to change password
        if (response.accountId) {
          sessionStorage.setItem('accountId', response.accountId);
          sessionStorage.setItem('tempPassword', password);
          setAlert({
            type: 'success',
            message: 'Login successful! Redirecting to password change...',
          });
          setTimeout(() => {
            router.push('/change-password');
          }, 1500);
        }
      } else {
        // Normal login
        if (response.accessToken && response.refreshToken) {
          saveTokens(response.accessToken, response.refreshToken);
          saveUserSession(response.user);
          setAlert({
            type: 'success',
            message: 'Login successful! Redirecting to dashboard...',
          });
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      }
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Login failed. Please check your credentials.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-md mx-auto bg-[var(--surface)] rounded-lg shadow-lg p-8 border border-[var(--border)]">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2 text-center">Selamat Datang Kembali</h1>
        <p className="text-[var(--muted)] text-center mb-6">Masuk ke akun LENTERA Anda</p>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Alamat Email"
            type="email"
            placeholder="Masukkan alamat email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Kata Sandi"
            type="password"
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
          >
            Masuk
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          <p className="text-center text-gray-600">
            <a href="/forgot-password" className="text-blue-600 hover:underline text-sm">
              Lupa kata sandi?
            </a>
          </p>
          <p className="text-center text-gray-600">
            Belum memiliki akun?{' '}
            <a href="/register" className="text-blue-600 hover:underline font-semibold">
              Daftar di sini
            </a>
          </p>
        </div>

        <div className="mt-6 p-4 bg-[var(--surface-strong)] border border-[var(--border)] rounded-lg">
          <p className="text-sm text-[var(--foreground)]">
            💡 <span className="font-semibold">Tips:</span> Gunakan email terdaftar dan kata sandi yang dibuat saat pendaftaran.
          </p>
        </div>
      </div>
    </div>
  );
}
