'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { Alert } from '@/components/Common/Alert';
import { useProtectedRoute } from '@/hooks/useAuth';
import { authApi } from '@/lib/api';

export default function TeacherClassesPage() {
  const { isAuthenticated } = useProtectedRoute();
  const router = useRouter();
  const [classroom, setClassroom] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    void authApi.admin.teacherClassroom()
      .then((data) => {
        if (!data) {
          router.replace('/dashboard');
          return;
        }
        setClassroom(data);
      })
      .catch((reason: any) => setError(reason.message || 'Failed to load your class.'))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <AppShell title="Kelas">
      <div className="mx-auto max-w-5xl space-y-6">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Kelas Wali Saya</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Pantau kelas yang ditetapkan kepada Anda sebagai wali kelas.</p>
        </div>
        {isLoading ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-[var(--muted)]">Memuat data kelas...</div>
        ) : !classroom ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-[var(--muted)]">You are not assigned as a homeroom teacher.</div>
        ) : (
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Grade {classroom.gradeLevel} - Class {classroom.classCode}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{classroom.academicPeriod}</p>
              </div>
              <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">{classroom.studentCount || 0} students</div>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--border)] text-[var(--muted)]"><tr><th className="px-3 py-2">Student</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Status</th></tr></thead>
                <tbody>
                  {(classroom.students || []).map((student: any) => <tr key={student.id} className="border-b border-[var(--border)] last:border-0"><td className="px-3 py-3 font-medium text-[var(--foreground)]">{student.fullName}</td><td className="px-3 py-3 text-[var(--muted)]">{student.email || '-'}</td><td className="px-3 py-3 text-[var(--muted)]">{student.status || '-'}</td></tr>)}
                </tbody>
              </table>
              {(classroom.students || []).length === 0 && <p className="py-6 text-sm text-[var(--muted)]">No students assigned to this classroom yet.</p>}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
