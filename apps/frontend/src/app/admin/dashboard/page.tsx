'use client';

import { useRouter } from 'next/navigation';
import { useProtectedRoute } from '@/hooks/useAuth';
import { AppShell } from '@/components/AppShell';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useProtectedRoute();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell title="Admin Dashboard">
      <div className="bg-[var(--background)] -m-4 lg:-m-6 p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[var(--muted)] text-center mb-12">Manage users and registration requests</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Registration Requests Card */}
          <div
            onClick={() => router.push('/admin/registration-requests')}
            className="bg-[var(--surface)] rounded-lg shadow-lg p-8 border border-[var(--border)] cursor-pointer hover:shadow-xl hover:border-blue-500 transition transform hover:scale-105"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2 text-center">
              Registration Requests
            </h2>
            <p className="text-[var(--muted)] text-center text-sm mb-4">
              Review and approve or reject new user registrations
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium">
              Manage Requests
            </button>
          </div>

          {/* Users Management Card */}
          <div
            onClick={() => router.push('/admin/users')}
            className="bg-[var(--surface)] rounded-lg shadow-lg p-8 border border-[var(--border)] cursor-pointer hover:shadow-xl hover:border-purple-500 transition transform hover:scale-105"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-2a6 6 0 0112 0v2zm0 0h6v-2a6 6 0 00-9-5.697M21 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2 text-center">
              User Management
            </h2>
            <p className="text-[var(--muted)] text-center text-sm mb-4">
              Manage users, assign roles, and update permissions
            </p>
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-medium">
              Manage Users
            </button>
          </div>

          {/* Role Management Card */}
          <div
            onClick={() => router.push('/admin/users')}
            className="bg-[var(--surface)] rounded-lg shadow-lg p-8 border border-[var(--border)] cursor-pointer hover:shadow-xl hover:border-green-500 transition transform hover:scale-105"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2 text-center">
              Role & Badge Management
            </h2>
            <p className="text-[var(--muted)] text-center text-sm mb-4">
              Assign roles and badges to users
            </p>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium">
              Manage Roles
            </button>
          </div>
        </div>
        </div>
      </div>
    </AppShell>
  );
}
