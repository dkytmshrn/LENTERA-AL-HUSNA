'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Alert } from '@/components/Common/Alert';
import { useProtectedRoute } from '@/hooks/useAuth';
import { authApi } from '@/lib/api';

const barColors = ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-indigo-500', 'bg-rose-500', 'bg-cyan-500'];

export default function PrincipalReportsPage() {
  const { isAuthenticated } = useProtectedRoute();
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    void authApi.admin.principalReports()
      .then(setReport)
      .catch((reason: any) => setError(reason.message || 'Gagal memuat laporan sekolah.'));
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const performance = report?.performance;
  const organizationCards = report ? [
    ['Siswa Aktif', report.organization.students, 'bg-blue-50 text-blue-800'],
    ['Guru Aktif', report.organization.teachers, 'bg-emerald-50 text-emerald-800'],
    ['Kelas', report.organization.classrooms, 'bg-amber-50 text-amber-800'],
    ['Mata Pelajaran', report.organization.subjects, 'bg-indigo-50 text-indigo-800'],
    ['Ujian Disetujui', report.organization.approvedExaminations, 'bg-purple-50 text-purple-800'],
  ] : [];

  return (
    <AppShell title="Laporan Sekolah">
      <main className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-blue-600">MTS AL-HUSNA LENTERA</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Laporan Sekolah</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Panel ringkasan untuk memahami perkembangan akademik sekolah.</p>
        </header>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {!report ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-[var(--muted)]">Memuat laporan...</div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {organizationCards.map(([label, value, color]) => (
                <div key={String(label)} className={`rounded-xl p-5 ${color}`}>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="mt-2 text-3xl font-bold">{value}</p>
                </div>
              ))}
            </div>

            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Indikator utama</p>
                  <h2 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">Performa Nilai Siswa</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">Ringkasan seluruh hasil ujian yang telah dikumpulkan.</p>
                </div>
                <div className="rounded-xl bg-blue-50 px-6 py-4 text-center"><p className="text-4xl font-bold text-blue-700">{performance.averageScore}%</p><p className="text-sm text-blue-700">Rata-rata sekolah</p></div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-4"><p className="text-sm text-gray-500">Ujian Dikumpulkan</p><p className="mt-1 text-2xl font-bold text-gray-900">{performance.submittedAttempts}</p></div>
                <div className="rounded-lg bg-green-50 p-4"><p className="text-sm text-green-700">Lulus</p><p className="mt-1 text-2xl font-bold text-green-800">{performance.passed}</p></div>
                <div className="rounded-lg bg-red-50 p-4"><p className="text-sm text-red-700">Belum Lulus</p><p className="mt-1 text-2xl font-bold text-red-800">{performance.failed}</p></div>
                <div className="rounded-lg bg-blue-50 p-4"><p className="text-sm text-blue-700">Persentase Lulus</p><p className="mt-1 text-2xl font-bold text-blue-800">{performance.passRate}%</p></div>
              </div>
              <div className="mt-6 h-4 overflow-hidden rounded-full bg-red-100"><div className="h-full bg-green-500 transition-all" style={{ width: `${performance.passRate}%` }} /></div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Apresiasi</p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">Performa Terbaik</h2>
                <div className="mt-4 space-y-3">
                  {performance.mostSuccessfulClass && <div className="rounded-lg bg-emerald-50 p-4"><p className="text-xs text-emerald-700">Kelas paling berhasil</p><p className="mt-1 text-lg font-semibold text-emerald-900">{performance.mostSuccessfulClass.label}</p><p className="text-sm text-emerald-700">Rata-rata {performance.mostSuccessfulClass.averageScore}% • Kelulusan {performance.mostSuccessfulClass.passRate}%</p></div>}
                  {performance.mostSuccessfulSubject && <div className="rounded-lg bg-blue-50 p-4"><p className="text-xs text-blue-700">Mata pelajaran terbaik</p><p className="mt-1 text-lg font-semibold text-blue-900">{performance.mostSuccessfulSubject.subjectName}</p><p className="text-sm text-blue-700">Rata-rata {performance.mostSuccessfulSubject.averageScore}% dari {performance.mostSuccessfulSubject.attempts} ujian</p></div>}
                </div>
              </section>
              <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Perbandingan kelas</p><h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">Kinerja Semua Kelas</h2><div className="mt-4 space-y-3">{(performance.classStats || []).map((item: any, index: number) => <div key={item.id} className="rounded-lg border border-[var(--border)] p-3"><div className="flex items-center justify-between gap-3"><span className="font-medium text-[var(--foreground)]">{index + 1}. {item.label}</span><strong className="text-blue-600">{item.averageScore}%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200"><div className="h-full bg-blue-600" style={{ width: `${item.averageScore}%` }} /></div><p className="mt-1 text-xs text-[var(--muted)]">{item.submittedAttempts} ujian • kelulusan {item.passRate}%</p></div>)}</div></section>
            </div>

            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Analisis mata pelajaran</p><h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">Nilai Mata Pelajaran</h2><p className="mt-1 text-sm text-[var(--muted)]">Diagram batang menunjukkan rata-rata persentase seluruh ujian per mata pelajaran.</p></div><div className="flex items-center gap-3 text-xs text-[var(--muted)]"><span>0%</span><span>50%</span><span>100%</span></div></div>
              <div className="mt-6 space-y-5">{(performance.subjectStats || []).map((item: any, index: number) => <div key={item.subjectName}><div className="mb-2 flex items-center justify-between gap-3"><div><span className="font-semibold text-[var(--foreground)]">{index + 1}. {item.subjectName}</span><span className="ml-2 text-xs text-[var(--muted)]">{item.attempts} ujian</span></div><strong className="text-sm text-indigo-700">{item.averageScore}%</strong></div><div className="h-8 overflow-hidden rounded-lg bg-gray-100"><div className={`flex h-full items-center rounded-lg px-3 text-xs font-semibold text-white transition-all ${barColors[index % barColors.length]}`} style={{ width: `${Math.max(4, Math.min(100, item.averageScore))}%` }}>{item.averageScore >= 15 ? `${item.averageScore}%` : ''}</div></div></div>)}{(!performance.subjectStats || performance.subjectStats.length === 0) && <p className="text-sm text-[var(--muted)]">Belum ada data nilai mata pelajaran.</p>}</div>
            </section>
          </>
        )}
      </main>
    </AppShell>
  );
}
