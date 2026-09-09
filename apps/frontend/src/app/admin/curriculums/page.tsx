'use client';

import { useEffect, useState } from 'react';
import { Alert } from '@/components/Common/Alert';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input';
import { AppShell } from '@/components/AppShell';
import { useProtectedRoute } from '@/hooks/useAuth';
import { authApi, CurriculumItem, UserAdminItem } from '@/lib/api';

const GRADE_LEVELS = ['7', '8', '9'];

export default function CurriculumManagementPage() {
  const { isAuthenticated } = useProtectedRoute();
  const [curriculums, setCurriculums] = useState<CurriculumItem[]>([]);
  const [teachers, setTeachers] = useState<UserAdminItem[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [classroomFilter, setClassroomFilter] = useState('');
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('7');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [endYear, setEndYear] = useState<number | null>(null);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const syncSelectedCurriculumFromUrl = (curriculumId: string) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (curriculumId) {
      params.set('curriculumId', curriculumId);
    } else {
      params.delete('curriculumId');
    }
    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  };

  const loadData = async () => {
    try {
      const [curriculumData, userData, classroomData] = await Promise.all([
        authApi.admin.curriculums(),
        authApi.admin.teacherOptions(),
        authApi.admin.classrooms(),
      ]);

      const allUsers = userData || [];
      const validTeachers = allUsers.filter((user: UserAdminItem) =>
        ['Teacher', 'teacher'].includes((user.role || '').trim()),
      );

      const nextCurriculums = curriculumData || [];
      setCurriculums(nextCurriculums);
      setTeachers(validTeachers);
      setClassrooms(Array.isArray(classroomData) ? classroomData : []);

      if (!selectedCurriculumId && nextCurriculums.length > 0) {
        setSelectedCurriculumId(nextCurriculums[0].id);
      }

    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to load curriculum data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedCurriculumId) return;
    syncSelectedCurriculumFromUrl(selectedCurriculumId);
  }, [selectedCurriculumId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const curriculumFromUrl = params.get('curriculumId');
    if (curriculumFromUrl && curriculums.some((item) => item.id === curriculumFromUrl)) {
      setSelectedCurriculumId(curriculumFromUrl);
    }
  }, [curriculums]);

  useEffect(() => {
    if (!selectedCurriculumId) {
      setSelectedClassroomIds([]);
      return;
    }
    void authApi.admin.curriculumClassrooms(selectedCurriculumId).then((items) => {
      setSelectedClassroomIds(items.filter((item) => item.assigned).map((item) => item.id));
    }).catch((error: any) => setAlert({ type: 'error', message: error.message || 'Failed to load classroom assignments.' }));
  }, [selectedCurriculumId]);

  const resetForm = () => {
    setEditingId(null);
    setSubjectName('');
    setGradeLevel('7');
    setYear(new Date().getFullYear());
    setEndYear(null);
    setSelectedTeacherIds([]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!subjectName.trim()) {
      setAlert({ type: 'error', message: 'Subject name is required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await authApi.admin.updateCurriculum(editingId, {
          subjectName: subjectName.trim(),
          gradeLevel,
          year,
          endYear,
          teacherIds: selectedTeacherIds,
        });
        setAlert({ type: 'success', message: 'Curriculum updated successfully.' });
      } else {
        await authApi.admin.createCurriculum({
          subjectName: subjectName.trim(),
          gradeLevel,
          year,
          endYear,
          teacherIds: selectedTeacherIds,
        });
        setAlert({ type: 'success', message: 'Curriculum created successfully.' });
      }

      resetForm();
      await loadData();
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to save curriculum',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (curriculum: CurriculumItem) => {
    setSelectedCurriculumId(curriculum.id);
    setEditingId(curriculum.id);
    setSubjectName(curriculum.subjectName || '');
    setGradeLevel(curriculum.gradeLevel || '7');
    setYear(Number(curriculum.year ?? new Date().getFullYear()));
    setEndYear(curriculum.endYear ?? null);
    setSelectedTeacherIds(
      Array.isArray(curriculum.teacherIds) && curriculum.teacherIds.length > 0
        ? curriculum.teacherIds
        : curriculum.teacherId
          ? [curriculum.teacherId]
          : [],
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTeacherToggle = (teacherId: string) => {
    setSelectedTeacherIds((current) =>
      current.includes(teacherId)
        ? current.filter((id) => id !== teacherId)
        : [...current, teacherId],
    );
  };

  const handleClassroomToggle = (classroomId: string) => {
    setSelectedClassroomIds((current) => current.includes(classroomId)
      ? current.filter((id) => id !== classroomId)
      : [...current, classroomId]);
  };

  const saveClassroomAssignments = async () => {
    if (!selectedCurriculumId) return;
    setIsSubmitting(true);
    try {
      await authApi.admin.assignCurriculumToClassrooms(selectedCurriculumId, selectedClassroomIds);
      setAlert({ type: 'success', message: 'Curriculum classroom assignments updated.' });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to assign curriculum to classrooms.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubjectOpen = (curriculumId: string) => {
    setSelectedCurriculumId(curriculumId);
    if (typeof document !== 'undefined') {
      document.getElementById('curriculum-detail-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await authApi.admin.deleteCurriculum(id);
      setAlert({ type: 'success', message: 'Curriculum deleted successfully.' });
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      const nextCurriculums = curriculums.filter((item) => item.id !== id);
      setCurriculums(nextCurriculums);
      const nextSelected = nextCurriculums[0]?.id || '';
      setSelectedCurriculumId(nextSelected);
      if (editingId === id) {
        resetForm();
      }
      await loadData();
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to delete curriculum',
      });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell title="Manajemen Kurikulum">
      <div className="bg-[var(--background)] -m-4 lg:-m-6 p-4 lg:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          )}

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  {editingId ? 'Edit Kurikulum' : 'Buat Kurikulum'}
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  Kelola mata pelajaran, guru, materi, dan ujian.
                </p>
              </div>
              {editingId && (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Batal
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
              <Input
                  label="Nama Mata Pelajaran"
                placeholder="contoh: Matematika"
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  Tingkat Kelas
                </label>
                <select
                  value={gradeLevel}
                  onChange={(event) => setGradeLevel(event.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)]"
                >
                  {GRADE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  Tahun Mulai
                </label>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value) || new Date().getFullYear())}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  Tahun Selesai
                </label>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={endYear ?? ''}
                  placeholder="Opsional"
                  onChange={(event) => {
                    const value = event.target.value;
                    setEndYear(value === '' ? null : (Number(value) || null));
                  }}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)]"
                />
              </div>

              <div className="md:col-span-4">
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  Guru Pengajar
                </label>
                <div className="grid gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 md:grid-cols-2 xl:grid-cols-3">
                  {teachers.length === 0 ? (
                    <div className="text-sm text-[var(--muted)]">Belum ada akun guru.</div>
                  ) : (
                    teachers.map((teacher) => {
                      const checked = selectedTeacherIds.includes(teacher.id);
                      return (
                        <label key={teacher.id} className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm text-[var(--foreground)]">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleTeacherToggle(teacher.id)}
                            className="h-4 w-4 rounded border-[var(--border)] text-blue-600"
                          />
                          <span>{teacher.fullName || teacher.name || teacher.email}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="md:col-span-3 flex justify-end">
                <Button type="submit" isLoading={isSubmitting}>
                  {editingId ? 'Perbarui Kurikulum' : 'Buat Kurikulum'}
                </Button>
              </div>
            </form>
          </div>

          {selectedCurriculumId && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Tetapkan Kurikulum ke Kelas</h2>
                  <p className="text-sm text-[var(--muted)]">Hanya kelas Tingkat {curriculums.find((item) => item.id === selectedCurriculumId)?.gradeLevel} yang dapat dipilih.</p>
                </div>
                <Button type="button" onClick={() => void saveClassroomAssignments()} isLoading={isSubmitting}>Simpan Penetapan Kelas</Button>
              </div>
              <input value={classroomFilter} onChange={(event) => setClassroomFilter(event.target.value)} placeholder="Cari kode kelas atau periode akademik..." className="mb-3 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]" />
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {classrooms.filter((classroom) => {
                  const curriculum = curriculums.find((item) => item.id === selectedCurriculumId);
                  return String(classroom.gradeLevel) === String(curriculum?.gradeLevel)
                    && `${classroom.classCode} ${classroom.academicPeriod}`.toLowerCase().includes(classroomFilter.toLowerCase());
                }).map((classroom) => <label key={classroom.id} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"><input type="checkbox" checked={selectedClassroomIds.includes(classroom.id)} onChange={() => handleClassroomToggle(classroom.id)} className="h-4 w-4 rounded border-[var(--border)] text-blue-600" /><span>Grade {classroom.gradeLevel} - {classroom.classCode} <span className="text-[var(--muted)]">({classroom.academicPeriod})</span></span></label>)}
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
            {isLoading ? (
              <div className="p-10 text-center text-[var(--muted)]">Memuat kurikulum...</div>
            ) : curriculums.length === 0 ? (
              <div className="p-10 text-center text-[var(--muted)]">Belum ada data kurikulum.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[var(--border)] text-[var(--foreground)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Mata Pelajaran</th>
                      <th className="px-4 py-3 font-semibold">Tingkat</th>
                      <th className="px-4 py-3 font-semibold">Tahun</th>
                      <th className="px-4 py-3 font-semibold">Guru</th>
                      <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {curriculums.map((curriculum) => (
                      <tr
                        key={curriculum.id}
                        className={`border-t border-[var(--border)] ${selectedCurriculumId === curriculum.id ? 'bg-[var(--border)]/40' : ''}`}
                      >
                        <td className="px-4 py-3 text-[var(--foreground)]">
                          <button
                            type="button"
                            className="font-medium text-left text-blue-600 hover:underline"
                            onClick={() => handleSubjectOpen(curriculum.id)}
                          >
                            {curriculum.subjectName}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-[var(--foreground)]">Tingkat {curriculum.gradeLevel}</td>
                        <td className="px-4 py-3 text-[var(--foreground)]">
                          {curriculum.year ?? new Date().getFullYear()}
                          {curriculum.endYear ? ` - ${curriculum.endYear}` : ''}
                        </td>
                        <td className="px-4 py-3 text-[var(--foreground)]">
                          {(curriculum.teacherNames && curriculum.teacherNames.length > 0
                            ? curriculum.teacherNames
                            : curriculum.teacherName
                              ? [curriculum.teacherName]
                              : ['Unassigned']
                          ).join(', ')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => void handleEdit(curriculum)}>
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => {
                                setDeleteTargetId(curriculum.id);
                                setShowDeleteModal(true);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {showDeleteModal && deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Hapus Kurikulum</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                This will permanently delete the curriculum and all of its lessons and examinations. This action cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => {
                setShowDeleteModal(false);
                setDeleteTargetId(null);
              }}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  void handleDelete(deleteTargetId);
                }}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
