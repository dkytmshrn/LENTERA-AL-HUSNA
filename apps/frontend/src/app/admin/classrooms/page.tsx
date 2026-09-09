'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert } from '@/components/Common/Alert';
import { Button } from '@/components/Common/Button';
import { AppShell } from '@/components/AppShell';
import { useProtectedRoute } from '@/hooks/useAuth';
import { authApi, ClassroomItem, UserAdminItem } from '@/lib/api';

const GRADE_LEVELS = ['7', '8', '9'];
const CLASS_CODE_OPTIONS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const TEACHER_PAGE_SIZE = 50;
const STUDENT_PAGE_SIZE = 10;

const buildAcademicPeriod = (startYear: number) => `Genap ${startYear} - Ganjil ${startYear + 1}`;

export default function ClassroomManagementPage() {
  const { isAuthenticated } = useProtectedRoute();
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [teachers, setTeachers] = useState<UserAdminItem[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<Record<string, UserAdminItem>>({});
  const [studentOptions, setStudentOptions] = useState<UserAdminItem[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [gradeLevel, setGradeLevel] = useState('7');
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [classCode, setClassCode] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [assignStudentPage, setAssignStudentPage] = useState(1);
  const [assignStudentTotalPages, setAssignStudentTotalPages] = useState(1);
  const [assignStudentTotalCount, setAssignStudentTotalCount] = useState(0);

  const academicPeriod = useMemo(() => buildAcademicPeriod(startYear), [startYear]);

  const sortedStudentOptions = useMemo(() => {
    const selectedSet = new Set(selectedStudentIds);

    return [...studentOptions].sort((a, b) => {
      const aAssigned = selectedSet.has(a.id) ? 1 : 0;
      const bAssigned = selectedSet.has(b.id) ? 1 : 0;

      if (aAssigned !== bAssigned) {
        return bAssigned - aAssigned;
      }

      const aName = (a.fullName || a.name || a.email || '').toLowerCase();
      const bName = (b.fullName || b.name || b.email || '').toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [studentOptions, selectedStudentIds]);

  const assignStudentPagination = useMemo(() => {
    return {
      paginatedStudents: sortedStudentOptions,
      currentPage: assignStudentPage,
      totalPages: assignStudentTotalPages,
      total: assignStudentTotalCount,
    };
  }, [sortedStudentOptions, assignStudentPage, assignStudentTotalPages, assignStudentTotalCount]);

  const assignedStudents = useMemo(() => {
    const map = new Map<string, { id: string; fullName: string; email: string }>();

    if (editingId) {
      const classroom = classrooms.find((item) => item.id === editingId);
      for (const detail of classroom?.studentDetails || []) {
        map.set(detail.id, {
          id: detail.id,
          fullName: detail.fullName || detail.email || detail.id,
          email: detail.email || '',
        });
      }
    }

    for (const studentId of selectedStudentIds) {
      const cached = selectedStudentDetails[studentId];
      if (cached) {
        map.set(studentId, {
          id: studentId,
          fullName: cached.fullName || cached.name || cached.email || studentId,
          email: cached.email || '',
        });
        continue;
      }

      const match = studentOptions.find((student) => student.id === studentId);
      if (match) {
        map.set(studentId, {
          id: studentId,
          fullName: match.fullName || match.name || match.email || studentId,
          email: match.email || '',
        });
      }
    }

    return [...map.values()].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [classrooms, editingId, selectedStudentIds, selectedStudentDetails, studentOptions]);

  const loadTeacherOptions = async () => {
    const response = await authApi.admin.users({ role: 'Teacher', page: 1, limit: TEACHER_PAGE_SIZE });
    if (Array.isArray(response)) {
      setTeachers(response);
      return;
    }

    setTeachers(response.items || []);
  };

  const loadStudentOptions = async (page = studentPage, search = studentSearch) => {
    const response = await authApi.admin.users({ role: 'Student', page, limit: STUDENT_PAGE_SIZE, search: search || undefined });
    const resolvedStudents = Array.isArray(response) ? response : response.items || [];

    setStudentOptions(resolvedStudents);
    setSelectedStudentDetails((prev) => {
      const next = { ...prev };
      for (const student of resolvedStudents) {
        if (student?.id) {
          next[student.id] = student;
        }
      }
      return next;
    });

    if (Array.isArray(response)) {
      setStudentTotalPages(1);
      return;
    }

    setStudentTotalPages(response.totalPages || 1);
  };

  const loadAssignStudentOptions = async (page = assignStudentPage, search = studentSearch) => {
    const response = await authApi.admin.users({ role: 'Student', page, limit: STUDENT_PAGE_SIZE, search: search || undefined });
    const resolvedStudents = Array.isArray(response) ? response : response.items || [];

    setStudentOptions(resolvedStudents);
    setSelectedStudentDetails((prev) => {
      const next = { ...prev };
      for (const student of resolvedStudents) {
        if (student?.id) {
          next[student.id] = student;
        }
      }
      return next;
    });

    if (Array.isArray(response)) {
      setAssignStudentTotalPages(1);
      setAssignStudentTotalCount(resolvedStudents.length);
      return;
    }

    setAssignStudentTotalPages(response.totalPages || 1);
    setAssignStudentTotalCount(response.totalCount || 0);
  };

  const loadData = async () => {
    try {
      const [classroomData] = await Promise.all([
        authApi.admin.classrooms(),
      ]);

      setClassrooms(classroomData || []);
      await Promise.all([loadTeacherOptions(), loadStudentOptions(studentPage, studentSearch)]);
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to load classroom data',
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
    if (!isAuthenticated) return;
    void loadStudentOptions(studentPage, studentSearch);
  }, [studentPage, studentSearch, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setStudentPage(1);
  }, [studentSearch, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadAssignStudentOptions(assignStudentPage, studentSearch);
  }, [assignStudentPage, studentSearch, isAuthenticated]);

  const resetForm = () => {
    setEditingId(null);
    setGradeLevel('7');
    setStartYear(new Date().getFullYear());
    setClassCode('');
    setSelectedTeacherId('');
    setSelectedStudentIds([]);
    setSelectedStudentDetails({});
    setAssignStudentPage(1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!gradeLevel || !academicPeriod.trim() || !classCode.trim()) {
      setAlert({ type: 'error', message: 'Grade level, academic period, and class code are required.' });
      return;
    }

    if (!/^(Genap|Ganjil)\s+\d{4}\s*-\s*(Genap|Ganjil)\s+\d{4}$/.test(academicPeriod.trim())) {
      setAlert({ type: 'error', message: 'Academic period must follow the format like "Genap 2026 - Ganjil 2027".' });
      return;
    }

    if (!/^[A-Z]$/.test(classCode.trim().toUpperCase())) {
      setAlert({ type: 'error', message: 'Classroom code must be exactly one letter from A to Z.' });
      return;
    }

    const selectedTeacher = teachers.find((teacher) => teacher.id === selectedTeacherId);

    setIsSubmitting(true);
    try {
      let classroomId = editingId || '';
      const previousStudentIds = editingId
        ? classrooms.find((item) => item.id === editingId)?.studentIds || []
        : [];

      if (editingId) {
        await authApi.admin.updateClassroom(editingId, {
          gradeLevel,
          academicPeriod: academicPeriod.trim(),
          classCode: classCode.trim().toUpperCase(),
          homeroomTeacherId: selectedTeacherId || undefined,
          homeroomTeacherName: selectedTeacher?.fullName || selectedTeacher?.name || undefined,
        });
      } else {
        const createdClassroom = await authApi.admin.createClassroom({
          gradeLevel,
          academicPeriod: academicPeriod.trim(),
          classCode: classCode.trim().toUpperCase(),
          homeroomTeacherId: selectedTeacherId || undefined,
          homeroomTeacherName: selectedTeacher?.fullName || selectedTeacher?.name || undefined,
        });
        classroomId = (createdClassroom as any)?.id || '';
      }

      if (classroomId) {
        const toAdd = selectedStudentIds.filter((studentId) => !previousStudentIds.includes(studentId));
        const toRemove = previousStudentIds.filter((studentId) => !selectedStudentIds.includes(studentId));

        if (toAdd.length > 0) {
          await authApi.admin.addStudentsToClassroom(classroomId, toAdd);
        }

        for (const studentId of toRemove) {
          await authApi.admin.removeStudentFromClassroom(classroomId, studentId);
        }
      }

      setAlert({
        type: 'success',
        message: editingId ? 'Classroom updated successfully.' : 'Classroom created successfully.',
      });
      resetForm();
      await loadData();
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to save classroom',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (classroom: ClassroomItem) => {
    setEditingId(classroom.id);
    setGradeLevel(classroom.gradeLevel || '7');
    const periodMatch = classroom.academicPeriod?.match(/(\d{4})/g);
    const detectedStartYear = periodMatch && periodMatch[0] ? Number(periodMatch[0]) : new Date().getFullYear();
    setStartYear(detectedStartYear);
    setClassCode(classroom.classCode || '');
    setSelectedTeacherId(classroom.homeroomTeacherId || '');
    const assignedIds = classroom.studentIds || [];
    setSelectedStudentIds(assignedIds);
    setStudentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStudentSelection = (studentId: string, student?: UserAdminItem) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      }
      return [...prev, studentId];
    });

    if (student?.id) {
      setSelectedStudentDetails((prev) => ({
        ...prev,
        [student.id]: student,
      }));
    }
  };

  const handleRemoveStudent = async (classroomId: string, studentId: string) => {
    const isEditingExisting = !!editingId;

    if (isEditingExisting && classroomId === editingId) {
      setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId));
      return;
    }

    try {
      await authApi.admin.removeStudentFromClassroom(classroomId, studentId);
      setAlert({ type: 'success', message: 'Student removed from classroom.' });
      await loadData();
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to remove student',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      return;
    }

    try {
      await authApi.admin.deleteClassroom(id);
      setAlert({ type: 'success', message: 'Classroom deleted successfully.' });
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      await loadData();
      if (editingId === id) {
        resetForm();
      }
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to delete classroom',
      });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell title="Manajemen Kelas">
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
                    {editingId ? 'Edit Kelas' : 'Buat Kelas'}
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  Kelola kelas, wali kelas, dan anggota siswa.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Kelas Baru
                </Button>
                {editingId && (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Batal
                  </Button>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
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
                      Tingkat {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  Tahun Mulai
                </label>
                <select
                  value={startYear}
                  onChange={(event) => setStartYear(Number(event.target.value))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)]"
                >
                  {Array.from({ length: 10 }, (_, index) => new Date().getFullYear() - 2 + index).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-[var(--muted)]">Tahun Selesai: {startYear + 1}</div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  Kode Kelas
                </label>
                <select
                  value={classCode}
                  onChange={(event) => setClassCode(event.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)]"
                >
                  <option value="">Pilih kode kelas</option>
                  {CLASS_CODE_OPTIONS.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  Wali Kelas
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(event) => setSelectedTeacherId(event.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)]"
                >
                  <option value="">Pilih guru</option>
                  {teachers
                    .slice()
                    .sort((a, b) => (a.fullName || a.name || a.email).localeCompare(b.fullName || b.name || b.email))
                    .map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.fullName || teacher.name || teacher.email}
                      </option>
                    ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-[var(--foreground)]">
                    Tetapkan Siswa
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--muted)]">
                      Halaman {assignStudentPagination.currentPage} / {assignStudentPagination.totalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" onClick={() => setAssignStudentPage((page) => Math.max(1, page - 1))} disabled={assignStudentPagination.currentPage === 1}>
                        Sebelumnya
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => setAssignStudentPage((page) => Math.min(assignStudentPagination.totalPages, page + 1))} disabled={assignStudentPagination.currentPage >= assignStudentPagination.totalPages}>
                        Berikutnya
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mb-3 flex gap-2">
                  <input
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                    placeholder="Cari nama atau email siswa"
                  />
                </div>

                <div className="rounded-lg border border-[var(--border)]">
                  {studentOptions.length === 0 ? (
                    <div className="p-4 text-sm text-[var(--muted)]">Tidak ada siswa yang sesuai dengan filter.</div>
                  ) : (
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-[var(--border)] text-[var(--foreground)]">
                        <tr>
                          <th className="px-3 py-2 font-medium w-10">
                            <input
                              type="checkbox"
                              checked={assignStudentPagination.paginatedStudents.length > 0 && assignStudentPagination.paginatedStudents.every((s) => selectedStudentIds.includes(s.id))}
                              onChange={(event) => {
                                if (event.target.checked) {
                                  const allIds = new Set(selectedStudentIds);
                                  assignStudentPagination.paginatedStudents.forEach((s) => allIds.add(s.id));
                                  setSelectedStudentIds(Array.from(allIds));
                                  assignStudentPagination.paginatedStudents.forEach((s) => {
                                    if (!selectedStudentDetails[s.id]) {
                                      setSelectedStudentDetails((prev) => ({ ...prev, [s.id]: s }));
                                    }
                                  });
                                } else {
                                  const filtered = selectedStudentIds.filter((id) => !assignStudentPagination.paginatedStudents.some((s) => s.id === id));
                                  setSelectedStudentIds(filtered);
                                }
                              }}
                              className="h-4 w-4 rounded border-[var(--border)]"
                            />
                          </th>
                          <th className="px-3 py-2 font-medium">Nama Lengkap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignStudentPagination.paginatedStudents.map((student) => {
                          const studentName = student.fullName || student.name || student.email;
                          const isAlreadyAssigned = selectedStudentIds.includes(student.id);

                          return (
                            <tr key={student.id} className="border-t border-[var(--border)] hover:bg-[var(--border)]/20">
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={isAlreadyAssigned}
                                  onChange={() => handleToggleStudentSelection(student.id, student)}
                                  className="h-4 w-4 rounded border-[var(--border)]"
                                />
                              </td>
                              <td className="px-3 py-2 text-[var(--foreground)]">{studentName}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="mt-3 text-xs text-[var(--muted)]">
                  Siswa terpilih: {selectedStudentIds.length}
                </div>

                {assignedStudents.length > 0 && (
                  <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                    <div className="mb-3 text-sm font-medium text-[var(--foreground)]">
                      Siswa yang Sudah Ditugaskan
                    </div>
                    <div className="overflow-hidden rounded-md border border-[var(--border)]">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-[var(--border)] text-[var(--foreground)]">
                          <tr>
                            <th className="px-3 py-2 font-medium">Nama Lengkap</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignedStudents.map((student) => (
                            <tr key={student.id} className="border-t border-[var(--border)]">
                              <td className="px-3 py-2 text-[var(--foreground)]">{student.fullName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" isLoading={isSubmitting}>
                  {editingId ? 'Perbarui Kelas' : 'Buat Kelas'}
                </Button>
              </div>
            </form>
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
            {isLoading ? (
              <div className="p-10 text-center text-[var(--muted)]">Memuat data kelas...</div>
            ) : classrooms.length === 0 ? (
              <div className="p-10 text-center text-[var(--muted)]">Belum ada data kelas.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[var(--border)] text-[var(--foreground)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Kelas</th>
                      <th className="px-4 py-3 font-semibold">Periode</th>
                      <th className="px-4 py-3 font-semibold">Wali Kelas</th>
                      <th className="px-4 py-3 font-semibold">Siswa</th>
                      <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classrooms.map((classroom) => (
                      <tr key={classroom.id} className="border-t border-[var(--border)] align-top">
                        <td className="px-4 py-3 text-[var(--foreground)]">
                          <div className="font-semibold">Grade {classroom.gradeLevel}</div>
                          <div className="text-xs text-[var(--muted)]">{classroom.classCode}</div>
                        </td>
                        <td className="px-4 py-3 text-[var(--foreground)]">{classroom.academicPeriod}</td>
                        <td className="px-4 py-3 text-[var(--foreground)]">
                          {classroom.homeroomTeacherName || 'Belum ditugaskan'}
                        </td>
                        <td className="px-4 py-3 text-[var(--foreground)]">
                          <span className="font-medium">{classroom.studentCount ?? (classroom.studentIds?.length || 0)}</span>
                          <span className="ml-1 text-[var(--muted)]">siswa</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => handleEdit(classroom)}>
                              Ubah
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => {
                                setDeleteTargetId(classroom.id);
                                setShowDeleteModal(true);
                              }}
                            >
                              Hapus
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
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Hapus Kelas</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Kelas dan seluruh penugasan siswanya akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => {
                setShowDeleteModal(false);
                setDeleteTargetId(null);
              }}>
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  void handleDelete(deleteTargetId);
                }}
              >
                Konfirmasi Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
