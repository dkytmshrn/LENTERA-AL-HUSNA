'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, clearTokens } from '@/lib/api';
import { useProtectedRoute } from '@/hooks/useAuth';
import { AppShell } from '@/components/AppShell';
import { Alert } from '@/components/Common/Alert';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useProtectedRoute();
  const [role, setRole] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [statsError, setStatsError] = useState('');
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [studentDashboard, setStudentDashboard] = useState<any>(null);
  const [studentDashboardError, setStudentDashboardError] = useState('');
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [studyLesson, setStudyLesson] = useState<{ title: string; url: string; type: 'youtube' | 'pdf' } | null>(null);

  const getYoutubeId = (url?: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match?.[1] || null;
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const currentRole = localStorage.getItem('userRole') || '';
    setRole(currentRole);
    if (currentRole === 'Principal') {
      router.replace('/principal/reports');
      return;
    }
    if (currentRole === 'Student') {
      void authApi.student.dashboard()
        .then(setStudentDashboard)
        .catch((error: any) => setStudentDashboardError(error.message || 'Gagal memuat informasi siswa.'));
      return;
    }
    if (currentRole !== 'SysAdmin') return;

    setIsStatsLoading(true);
    void authApi.admin.dashboardStats()
      .then(setStats)
      .catch((error: any) => setStatsError(error.message || 'Failed to load dashboard statistics.'))
      .finally(() => setIsStatsLoading(false));
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      clearTokens();
      router.push('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell title="Beranda">
      <div className="bg-gray-50 -m-4 lg:-m-6 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
        {role === 'SysAdmin' ? (
          <div className="space-y-6">
            {statsError && <Alert type="error" message={statsError} onClose={() => setStatsError('')} />}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ringkasan Aplikasi</h1>
              <p className="mt-1 text-sm text-gray-600">Informasi operasional terkini platform LENTERA.</p>
            </div>
            {isStatsLoading ? (
              <div className="rounded-lg bg-white p-8 text-center text-sm text-gray-500 shadow-md">Memuat statistik aplikasi...</div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ['Total Pengguna', stats.users.total, 'text-blue-600'],
                    ['Pengguna Aktif', stats.users.active, 'text-green-600'],
                    ['Pengguna Online', stats.users.online, 'text-emerald-600'],
                    ['Pendaftaran Menunggu', stats.pendingRegistrations, 'text-amber-600'],
                  ].map(([label, value, color]) => (
                    <div key={String(label)} className="rounded-lg bg-white p-5 shadow-md">
                      <p className="text-sm font-medium text-gray-500">{label}</p>
                      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <section className="rounded-lg bg-white p-6 shadow-md">
                    <h2 className="text-lg font-semibold text-gray-900">Konten Akademik</h2>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="rounded-md bg-blue-50 p-4"><p className="text-sm text-blue-700">Mata Pelajaran</p><p className="mt-1 text-2xl font-bold text-blue-900">{stats.subjects}</p></div>
                      <div className="rounded-md bg-indigo-50 p-4"><p className="text-sm text-indigo-700">Ujian</p><p className="mt-1 text-2xl font-bold text-indigo-900">{stats.examinations.total}</p><p className="text-xs text-indigo-700">{stats.examinations.approved} disetujui</p></div>
                    </div>
                  </section>
                </div>
                <section className="rounded-lg bg-white p-6 shadow-md">
                  <h2 className="text-lg font-semibold text-gray-900">Pengguna Berdasarkan Peran</h2>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {Object.entries(stats.usersByRole || {}).map(([userRole, count]) => <span key={userRole} className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700">{userRole}: <strong>{String(count)}</strong></span>)}
                  </div>
                  <p className="mt-4 text-xs text-gray-500">Pengguna online adalah akun aktif dengan sesi refresh token yang belum kedaluwarsa.</p>
                </section>
              </>
            ) : null}
          </div>
        ) : role === 'Student' ? (
          <div className="space-y-6">
            {studentDashboardError && <Alert type="error" message={studentDashboardError} onClose={() => setStudentDashboardError('')} />}
            <div><h1 className="text-2xl font-bold text-gray-900">Dashboard Siswa</h1><p className="mt-1 text-sm text-gray-600">Informasi kelas, agenda belajar, dan ujian Anda.</p></div>
            {!studentDashboard ? <div className="rounded-lg bg-white p-8 text-center text-sm text-gray-500 shadow-md">Memuat informasi siswa...</div> : <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="rounded-lg bg-white p-5 shadow-md sm:col-span-1"><p className="text-sm text-gray-500">Kelas Saya</p><p className="mt-2 text-2xl font-bold text-blue-700">{studentDashboard.classroom ? `Kelas ${studentDashboard.classroom.classCode}` : '-'}</p><p className="mt-1 text-sm text-gray-500">{studentDashboard.classroom ? `Tingkat ${studentDashboard.classroom.gradeLevel}` : 'Belum terdaftar di kelas'}</p></div>
                <div className="rounded-lg bg-white p-5 shadow-md"><p className="text-sm text-gray-500">Mata Pelajaran</p><p className="mt-2 text-3xl font-bold text-emerald-600">{studentDashboard.assignedSubjects?.length || 0}</p><p className="mt-1 text-sm text-gray-500">Mata pelajaran kelas</p></div>
                <div className="rounded-lg bg-white p-5 shadow-md"><p className="text-sm text-gray-500">Ujian Mendatang</p><p className="mt-2 text-3xl font-bold text-amber-600">{studentDashboard.upcomingExaminations?.length || 0}</p><p className="mt-1 text-sm text-gray-500">Jadwal yang perlu disiapkan</p></div>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section className="rounded-lg bg-white p-6 shadow-md"><h2 className="text-lg font-semibold text-gray-900">Ujian Mendatang</h2><div className="mt-4 space-y-3">{studentDashboard.upcomingExaminations?.length ? studentDashboard.upcomingExaminations.map((exam: any) => <div key={exam.id} className="rounded-md border border-gray-200 p-3"><p className="font-semibold text-gray-900">{exam.title}</p><p className="mt-1 text-sm text-gray-500">{exam.examDate || 'Tanggal belum ditentukan'} • {exam.examStartTime || '--'} - {exam.examEndTime || '--'}</p></div>) : <p className="text-sm text-gray-500">Belum ada ujian mendatang.</p>}</div></section>
                <section className="rounded-lg bg-white p-6 shadow-md"><h2 className="text-lg font-semibold text-gray-900">Agenda Hari Ini</h2><p className="mt-1 text-sm text-gray-500">Pilih mata pelajaran untuk melihat seluruh materi.</p><div className="mt-4 space-y-3">{studentDashboard.subjectAgenda?.length ? studentDashboard.subjectAgenda.map((subject: any) => <div key={subject.id} className="overflow-hidden rounded-lg border border-gray-200"><button type="button" onClick={() => setExpandedSubjectId((current) => current === subject.id ? null : subject.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"><span><span className="block font-semibold text-gray-900">{subject.subjectName}</span><span className="text-sm text-gray-500">Tingkat {subject.gradeLevel} • {subject.lessons?.length || 0} materi</span></span><span className="text-xl text-gray-400">{expandedSubjectId === subject.id ? '−' : '+'}</span></button>{expandedSubjectId === subject.id && <div className="border-t border-gray-200 bg-gray-50 p-3">{subject.lessons?.length ? <div className="space-y-2">{subject.lessons.map((lesson: any) => { const youtubeId = getYoutubeId(lesson.source); const url = youtubeId ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1` : lesson.previewUrl; return <button key={lesson.id} type="button" disabled={!url} onClick={() => url && setStudyLesson({ title: lesson.title, url, type: youtubeId ? 'youtube' : 'pdf' })} className="flex w-full items-center justify-between rounded-md bg-white p-3 text-left shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"><span><span className="block font-medium text-gray-900">{lesson.title}</span><span className="text-xs text-gray-500">{lesson.week ? `Minggu ${lesson.week} • ` : ''}{youtubeId ? 'Video YouTube' : lesson.previewUrl ? 'Materi PDF' : 'Materi belum tersedia'}</span></span><span className="text-sm font-semibold text-blue-600">{url ? 'Buka' : 'Tidak tersedia'}</span></button>; })}</div> : <p className="p-2 text-sm text-gray-500">Belum ada materi untuk mata pelajaran ini.</p>}</div>}</div>) : <p className="text-sm text-gray-500">Belum ada mata pelajaran yang ditetapkan.</p>}</div></section>
              </div>
            </>}
            {studyLesson && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={studyLesson.title}><div className="w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-gray-200 px-4 py-3"><h2 className="font-semibold text-gray-900">{studyLesson.title}</h2><button type="button" onClick={() => setStudyLesson(null)} className="rounded p-2 text-xl text-gray-500 hover:bg-gray-100" aria-label="Tutup materi">×</button></div>{studyLesson.type === 'youtube' ? <iframe title={studyLesson.title} src={studyLesson.url} className="aspect-video w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <iframe title={studyLesson.title} src={studyLesson.url} className="h-[75vh] w-full" />}</div></div>}
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-2">📚</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mata Pelajaran Saya</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tugas</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nilai Rata-rata</h3>
            <p className="text-3xl font-bold text-purple-600">--</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Selamat Datang di LENTERA!</h2>
          <p className="text-gray-600 mb-6">
            Akun Anda telah berhasil diaktifkan. Jelajahi platform untuk mengakses mata pelajaran, tugas, dan lainnya.
          </p>
          
          <div className="space-y-3">
            <p className="text-gray-700">
              <span className="font-semibold">Segera Hadir:</span>
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Lihat dan kelola mata pelajaran</li>
              <li>Kirim dan pantau tugas</li>
              <li>Ikuti ujian online</li>
              <li>Lihat nilai dan rapor</li>
              <li>Berkomunikasi dengan guru</li>
            </ul>
          </div>
        </div>
          </>
        )}
        </div>
        </div>
    </AppShell>
  );
}
