'use client';

import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Alert } from '@/components/Common/Alert';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input';
import { useProtectedRoute } from '@/hooks/useAuth';
import { authApi, CurriculumItem } from '@/lib/api';

interface LessonFormState {
  title: string;
  source: string;
  description: string;
  week: string;
  file?: File | null;
}

interface ExistingLessonFile {
  name?: string;
  size?: number;
}

export default function SubjectManagementPage() {
  const { isAuthenticated } = useProtectedRoute();
  const [curriculums, setCurriculums] = useState<CurriculumItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [lessonForm, setLessonForm] = useState<LessonFormState>({
    title: '',
    source: '',
    description: '',
    week: '',
    file: null,
  });
  const [lessons, setLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [existingLessonFile, setExistingLessonFile] = useState<ExistingLessonFile | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewLesson, setPreviewLesson] = useState<{ lessonId: string; title: string; url: string } | null>(null);
  const [youtubePlayer, setYoutubePlayer] = useState<{ title: string; url: string } | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const extractYoutubeId = (url: string): string | null => {
    if (!url) return null;
    // Support various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const loadCurriculums = async () => {
    try {
      const data = await authApi.admin.curriculums();
      const nextCurriculums = Array.isArray(data) ? data : [];
      setCurriculums(nextCurriculums);
      setSelectedSubjectId((current) => {
        if (current && nextCurriculums.some((curriculum) => curriculum.id === current)) {
          return current;
        }
        return nextCurriculums[0]?.id ?? '';
      });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to load subjects.' });
    }
  };

  const loadSubjectDetails = async (subjectId: string) => {
    if (!subjectId) {
      setLessons([]);
      return;
    }

    try {
      const lessonData = await authApi.admin.getCurriculumLessons(subjectId);
      setLessons(Array.isArray(lessonData) ? lessonData : []);
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to load subject details.' });
    }
  };

  const openPreview = async (lesson: any) => {
    if (!selectedSubjectId || !lesson?.id) return;
    try {
      const previewUrl = await authApi.admin.getCurriculumLessonPreviewUrl(selectedSubjectId, lesson.id);
      setPreviewLesson({ lessonId: lesson.id, title: lesson.title, url: previewUrl });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Unable to preview this lesson PDF.' });
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadCurriculums();
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedSubjectId) {
      void loadSubjectDetails(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  const handleSubmitLesson = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSubjectId) {
      setAlert({ type: 'error', message: 'Please select a subject first.' });
      return;
    }

    if (!lessonForm.title.trim()) {
      setAlert({ type: 'error', message: 'Lesson title is required.' });
      return;
    }

    const lessonWeeks = Number(String(lessonForm.week || '').trim());
    if (lessonForm.week && (!Number.isInteger(lessonWeeks) || lessonWeeks < 1 || lessonWeeks > 20)) {
      setAlert({ type: 'error', message: 'Lesson week must be between 1 and 20.' });
      return;
    }

    const otherLessonWeeks = lessons.reduce((total, lesson) => {
      if (lesson.id === editingLessonId) return total;
      const parsed = Number(String(lesson.week ?? '').trim());
      return total + (Number.isInteger(parsed) && parsed > 0 ? parsed : 0);
    }, 0);
    if (lessonForm.week && otherLessonWeeks + lessonWeeks > 20) {
      setAlert({ type: 'error', message: `This curriculum has ${remainingWeeks} weeks remaining. Please reduce the week value to stay within the 20-week limit.` });
      return;
    }

    setIsSaving(true);
    try {
      const lessonData = {
        title: lessonForm.title.trim(),
        source: lessonForm.source.trim(),
        description: lessonForm.description.trim() || undefined,
        week: lessonForm.week.trim() || undefined,
        file: lessonForm.file || undefined,
      };
      if (editingLessonId) {
        await authApi.admin.updateCurriculumLesson(selectedSubjectId, editingLessonId, lessonData);
      } else {
        await authApi.admin.createCurriculumLesson(selectedSubjectId, lessonData);
      }
      setLessonForm({ title: '', source: '', description: '', week: '', file: null });
      setEditingLessonId(null);
      setExistingLessonFile(null);
      setFileInputKey((key) => key + 1);
      setAlert({ type: 'success', message: editingLessonId ? 'Lesson updated successfully.' : 'Lesson added successfully.' });
      await loadSubjectDetails(selectedSubjectId);
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to add lesson.' });
    } finally {
      setIsSaving(false);
    }
  };

  const startEditingLesson = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setLessonForm({
      title: lesson.title || '',
      source: lesson.source || '',
      description: lesson.description || '',
      week: lesson.week || '',
      file: null,
    });
    setExistingLessonFile(lesson.fileId ? { name: lesson.originalFileName, size: lesson.fileSizeBytes } : null);
    setFileInputKey((key) => key + 1);
    setAlert(null);
  };

  const cancelEditingLesson = () => {
    setEditingLessonId(null);
    setExistingLessonFile(null);
    setLessonForm({ title: '', source: '', description: '', week: '', file: null });
    setFileInputKey((key) => key + 1);
  };

  const handleLessonFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setLessonForm((prev) => ({ ...prev, file: null }));
      return;
    }

    const maxSizeMB = 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.type !== 'application/pdf') {
      setAlert({ type: 'error', message: 'Hanya file PDF yang diperbolehkan.' });
      event.target.value = '';
      return;
    }

    if (file.size > maxSizeBytes) {
      setAlert({ type: 'error', message: `Ukuran file melebihi batas maksimal ${maxSizeMB}MB.` });
      event.target.value = '';
      return;
    }

    setLessonForm((prev) => ({ ...prev, file }));
    setAlert(null);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!selectedSubjectId) return;
    try {
      await authApi.admin.deleteCurriculumLesson(selectedSubjectId, lessonId);
      setAlert({ type: 'success', message: 'Lesson deleted successfully.' });
      await loadSubjectDetails(selectedSubjectId);
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to delete lesson.' });
    }
  };

  const selectedCurriculum = curriculums.find((curriculum) => curriculum.id === selectedSubjectId);
  const totalLessonWeeks = lessons.reduce((total, lesson) => {
    const parsed = Number(String(lesson.week ?? '').trim());
    return total + (Number.isInteger(parsed) && parsed > 0 ? parsed : 0);
  }, 0);
  const remainingWeeks = Math.max(0, 20 - totalLessonWeeks);
  const upcomingLessonWeeks = Number(String(lessonForm.week ?? '').trim()) || 0;
  const willExceedLimit = upcomingLessonWeeks > 0 && totalLessonWeeks + upcomingLessonWeeks > 20;

  if (!isAuthenticated) return null;

  return (
    <AppShell title="Kelola Mata Pelajaran">
      <div className="mx-auto max-w-6xl space-y-6">
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Mata Pelajaran</h2>
              <p className="text-sm text-[var(--muted)]">Pilih mata pelajaran dan tambahkan materi pembelajarannya.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Pilih Mata Pelajaran</label>
              <select
                value={selectedSubjectId}
                onChange={(event) => setSelectedSubjectId(event.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)]"
              >
                <option value="">Pilih mata pelajaran</option>
                {curriculums.map((curriculum) => (
                  <option key={curriculum.id} value={curriculum.id}>
                    {curriculum.subjectName} • Grade {curriculum.gradeLevel} • {curriculum.year ?? new Date().getFullYear()}{curriculum.endYear ? ` - ${curriculum.endYear}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCurriculum && (
            <div className="mt-4 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] p-3 text-sm text-[var(--muted)]">
              {selectedCurriculum.subjectName} • Tingkat {selectedCurriculum.gradeLevel} • {selectedCurriculum.year ?? new Date().getFullYear()}{selectedCurriculum.endYear ? ` - ${selectedCurriculum.endYear}` : ''} • Sisa minggu: {remainingWeeks} / 20
            </div>
          )}
        </div>

        {selectedSubjectId && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)]">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm lg:sticky lg:top-6 lg:self-start">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">{editingLessonId ? 'Edit Materi' : 'Tambah Materi'}</h3>
                {editingLessonId && <button type="button" onClick={cancelEditingLesson} className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]">Batal edit</button>}
              </div>
              <form onSubmit={handleSubmitLesson} className="space-y-3">
                <Input
                  label="Judul Materi"
                  value={lessonForm.title}
                  onChange={(event) => setLessonForm((prev) => ({ ...prev, title: event.target.value }))}
                />
                <Input
                  label="Tautan YouTube (Opsional)"
                  value={lessonForm.source}
                  onChange={(event) => setLessonForm((prev) => ({ ...prev, source: event.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <Input
                  label="Minggu (jumlah minggu untuk menyelesaikan materi)"
                  value={lessonForm.week}
                  onChange={(event) => {
                    const sanitized = event.target.value.replace(/[^0-9]/g, '');
                    const nextValue = sanitized === '' ? '' : String(Math.min(Number(sanitized), 20));
                    setLessonForm((prev) => ({ ...prev, week: nextValue }));
                  }}
                />
                <div className="text-xs text-[var(--muted)]">
                  Kemajuan kurikulum: {totalLessonWeeks} / 20 minggu digunakan. Sisa: {remainingWeeks} minggu.
                </div>
                {willExceedLimit && (
                  <div className="text-xs text-red-600">
                    Materi ini akan melebihi batas 20 minggu kurikulum.
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Unggah PDF Materi (Opsional)</label>
                  <div className="relative">
                    <input
                      key={fileInputKey}
                      type="file"
                      accept=".pdf"
                      onChange={handleLessonFileChange}
                      className="block w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                    />
                    {lessonForm.file && (
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-green-600">
                        <span>✓ {lessonForm.file.name} ({(lessonForm.file.size / 1024 / 1024).toFixed(2)}MB)</span>
                        <button type="button" onClick={() => { setLessonForm((prev) => ({ ...prev, file: null })); setFileInputKey((key) => key + 1); }} className="font-semibold text-red-600 hover:underline">Hapus file</button>
                      </div>
                    )}
                    {editingLessonId && existingLessonFile && !lessonForm.file && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-cyan-700">
                        <span aria-hidden="true">PDF</span>
                        <span>File tersimpan: {existingLessonFile.name || 'Dokumen PDF'}{existingLessonFile.size ? ` (${(existingLessonFile.size / 1024 / 1024).toFixed(2)}MB)` : ''}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    Ukuran maksimal: 10MB. Hanya file PDF yang diperbolehkan.
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Deskripsi</label>
                  <textarea
                    value={lessonForm.description}
                    onChange={(event) => setLessonForm((prev) => ({ ...prev, description: event.target.value }))}
                    rows={5}
                    className="h-28 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" isLoading={isSaving}>{editingLessonId ? 'Simpan Perubahan' : 'Tambah Materi'}</Button>
                </div>
              </form>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Daftar Materi</h3>
              <div className="space-y-3">
                {lessons.length === 0 ? (
                  <div className="text-sm text-[var(--muted)]">Belum ada materi pelajaran.</div>
                ) : (
                  lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => startEditingLesson(lesson)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') startEditingLesson(lesson);
                      }}
                      className="cursor-pointer rounded-lg border border-[var(--border)] p-3 transition hover:border-cyan-400/60 hover:bg-cyan-400/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--foreground)]">{lesson.title}</div>
                          {lesson.week && <div className="text-xs text-[var(--muted)]">Minggu: {lesson.week}</div>}
                          {lesson.source && (
                            <button
                              type="button"
                              onClick={(event) => { event.stopPropagation(); setYoutubePlayer({ title: lesson.title, url: lesson.source }); }}
                              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-cyan-400/20"
                              aria-label={`Putar video ${lesson.title}`}
                            >
                              <span aria-hidden="true">▶</span> Putar video
                            </button>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {lesson.fileId && (
                            <Button type="button" variant="secondary" className="px-2 py-1 text-xs" onClick={(event) => { event.stopPropagation(); void openPreview(lesson); }} aria-label={`Buka PDF ${lesson.title}`}>
                              <span aria-hidden="true">↗</span> PDF
                            </Button>
                          )}
                          <Button type="button" variant="danger" className="px-2 py-1 text-xs" onClick={(event) => { event.stopPropagation(); void handleDeleteLesson(lesson.id); }}>
                            Hapus
                          </Button>
                        </div>
                      </div>
                      {lesson.description && <div className="mt-2 text-sm text-[var(--muted)]">{lesson.description}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {previewLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex h-[min(94vh,900px)] w-[min(98vw,1500px)] flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">PDF Preview</h3>
                <p className="text-sm text-[var(--muted)]">{previewLesson.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewLesson(null)}
                className="text-xl text-[var(--muted)]"
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 bg-[var(--background)] p-1">
              <iframe
                src={previewLesson.url}
                title={previewLesson.title}
                className="h-full min-h-[420px] w-full rounded"
              />
            </div>
          </div>
        </div>
      )}

      {youtubePlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex h-[min(88vh,760px)] w-[min(98vw,1400px)] flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">YouTube Video</h3>
                <p className="text-sm text-[var(--muted)]">{youtubePlayer.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setYoutubePlayer(null)}
                className="text-xl text-[var(--muted)]"
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 bg-[var(--background)] p-1">
              {extractYoutubeId(youtubePlayer.url) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${extractYoutubeId(youtubePlayer.url)}`}
                  title={youtubePlayer.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full min-h-[300px] w-full rounded"
                />
              ) : (
                <div className="flex h-96 items-center justify-center text-[var(--muted)]">
                  Invalid YouTube URL
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
