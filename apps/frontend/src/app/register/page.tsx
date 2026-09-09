'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/Common/Input';
import { Button } from '@/components/Common/Button';
import { Alert } from '@/components/Common/Alert';
import { authApi } from '@/lib/api';
import { useRedirectIfAuthenticated } from '@/hooks/useAuth';

const generateUsernameFromRegistrationData = (fullName: string, parentName: string, birthday: string) => {
  const firstFullName = fullName.trim().split(/\s+/)[0]?.toLowerCase() || 'student';
  const firstParentName = parentName.trim().split(/\s+/)[0]?.toLowerCase() || 'parent';

  if (!birthday) {
    return `${firstFullName}.${firstParentName}.000000`;
  }

  const date = new Date(birthday);
  if (Number.isNaN(date.getTime())) {
    return `${firstFullName}.${firstParentName}.000000`;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);

  return `${firstFullName}.${firstParentName}.${day}${month}${year}`;
};

export default function RegisterPage() {
  const router = useRouter();
  const isReady = useRedirectIfAuthenticated();
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    birthday: '',
    gender: '',
    parentName: '',
    parentPhoneNumber: '',
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAlert(null);

    try {
      const generatedUsername = generateUsernameFromRegistrationData(
        formData.fullName,
        formData.parentName,
        formData.birthday,
      );

      const payload = {
        ...formData,
        name: generatedUsername,
      };

      const response = await authApi.register(payload);
      const verificationMessage = response.verificationCode
        ? `Registration successful! Dev OTP: ${response.verificationCode}`
        : 'Registration successful! Please check your email for the verification code.';

      setAlert({
        type: 'success',
        message: verificationMessage,
      });
      
      const nextRegistrationId = response.registrationRequestId || response.registrationId;

      // Store registration ID for next step
      if (nextRegistrationId) {
        sessionStorage.setItem('registrationId', nextRegistrationId);
        sessionStorage.setItem('registrationRequestId', nextRegistrationId);
        sessionStorage.setItem('registrationEmail', formData.email);
        if (response.verificationCode) {
          sessionStorage.setItem('verificationCode', response.verificationCode);
        }

        // Redirect to email verification page
        setTimeout(() => {
          router.push('/verify-email');
        }, 2000);
      }
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Registration failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-md mx-auto bg-[var(--surface)] rounded-lg shadow-lg p-8 border border-[var(--border)]">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2 text-center">Buat Akun</h1>
        <p className="text-[var(--muted)] text-center mb-6">Bergabung dengan LENTERA dan mulai perjalanan belajar Anda</p>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap"
            name="fullName"
            type="text"
            placeholder="Masukkan nama lengkap"
            value={formData.fullName}
            onChange={handleChange}
            required
          />

          <Input
            label="Alamat Email"
            name="email"
            type="email"
            placeholder="Masukkan alamat email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Nomor Telepon"
            name="phoneNumber"
            type="tel"
            placeholder="Masukkan nomor telepon"
            value={formData.phoneNumber}
            onChange={handleChange}
          />

          <Input
            label="Tanggal Lahir"
            name="birthday"
            type="date"
            value={formData.birthday}
            onChange={handleChange}
          />

          <div className="mb-4">
            <label htmlFor="gender" className="block text-sm font-medium text-gray-900 mb-1">
              Jenis Kelamin
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih jenis kelamin</option>
              <option value="Male">Laki-laki</option>
              <option value="Female">Perempuan</option>
            </select>
          </div>

          <Input
            label="Nama Orang Tua/Wali"
            name="parentName"
            type="text"
            placeholder="Masukkan nama orang tua atau wali"
            value={formData.parentName}
            onChange={handleChange}
          />

          <Input
            label="Nomor Telepon Orang Tua/Wali"
            name="parentPhoneNumber"
            type="tel"
            placeholder="Masukkan nomor telepon orang tua atau wali"
            value={formData.parentPhoneNumber}
            onChange={handleChange}
          />

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
          >
            Daftar
          </Button>
        </form>

        <p className="text-center text-[var(--muted)] mt-6">
          Sudah memiliki akun?{' '}
          <a href="/login" className="text-blue-600 hover:underline font-semibold">
            Masuk di sini
          </a>
        </p>
      </div>
    </div>
  );
}
