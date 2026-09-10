'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { authApi, clearTokens, saveUserSession } from '@/lib/api';
import logo from '@/app/logo-al-husna.png';

export function TopNav() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userBadge, setUserBadge] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      const saved = localStorage.getItem('lentera-theme');
      const dark = saved === 'dark';
      setIsDark(dark);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };

    const syncAuth = () => {
      const auth = localStorage.getItem('isAuthenticated') === 'true';
      setIsAuthenticated(auth);
      setUserName(localStorage.getItem('userFullName') || localStorage.getItem('userName') || 'User');
      setUserBadge(localStorage.getItem('userBadge') || '');
      setUserRole(localStorage.getItem('userRole') || '');
    };

    syncTheme();
    syncAuth();

    const refreshUser = async () => {
      if (localStorage.getItem('isAuthenticated') !== 'true') return;
      try {
        const user = await authApi.me();
        saveUserSession(user);
        syncAuth();
      } catch {
        // Keep the locally cached name if the profile request is unavailable.
      }
    };
    void refreshUser();

    const onStorage = () => {
      syncTheme();
      syncAuth();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('auth-state-changed', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth-state-changed', onStorage);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('lentera-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.status === 401) {
        // refresh token is invalid or expired, so clean local auth state only
      }
    } catch {
      // ignore backend logout error and still clear client session
    } finally {
      clearTokens();
      setSettingsOpen(false);
      router.push('/login');
    }
  };

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <nav className="bg-[var(--surface)] text-[var(--foreground)] shadow-sm sticky top-0 z-50 border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href={isAuthenticated ? (userRole === 'Principal' ? '/principal/reports' : '/dashboard') : '/'} className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <Image src={logo} alt="Al-Husna logo" width={40} height={40} className="h-10 w-10 object-contain" priority />
            <span className="leading-tight"><span className="block">LENTERA</span><span className="block text-[10px] tracking-[.18em] text-[var(--muted)]">AL HUSNA</span></span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => router.push('/profile')}
                  className="text-[var(--foreground)] font-semibold transition hover:text-blue-600"
                >
                  <span className="flex flex-col items-end leading-tight"><span>{userName}</span>{userBadge && <span className="text-xs font-normal text-[var(--muted)]">{userBadge}</span>}</span>
                </button>

                <div className="relative">
                  <button
                    type="button"
                    aria-label="Open settings"
                    onClick={() => setSettingsOpen((prev) => !prev)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground)] hover:opacity-90 transition"
                  >
                    ⚙️
                  </button>

                  {settingsOpen && (
                    <div className="absolute right-0 top-12 z-50 min-w-44 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg">
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-[var(--surface-strong)]"
                      >
                        <span>Tema</span>
                        <span>{isDark ? '☀️' : '🌙'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <span>Keluar</span>
                        <span>↩</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-[var(--muted)] hover:text-[var(--foreground)] font-medium transition">
                  Masuk
                </Link>
                <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition">
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
