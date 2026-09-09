'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/Common/Input';
import { Button } from '@/components/Common/Button';
import { Alert } from '@/components/Common/Alert';
import { authApi, getTokens } from '@/lib/api';

const RESEND_DELAYS = [60, 120, 300, 600, 3600, 7200];

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [registrationRequestId, setRegistrationRequestId] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  useEffect(() => {
    const { accessToken } = getTokens();
    if (accessToken) {
      router.replace('/dashboard');
      return;
    }

    const storedEmail = sessionStorage.getItem('registrationEmail');
    const storedCode = sessionStorage.getItem('verificationCode');
    const storedRegistrationId = sessionStorage.getItem('registrationId');
    const storedRegistrationRequestId = sessionStorage.getItem('registrationRequestId');

    if (storedEmail) {
      setEmail(storedEmail);
      const resolvedRegistrationId = storedRegistrationRequestId || storedRegistrationId || '';
      if (resolvedRegistrationId) {
        setRegistrationRequestId(resolvedRegistrationId);
      }
      if (storedCode) {
        setOtp(storedCode);
      }
      setIsInitializing(false);
      return;
    }

    router.replace('/register');
  }, [router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    try {
      await authApi.verifyEmail(email, otp, registrationRequestId || undefined);
      setAlert({
        type: 'success',
        message: 'Email verified successfully! Please wait for admin approval.',
      });

      sessionStorage.setItem('emailVerified', 'true');

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Email verification failed. Please check your OTP.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || resendCooldown > 0) return;

    setIsResending(true);
    setAlert(null);

    try {
      const response = await authApi.resendVerificationEmail(email);
      const nextDelay = response.cooldownSeconds ?? RESEND_DELAYS[Math.min(resendCount, RESEND_DELAYS.length - 1)];

      if (response.verificationCode && process.env.NEXT_PUBLIC_NODE_ENV !== 'production') {
        setOtp(response.verificationCode);
        sessionStorage.setItem('verificationCode', response.verificationCode);
      }

      setResendCooldown(nextDelay || 60);
      setResendCount((prev) => prev + 1);

      setAlert({
        type: 'success',
        message: response.message || 'A new OTP has been sent to your email.',
      });
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Unable to resend the OTP right now.',
      });

      if (error.status === 429 && error.errors) {
        const numericMatch = String(error.errors).match(/(\d+)/);
        if (numericMatch) {
          setResendCooldown(Number(numericMatch[1]));
        }
      }
    } finally {
      setIsResending(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-md mx-auto bg-[var(--surface)] rounded-lg shadow-lg p-8 border border-[var(--border)]">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2 text-center">Verify Email</h1>
        <p className="text-[var(--muted)] text-center mb-6">
          Enter the OTP code sent to your email
        </p>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[var(--surface-strong)] p-4 rounded-lg mb-6 border border-[var(--border)]">
            <p className="text-sm text-[var(--foreground)]">
              <span className="font-semibold">Email:</span> {email}
            </p>
          </div>

          <Input
            label="Verification Code (OTP)"
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            required
            helpText="Check your email for the OTP code (6 digits)"
          />

          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full"
          >
            Verify Email
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <span className="text-[var(--muted)]">
            {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Need a new code?'}
          </span>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending || resendCooldown > 0}
            className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2 disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed transition-colors"
          >
            {isResending ? 'Sending...' : resendCooldown > 0 ? `Wait ${resendCooldown}s` : 'Resend'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-[var(--surface-strong)] border border-[var(--border)] rounded-lg">
          <p className="text-sm text-[var(--foreground)]">
            💡 <span className="font-semibold">Note:</span> After verification, your registration will be reviewed by an administrator. You'll receive an email once approved.
          </p>
        </div>

        <p className="text-center text-[var(--muted)] mt-6">
          <a href="/register" className="text-blue-600 hover:underline font-semibold">
            Back to Registration
          </a>
        </p>
      </div>
    </div>
  );
}
