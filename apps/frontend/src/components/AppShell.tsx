'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authApi, clearTokens } from '@/lib/api';
import logo from '@/app/logo-al-husna.png';

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [role, setRole] = useState('Guest');
  const [badge, setBadge] = useState('');

  useEffect(() => {
    const syncRole = () => {
      const storedRole = localStorage.getItem('userRole') || 'Guest';
      setRole(storedRole);
      setBadge(localStorage.getItem('userBadge') || '');
    };

    syncRole();
    window.addEventListener('auth-state-changed', syncRole);
    window.addEventListener('storage', syncRole);

    return () => {
      window.removeEventListener('auth-state-changed', syncRole);
      window.removeEventListener('storage', syncRole);
    };
  }, []);

  useEffect(() => {
    if (role !== 'Student' || !pathname || /^\/student\/examinations\/[^/]+$/.test(pathname)) return;
    void authApi.student.examinations().then((examinations) => {
      const active = examinations.find((exam: any) => exam.availability === 'in_progress');
      if (active) router.replace(`/student/examinations/${active.id}`);
    }).catch(() => undefined);
  }, [role, pathname, router]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue logout even if API call fails
    }
    clearTokens();
    router.push('/login');
  };

  const menuItems = {
    SysAdmin: [
      { label: 'Beranda', href: '/dashboard', icon: 'dashboard' },
      { label: 'Permohonan Pendaftaran', href: '/admin/registration-requests', icon: 'clipboard' },
      { label: 'Manajemen Pengguna', href: '/admin/users', icon: 'users' },
      { label: 'Manajemen Kurikulum', href: '/admin/curriculums', icon: 'book' },
      { label: 'Kelola Mata Pelajaran', href: '/admin/subjects', icon: 'book' },
      { label: 'Manajemen Ujian', href: '/admin/examinations', icon: 'clipboard' },
      { label: 'Manajemen Kelas', href: '/admin/classrooms', icon: 'school' },
    ],
    Principal: [
      { label: 'Laporan Sekolah', href: '/principal/reports', icon: 'chart' },
      { label: 'Manajemen Kurikulum', href: '/admin/curriculums', icon: 'book' },
      { label: 'Kelola Mata Pelajaran', href: '/admin/subjects', icon: 'book' },
      { label: 'Manajemen Ujian', href: '/admin/examinations', icon: 'clipboard' },
    ],
    Teacher: [
      { label: 'Beranda', href: '/dashboard', icon: 'dashboard' },
      { label: 'Kelola Mata Pelajaran', href: '/admin/subjects', icon: 'book' },
      { label: 'Manajemen Ujian', href: '/admin/examinations', icon: 'clipboard' },
      { label: 'Kelas Saya', href: '/teacher/classes', icon: 'book' },
      { label: 'Tugas', href: '/teacher/assignments', icon: 'clipboard' },
    ],
    Student: [
      { label: 'Beranda', href: '/dashboard', icon: 'dashboard' },
      { label: 'Ujian', href: '/student/examinations', icon: 'clipboard' },
      { label: 'Mata Pelajaran', href: '/student/subjects', icon: 'book' },
      { label: 'Nilai Saya', href: '/student/report-card', icon: 'chart' },
    ],
    Guest: [
      { label: 'Masuk', href: '/login', icon: 'login' },
      { label: 'Daftar', href: '/register', icon: 'user' },
    ],
  };

  const rawItems = menuItems[role as keyof typeof menuItems] || menuItems.Guest;
  const items = role === 'Teacher' && !badge.split(',').some((item) => item.trim().toLowerCase() === 'wali kelas')
    ? rawItems.filter((item) => item.label !== 'Kelas Saya')
    : rawItems;

  const renderMenuIcon = (icon: string) => {
    const commonProps = {
      className: 'h-5 w-5 shrink-0',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
      strokeWidth: 1.8,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
    };

    switch (icon) {
      case 'dashboard':
        return (
          <svg {...commonProps}>
            <path d="M3 12.75V5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v7.25M3 12.75h18M9 12.75V21m6-8.25V21" />
          </svg>
        );
      case 'clipboard':
        return (
          <svg {...commonProps}>
            <path d="M9 4h6a2 2 0 0 1 2 2v1H7V6a2 2 0 0 1 2-2Zm-3 4h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
            <path d="M9 11h6M9 15h6" />
          </svg>
        );
      case 'users':
        return (
          <svg {...commonProps}>
            <path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
            <circle cx="10" cy="7" r="3" />
            <path d="M20 19v-1a4 4 0 0 0-3-3.87M16 4a3 3 0 0 1 0 6" />
          </svg>
        );
      case 'chart':
        return (
          <svg {...commonProps}>
            <path d="M4 18V6M10 18V10M16 18V4M22 18V8" />
          </svg>
        );
      case 'book':
        return (
          <svg {...commonProps}>
            <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v15H6.5A2.5 2.5 0 0 0 4 21.5V6.5Z" />
            <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20" />
            <path d="M8 8h8M8 12h8" />
          </svg>
        );
      case 'school':
        return (
          <svg {...commonProps}>
            <path d="M3 10l9-6 9 6-9 6-9-6Z" />
            <path d="M7 12v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-5" />
            <path d="M12 16v-4" />
          </svg>
        );
      case 'login':
        return (
          <svg {...commonProps}>
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
          </svg>
        );
      case 'user':
        return (
          <svg {...commonProps}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20a8 8 0 0 1 16 0" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={[
            'fixed inset-y-0 left-0 z-40 border-r border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:self-start lg:inset-y-auto lg:left-auto lg:translate-x-0 lg:overflow-hidden',
            menuOpen ? 'translate-x-0' : '-translate-x-full',
            sidebarCollapsed ? 'lg:w-20' : 'w-72 lg:w-72',
          ].filter(Boolean).join(' ')}
        >
          <div className="flex h-full min-h-screen flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <Link
                href={role === 'Principal' ? '/principal/reports' : role !== 'Guest' ? '/dashboard' : '/'}
                onClick={() => setMenuOpen(false)}
                className={`text-xl font-bold text-blue-600 transition-all duration-300 ${sidebarCollapsed ? 'lg:opacity-0 lg:hidden' : ''}`}
              >
                <span className="flex items-center gap-2"><Image src={logo} alt="Al-Husna logo" width={32} height={32} className="h-8 w-8 object-contain" priority unoptimized /><span className="leading-tight"><span className="block">LENTERA</span><span className="block text-[10px] tracking-[.18em] text-[var(--muted)]">AL HUSNA</span></span></span>
              </Link>

              <button
                type="button"
                className="rounded-md border border-[var(--border)] p-2 text-[var(--foreground)] transition hover:bg-[var(--border)]"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg
                  className={`h-4 w-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                type="button"
                className="rounded-md border border-[var(--border)] px-2 py-1 lg:hidden"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="mt-6 flex-1 space-y-2">
              {items.map((item) => (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--border)] hover:text-[var(--foreground)] ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="flex items-center justify-center">{renderMenuIcon(item.icon)}</span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </nav>

          </div>
        </aside>

        {/* Main content */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="rounded-md border border-[var(--border)] p-2 transition hover:bg-[var(--border)] lg:hidden"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-label="Toggle menu"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <h1 className="text-lg font-bold">{title}</h1>
              </div>
              <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                {role}
              </div>
            </div>
          </header>

          {/* Page content */}
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
