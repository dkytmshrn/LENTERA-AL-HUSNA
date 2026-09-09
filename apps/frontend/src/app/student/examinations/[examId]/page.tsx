'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { Alert } from '@/components/Common/Alert';
import { Button } from '@/components/Common/Button';
import { useProtectedRoute } from '@/hooks/useAuth';
import { authApi } from '@/lib/api';

export default function LiveExaminationPage() {
  const { isAuthenticated } = useProtectedRoute();
  const params = useParams<{ examId: string }>();
  const examId = params?.examId || '';
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [windowBlurred, setWindowBlurred] = useState(false);
  const [lounge, setLounge] = useState<any>(null);

  useEffect(() => {
    const preventCheatingActions = (event: Event) => event.preventDefault();
    const preventShortcuts = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ['c', 'x', 's', 'p', 'u'].includes(event.key.toLowerCase())) event.preventDefault();
      if (event.key === 'PrintScreen') event.preventDefault();
    };
    const handleBlur = () => setWindowBlurred(true);
    const handleFocus = () => setWindowBlurred(false);
    document.addEventListener('contextmenu', preventCheatingActions);
    document.addEventListener('copy', preventCheatingActions);
    document.addEventListener('cut', preventCheatingActions);
    document.addEventListener('selectstart', preventCheatingActions);
    document.addEventListener('keydown', preventShortcuts);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('contextmenu', preventCheatingActions);
      document.removeEventListener('copy', preventCheatingActions);
      document.removeEventListener('cut', preventCheatingActions);
      document.removeEventListener('selectstart', preventCheatingActions);
      document.removeEventListener('keydown', preventShortcuts);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !examId) return;
    void authApi.student.startExamination(examId).then((data) => {
      setSession(data);
      setLounge(data.lounge ? data : null);
      setAnswers(data.attempt?.answers || {});
    }).catch((reason: any) => setError(reason.message || 'Unable to open this examination.'));
  }, [isAuthenticated, examId]);

  useEffect(() => {
    if (!lounge?.startAt) return;
    const timer = window.setInterval(() => {
      if (Date.now() >= new Date(lounge.startAt).getTime()) {
        void authApi.student.startExamination(examId).then((data) => {
          setSession(data);
          setLounge(data.lounge ? data : null);
          setAnswers(data.attempt?.answers || {});
        }).catch((reason: any) => setError(reason.message || 'Ujian belum dapat dibuka.'));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [examId, lounge?.startAt]);

  useEffect(() => {
    if (!session?.endAt) return;
    const update = () => setRemaining(Math.max(0, new Date(session.endAt).getTime() - Date.now()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [session?.endAt]);

  const timeLabel = useMemo(() => {
    const seconds = Math.floor(remaining / 1000);
    return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }, [remaining]);

  const changeAnswer = (questionId: string, value: unknown) => {
    const next = { ...answers, [questionId]: value };
    setAnswers(next);
    void authApi.student.saveAnswers(examId, { [questionId]: value }).catch((reason: any) => setError(reason.message || 'Answer could not be saved.'));
  };

  const submit = async () => {
    setIsSubmitting(true);
    try {
      await authApi.student.submitExamination(examId);
      router.replace('/student/examinations');
    } catch (reason: any) {
      setError(reason.message || 'Examination could not be submitted.');
    } finally { setIsSubmitting(false); }
  };

  if (!isAuthenticated) return null;
  return <AppShell title="Ujian Berlangsung"><div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--background)] p-4 select-none lg:p-8">
    {error && <Alert type="error" message={error} onClose={() => setError('')} />}
    {lounge && <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center"><div className="w-full rounded-2xl border border-blue-200 bg-[var(--surface)] p-8 text-center shadow-xl"><div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-blue-100" /><h1 className="mt-5 text-2xl font-bold text-[var(--foreground)]">Ruang Tunggu Ujian</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Ujian akan terbuka tepat pada waktu mulai. Silakan tetap berada di halaman ini.</p><p className="mt-5 font-mono text-2xl font-bold text-blue-700">{timeLabel}</p></div></div>}
    {session && !lounge && <><div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4"><div><h1 className="font-semibold text-red-900">{session.exam.title}</h1><p className="text-sm text-red-700">Ujian berakhir sesuai waktu yang telah ditentukan.</p></div><div className="font-mono text-xl font-bold text-red-900">{timeLabel}</div></div><p className="my-3 text-xs text-[var(--muted)]">Poin setiap soal ditampilkan. Jangan meninggalkan halaman selama ujian berlangsung.</p>{windowBlurred && <div className="mb-3 rounded-lg bg-amber-100 p-3 text-sm text-amber-900">Perhatian: fokus halaman ujian berubah. Kembali ke halaman ujian untuk melanjutkan.</div>}<div className="mx-auto max-w-4xl space-y-4">{session.questions.map((question: any, index: number) => <section key={question.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"><div className="mb-3 flex items-start justify-between gap-3"><h2 className="font-semibold text-[var(--foreground)]">{index + 1}. {question.questionText || 'Soal'}</h2><span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{question.points || 1} poin</span></div>{question.questionImageUrl && <img src={question.questionImageUrl} alt="Ilustrasi soal" draggable="false" className="mt-3 max-h-64 max-w-full object-contain" />}{question.type === 'multiple_choice' ? <div className="mt-4 space-y-2">{question.options.map((option: any, optionIndex: number) => <label key={`${question.id}-${optionIndex}`} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] p-3"><input type="radio" name={question.id} checked={String(answers[question.id]) === String(optionIndex)} onChange={() => changeAnswer(question.id, optionIndex)} />{option.imageUrl && <img src={option.imageUrl} alt="Pilihan jawaban" draggable="false" className="max-h-20 max-w-full object-contain" />}<span>{option.text || 'Pilihan bergambar'}</span></label>)}</div> : <textarea value={String(answers[question.id] || '')} onChange={(event) => changeAnswer(question.id, event.target.value)} className="mt-4 w-full select-text rounded-lg border border-[var(--border)] bg-[var(--background)] p-3" rows={4} placeholder="Tulis jawaban Anda" />}</section>)}</div><div className="mx-auto flex max-w-4xl justify-end py-5"><Button type="button" onClick={() => void submit()} isLoading={isSubmitting}>Kumpulkan Ujian</Button></div></>}
    {!session && !error && <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-[var(--muted)]">Membuka ujian...</div>}
  </div></AppShell>;
}
