'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Alert } from '@/components/Common/Alert';
import { useProtectedRoute } from '@/hooks/useAuth';
import { authApi } from '@/lib/api';

export default function TeacherAssignmentsPage() {
  const { isAuthenticated } = useProtectedRoute();
  const [data, setData] = useState<{ examinations: any[]; results: any[] }>({ examinations: [], results: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    void authApi.admin.teacherAssignments()
      .then((response) => setData(response))
      .catch((reason: any) => setError(reason.message || 'Failed to load assignments.'))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <AppShell title="Tugas">
      <div className="mx-auto max-w-6xl space-y-6">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Tugas dan Hasil Ujian</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Ujian dari mata pelajaran yang Anda ajarkan.</p>
        </div>
        {isLoading ? <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-[var(--muted)]">Memuat tugas...</div> : (
          <>
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Ujian Mendatang</h2>
              {data.examinations.length === 0 ? <p className="text-sm text-[var(--muted)]">No examinations are assigned to your subjects.</p> : <div className="space-y-3">{data.examinations.map((exam) => <article key={exam.id} className="rounded-lg border border-[var(--border)] p-4"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-semibold text-[var(--foreground)]">{exam.title}</h3><p className="text-sm text-[var(--muted)]">{exam.subjectName} • Grade {exam.gradeLevel}</p></div><span className="text-sm text-[var(--muted)]">{exam.examDate || 'Date not set'}</span></div><p className="mt-2 text-sm text-[var(--muted)]">{exam.examType || 'Examination'}{exam.examStartTime ? ` • ${exam.examStartTime}${exam.examEndTime ? ` - ${exam.examEndTime}` : ''}` : ''}</p></article>)}</div>}
            </section>
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Hasil Ujian</h2>
              {data.results.length === 0 ? <p className="text-sm text-[var(--muted)]">No examination results are available yet.</p> : <p className="text-sm text-[var(--muted)]">{data.results.length} result records available.</p>}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
