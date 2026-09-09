'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Alert } from '@/components/Common/Alert';
import { Button } from '@/components/Common/Button';
import { useProtectedRoute } from '@/hooks/useAuth';
import { authApi } from '@/lib/api';

export default function StudentReportCardPage() {
  const { isAuthenticated } = useProtectedRoute();
  const [report, setReport] = useState<any>(null);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setError('');
    void authApi.student.reportCard(selectedGrade || undefined)
      .then(setReport)
      .catch((reason: any) => setError(reason.message || 'Gagal memuat rapor.'));
  }, [isAuthenticated, selectedGrade]);

  const download = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(authApi.student.reportCardPdfUrl(selectedGrade || undefined), { credentials: 'include' });
      if (!response.ok) throw new Error('Gagal mengunduh rapor.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `rapor-mts-al-husna-lentera${selectedGrade ? `-tingkat-${selectedGrade}` : ''}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason: any) {
      setError(reason.message || 'Gagal mengunduh rapor.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <AppShell title="Rapor Saya">
      <div className="mx-auto max-w-6xl space-y-6">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-blue-600 text-2xl font-bold text-blue-600">L</div><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-blue-600">MTS AL-HUSNA LENTERA</p><h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Rapor Saya</h1><p className="mt-1 text-sm text-[var(--muted)]">Nilai dirangkum per mata pelajaran berdasarkan seluruh ujian yang telah dikerjakan.</p></div></div>
          <Button type="button" onClick={() => void download()} isLoading={isDownloading}>Unduh PDF</Button>
        </div>
        {!report ? <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-[var(--muted)]">Memuat rapor...</div> : <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"><label htmlFor="report-grade" className="text-sm font-semibold text-[var(--foreground)]">Tingkat rapor</label><select id="report-grade" value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"><option value="">Semua tingkat</option>{(report.availableGrades || []).map((grade: string) => <option key={grade} value={grade}>Tingkat {grade}</option>)}</select><span className="text-sm text-[var(--muted)]">Menampilkan {report.rows?.length || 0} mata pelajaran</span></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{(report.rows || []).map((subject: any) => <article key={`${subject.gradeLevel}-${subject.subjectName}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Tingkat {subject.gradeLevel}</p><h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">{subject.subjectName}</h2></div><div className="text-right"><p className="text-2xl font-bold text-blue-600">{Number(subject.score).toFixed(2)}%</p><p className="text-xs text-[var(--muted)]">nilai mata pelajaran</p></div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, Number(subject.score) || 0))}%` }} /></div><div className="mt-4 flex justify-between text-sm text-[var(--muted)]"><span>Total perolehan</span><strong className="text-[var(--foreground)]">{subject.rawScore} / {subject.maxScore}</strong></div><div className="mt-4 border-t border-[var(--border)] pt-3"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Rincian ujian</p><div className="mt-2 space-y-2">{(subject.examinations || []).map((exam: any, index: number) => <div key={`${exam.examTitle}-${index}`} className="flex items-center justify-between gap-2 text-sm"><span className="truncate text-[var(--foreground)]">{exam.examTitle}</span><span className="shrink-0 text-[var(--muted)]">{Number(exam.score).toFixed(2)}%</span></div>)}</div></div></article>)}</div>{(!report.rows || report.rows.length === 0) && <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">Belum ada nilai untuk tingkat ini.</div>}
        </>}
      </div>
    </AppShell>
  );
}
