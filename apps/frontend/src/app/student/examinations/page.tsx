'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { Alert } from '@/components/Common/Alert';
import { useProtectedRoute } from '@/hooks/useAuth';
import { authApi } from '@/lib/api';

export default function StudentExaminationsPage() {
  const { isAuthenticated } = useProtectedRoute();
  const router = useRouter();
  const [examinations, setExaminations] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    void authApi.student.examinations().then((items) => {
      setExaminations(items);
      const active = items.find((item) => item.availability === 'in_progress');
      if (active) router.replace(`/student/examinations/${active.id}`);
    }).catch((reason: any) => setError(reason.message || 'Failed to load examinations.'));
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;
  return <AppShell title="Ujian"><div className="mx-auto max-w-5xl space-y-5">
    {error && <Alert type="error" message={error} onClose={() => setError('')} />}
    <div><h1 className="text-2xl font-semibold text-[var(--foreground)]">Ujian Saya</h1><p className="mt-1 text-sm text-[var(--muted)]">Ujian yang telah disetujui tersedia sepuluh menit sebelum waktu mulai.</p></div>
    <div className="space-y-3">{examinations.map((exam) => <article key={exam.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-semibold text-[var(--foreground)]">{exam.title}</h2><p className="mt-1 text-sm text-[var(--muted)]">{exam.examType} • {exam.examDate || 'Tanggal belum ditentukan'} • {exam.examStartTime || '--'} - {exam.examEndTime || '--'}</p></div>{exam.availability === 'open' ? <Link href={`/student/examinations/${exam.id}`} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Buka Ujian</Link> : <span className="rounded-lg bg-[var(--background)] px-3 py-2 text-sm text-[var(--muted)]">{exam.availability === 'completed' ? 'Sudah dikerjakan' : exam.availability === 'passed' ? 'Ditutup' : exam.availability === 'upcoming' ? 'Belum dibuka' : 'Tidak tersedia'}</span>}</div></article>)}{examinations.length === 0 && <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-[var(--muted)]">Belum ada ujian yang disetujui.</div>}</div>
  </div></AppShell>;
}
