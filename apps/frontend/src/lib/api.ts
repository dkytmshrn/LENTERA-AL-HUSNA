const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Track if we're currently refreshing to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let refreshPromise: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

export interface ApiResponse<T> {
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T;
}

// Auth Response Types
export interface LoginResponse {
  message: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: string;
  tokenType?: string;
  requirePasswordChange?: boolean;
  accountId?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    fullName?: string;
    role: string;
    badge?: string;
  };
}

export interface RegisterResponse {
  message: string;
  registrationId?: string;
  registrationRequestId?: string;
  verificationCode?: string;
}

export interface VerifyEmailResponse {
  message: string;
  registrationId?: string;
  registrationRequestId?: string;
}

export interface ResendVerificationResponse {
  message: string;
  email?: string;
  verificationCode?: string;
  cooldownSeconds?: number;
}

export interface ForgotPasswordResponse {
  message: string;
  email?: string;
  resetCode?: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface UpdateProfileResponse {
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  badge?: string;
  status?: string;
}

export interface RegistrationRequestAdminItem {
  id: string;
  name: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  birthday?: string;
  gender?: string;
  parentName?: string;
  parentPhoneNumber?: string;
  status?: string;
  assignedRole?: string;
  assignedBadge?: string;
  rejectionReason?: string;
  emailVerified?: boolean;
  createdAt?: string;
}

export interface UserAdminItem {
  id: string;
  name: string;
  fullName: string;
  email: string;
  role?: string;
  badge?: string;
  status?: string;
  gender?: string;
  phoneNumber?: string;
  birthday?: string;
  parentName?: string;
  createdAt?: string;
}

export interface PaginatedUsersResponse {
  items: UserAdminItem[];
  totalCount: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface CurriculumItem {
  id: string;
  subjectName: string;
  gradeLevel: string;
  year?: number;
  endYear?: number | null;
  teacherId?: string;
  teacherName?: string;
  teacherIds?: string[];
  teacherNames?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassroomItem {
  id: string;
  gradeLevel: string;
  academicPeriod: string;
  classCode: string;
  homeroomTeacherId?: string;
  homeroomTeacherName?: string;
  studentIds?: string[];
  studentNames?: string[];
  studentDetails?: Array<{ id: string; fullName: string; email?: string }>;
  studentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

function flattenErrorMessages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenErrorMessages(item));
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const messages: string[] = [];

    if (typeof record.message === 'string') {
      messages.push(record.message);
    }

    if (Array.isArray(record.message)) {
      messages.push(...flattenErrorMessages(record.message));
    }

    if (typeof record.error === 'string') {
      messages.push(record.error);
    }

    if (Array.isArray(record.errors)) {
      messages.push(...flattenErrorMessages(record.errors));
    }

    if (record && typeof record === 'object' && !record.message && !record.error && !record.errors) {
      for (const nested of Object.values(record)) {
        messages.push(...flattenErrorMessages(nested));
      }
    }

    return messages;
  }

  if (typeof value === 'string') {
    return [value];
  }

  return [];
}

export function getSafeErrorMessage(error: any): string {
  const rawMessages = flattenErrorMessages(error);

  const cleaned = rawMessages
    .map((message) => String(message).trim())
    .filter(Boolean)
    .map((message) => {
      const lowered = message.toLowerCase();

      if (message.startsWith('Unexpected token')) return 'Request data is invalid.';
      if (lowered.includes('phone number')) return 'Phone number format is invalid. Please use a valid Indonesian number.';
      if (/valid.*email|email.*valid|must be an email|is not a valid email|email address/.test(lowered)) {
        return 'Please enter a valid email address.';
      }
      if (lowered.includes('password')) return 'Password is invalid or does not meet the required policy.';
      return message;
    })
    .filter((message, index, arr) => arr.indexOf(message) === index);

  if (cleaned.length > 0) {
    return cleaned[0];
  }

  return 'Something went wrong. Please try again.';
}

export async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown,
  headers: Record<string, string> = {},
  retryCount = 0,
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const isFormData = body instanceof FormData;
  const defaultHeaders: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' };

  const mergedHeaders: Record<string, string> = {
    ...defaultHeaders,
    ...headers,
  };

  const options: RequestInit = {
    method,
    credentials: 'include',
    headers: mergedHeaders,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    if (isFormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    let payload: any = {};

    try {
      payload = await response.json();
    } catch {
      payload = {};
    }

    // Handle 401 Unauthorized - try to refresh the session silently without logging the user out.
    if (response.status === 401 && retryCount === 0) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiCall<T>(endpoint, method, body, headers, 1);
      }

      await forceLogout();
      throw {
        status: 401,
        message: 'Your session has expired. Please sign in again.',
        errors: 'Your session has expired. Please sign in again.',
      };
    }

    const message = getSafeErrorMessage(payload);

    throw {
      status: response.status,
      message,
      errors: payload?.errors || payload?.message || message,
    };
  }

  return response.json();
}

// Helper function to refresh the access token
async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing) {
    const result = await refreshPromise;
    return result !== null;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data?.accessToken || !data?.refreshToken) {
        return null;
      }

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return (await refreshPromise) !== null;
}

async function forceLogout(): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Session cleanup continues locally when the logout request cannot complete.
  }

  clearTokens();
  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
    window.location.replace('/');
  }
}

// Auth API endpoints
export const authApi = {
  register: (data: unknown) => 
    apiCall<RegisterResponse>('/auth/register', 'POST', data),
  
  verifyEmail: (email: string, verificationCode: string, registrationRequestId?: string) => 
    apiCall<VerifyEmailResponse>('/auth/verify-email', 'POST', {
      email,
      verificationCode,
      registrationRequestId,
    }),

  resendVerificationEmail: (email: string) =>
    apiCall<ResendVerificationResponse>('/auth/resend-verification-email', 'POST', { email }),
  
  login: (email: string, password: string) => 
    apiCall<LoginResponse>('/auth/login', 'POST', { email, password }),
  
  changePassword: (accountId: string, data: unknown) => 
    apiCall<ChangePasswordResponse>('/auth/change-password', 'POST', data, {
      'X-Account-ID': accountId,
    }),

  updateProfile: (accountId: string, data: { name?: string; fullName?: string; phoneNumber?: string }) =>
    apiCall<UpdateProfileResponse>('/auth/me/profile', 'PATCH', data, {
      'X-Account-ID': accountId,
    }),

  requestDeactivationOTP: (accountId: string) =>
    apiCall<{ message: string; email?: string; otp?: string }>('/auth/me/deactivation/request-otp', 'POST', {}, {
      'X-Account-ID': accountId,
    }),

  confirmDeactivation: (accountId: string, otp: string) =>
    apiCall<{ message: string }>('/auth/me/deactivation/confirm', 'POST', { otp }, {
      'X-Account-ID': accountId,
    }),
  
  refreshToken: (refreshToken: string) => 
    apiCall('/auth/refresh-token', 'POST', { refreshToken }),

  logout: () => 
    apiCall('/auth/logout', 'POST', {}),

  forgotPassword: (email: string) =>
    apiCall<ForgotPasswordResponse>('/auth/forgot-password', 'POST', { email }),

  resetPassword: (data: {
    email: string;
    resetCode: string;
    newPassword: string;
    confirmPassword: string;
  }) => apiCall('/auth/reset-password', 'POST', data),

  student: {
    dashboard: () => apiCall<any>('/user/dashboard', 'GET'),
    generateLessonPractice: (lessonId: string) => apiCall<any>(`/user/practice/lessons/${lessonId}`, 'POST', {}),
    gradeLessonPractice: (questions: unknown[], answers: Record<number, string>) => apiCall<any>('/user/practice/grade', 'POST', { questions, answers }),
    reportCard: (grade?: string) => apiCall<any>(`/user/report-card${grade ? `?grade=${encodeURIComponent(grade)}` : ''}`, 'GET'),
    reportCardPdfUrl: (grade?: string) => `${API_URL}/user/report-card/pdf${grade ? `?grade=${encodeURIComponent(grade)}` : ''}`,
    examinations: () => apiCall<any[]>('/user/examinations', 'GET'),
    startExamination: (examId: string) => apiCall<any>(`/user/examinations/${examId}/start`, 'POST', {}),
    saveAnswers: (examId: string, answers: Record<string, unknown>) => apiCall(`/user/examinations/${examId}/answers`, 'PATCH', { answers }),
    submitExamination: (examId: string) => apiCall(`/user/examinations/${examId}/submit`, 'POST', {}),
  },
  me: () => apiCall<any>('/user/me', 'GET'),

  admin: {
    dashboardStats: () =>
      apiCall('/admin/dashboard/stats', 'GET'),
    principalReports: () =>
      apiCall('/admin/principal/reports', 'GET'),
    teacherOptions: () =>
      apiCall<UserAdminItem[]>('/admin/teacher-options', 'GET'),
    curriculumClassrooms: (curriculumId: string) =>
      apiCall<any[]>(`/admin/curriculums/${curriculumId}/classrooms`, 'GET'),
    assignCurriculumToClassrooms: (curriculumId: string, classroomIds: string[]) =>
      apiCall<any[]>(`/admin/curriculums/${curriculumId}/classrooms`, 'PUT', { classroomIds }),
    registrationRequests: () =>
      apiCall<RegistrationRequestAdminItem[]>('/admin/registration-requests', 'GET'),
    users: (params: { role?: string; search?: string; searchEmail?: string; searchName?: string; page?: number; limit?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.role) query.set('role', params.role);
      if (params.search) query.set('search', params.search);
      if (params.searchEmail) query.set('searchEmail', params.searchEmail);
      if (params.searchName) query.set('searchName', params.searchName);
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));

      const suffix = query.toString() ? `?${query.toString()}` : '';
      return apiCall<UserAdminItem[] | PaginatedUsersResponse>(`/admin/users${suffix}`, 'GET');
    },
    approveRegistration: (email: string, assignedRole?: string, assignedBadge?: string) =>
      apiCall('/admin/approve-registration', 'POST', {
        email,
        ...(assignedRole ? { assignedRole } : {}),
        ...(assignedBadge ? { assignedBadge } : {}),
      }),
    rejectRegistration: (email: string, rejectionReason: string) =>
      apiCall('/admin/reject-registration', 'POST', {
        email,
        rejectionReason,
      }),
    updateUser: (id: string, data: Record<string, unknown>) =>
      apiCall(`/admin/users/${id}`, 'PUT', data),
    updateUserRole: (id: string, role: string, badge?: string) =>
      apiCall(`/admin/users/${id}/role`, 'PATCH', {
        role,
        badge,
      }),
    badges: () =>
      apiCall<Array<{ name: string; role: string; displayName: string }>>('/admin/badges', 'GET'),
    updateUserBadges: (id: string, badges: string[], mfaCode?: string) =>
      apiCall(`/admin/users/${id}/badges`, 'PATCH', {
        badges,
        ...(mfaCode ? { mfaCode } : {}),
      }),
    deleteUser: (id: string) =>
      apiCall(`/admin/users/${id}`, 'DELETE'),
    curriculums: () =>
      apiCall<CurriculumItem[]>('/admin/curriculums', 'GET'),
    createCurriculum: (data: { subjectName: string; gradeLevel: string; year?: number | string; endYear?: number | string | null; teacherIds?: string[]; teacherId?: string }) =>
      apiCall('/admin/curriculums', 'POST', data),
    updateCurriculum: (id: string, data: Record<string, unknown>) =>
      apiCall(`/admin/curriculums/${id}`, 'PATCH', data),
    deleteCurriculum: (id: string) =>
      apiCall(`/admin/curriculums/${id}`, 'DELETE'),
    getCurriculumLessons: (curriculumId: string) =>
      apiCall(`/admin/curriculums/${curriculumId}/lessons`, 'GET'),
    createCurriculumLesson: (curriculumId: string, data: { title: string; source?: string; description?: string; week?: string; file?: File }) =>
      (() => {
        const formData = new FormData();
        formData.append('title', data.title);
        if (data.source) formData.append('source', data.source);
        if (data.description) formData.append('description', data.description);
        if (data.week) formData.append('week', data.week);
        if (data.file) formData.append('file', data.file);
        return apiCall(`/admin/curriculums/${curriculumId}/lessons`, 'POST', formData);
      })(),
    updateCurriculumLesson: (curriculumId: string, lessonId: string, data: Record<string, unknown> & { file?: File }) =>
      (() => {
        if (data.file) {
          const formData = new FormData();
          Object.entries(data).forEach(([key, value]) => {
            if (key !== 'file' && value !== undefined) {
              formData.append(key, String(value));
            }
          });
          if (data.file) formData.append('file', data.file);
          return apiCall(`/admin/curriculums/${curriculumId}/lessons/${lessonId}`, 'PATCH', formData);
        }
        return apiCall(`/admin/curriculums/${curriculumId}/lessons/${lessonId}`, 'PATCH', data);
      })(),
    deleteCurriculumLesson: (curriculumId: string, lessonId: string) =>
      apiCall(`/admin/curriculums/${curriculumId}/lessons/${lessonId}`, 'DELETE'),
    getCurriculumExaminations: (curriculumId: string) =>
      apiCall(`/admin/curriculums/${curriculumId}/examinations`, 'GET'),
    approveExamination: (examId: string) =>
      apiCall(`/admin/examinations/${examId}/approve`, 'POST', {}),
    unlockExamination: (examId: string) =>
      apiCall(`/admin/examinations/${examId}/unlock`, 'POST', {}),
    createCurriculumExamination: (curriculumId: string, data: { title: string; examType?: string; description?: string; examDate?: string; examStartTime?: string; examEndTime?: string }) =>
      apiCall(`/admin/curriculums/${curriculumId}/examinations`, 'POST', data),
    updateCurriculumExamination: (curriculumId: string, examId: string, data: Record<string, unknown>) =>
      apiCall(`/admin/curriculums/${curriculumId}/examinations/${examId}`, 'PATCH', data),
    deleteCurriculumExamination: (curriculumId: string, examId: string) =>
      apiCall(`/admin/curriculums/${curriculumId}/examinations/${examId}`, 'DELETE'),
    getCurriculumLessonPreviewUrl: (curriculumId: string, lessonId: string) =>
      apiCall<{ previewUrl: string }>(`/admin/curriculums/${curriculumId}/lessons/${lessonId}/preview-url`, 'GET').then((result) => result.previewUrl),
    getExaminationQuestions: (examId: string) =>
      apiCall(`/admin/examinations/${examId}/questions`, 'GET'),
    generateExaminationQuestions: (data: { subjectName?: string; gradeLevel?: string; multipleChoiceCount: number; essayCount: number }) =>
      apiCall<{ questions: any[] }>('/admin/examinations/generate-questions', 'POST', data),
    createExaminationQuestion: (examId: string, data: { type: 'essay' | 'multiple_choice'; questionText?: string; options?: Array<{ text?: string; imageUrl?: string; imageFileId?: string }>; correctOptionIndex?: number; points?: number; answer?: string; questionImage?: File; optionImages?: File[]; optionImageIndexes?: number[] }) => {
      const formData = new FormData();
      formData.append('type', data.type);
      if (data.questionText) formData.append('questionText', data.questionText);
      if (data.correctOptionIndex !== undefined) formData.append('correctOptionIndex', String(data.correctOptionIndex));
      if (data.points !== undefined) formData.append('points', String(data.points));
      if (data.answer) formData.append('answer', data.answer);
      if (data.options) formData.append('options', JSON.stringify(data.options));
      if (data.optionImageIndexes) formData.append('optionImageIndexes', JSON.stringify(data.optionImageIndexes));
      if (data.questionImage) formData.append('questionImage', data.questionImage);
      if (data.optionImages && data.optionImages.length > 0) {
        data.optionImages.forEach((file) => formData.append('optionImages', file));
      }
      return apiCall(`/admin/examinations/${examId}/questions`, 'POST', formData);
    },
    updateExaminationQuestion: (examId: string, questionId: string, data: { type: 'essay' | 'multiple_choice'; questionText?: string; options?: Array<{ text?: string; imageUrl?: string; imageFileId?: string; imageExtension?: string }>; correctOptionIndex?: number; points?: number; answer?: string; existingQuestionImageFileId?: string; questionImage?: File; optionImages?: File[]; optionImageIndexes?: number[] }) => {
      const formData = new FormData();
      formData.append('type', data.type);
      if (data.questionText) formData.append('questionText', data.questionText);
      if (data.correctOptionIndex !== undefined) formData.append('correctOptionIndex', String(data.correctOptionIndex));
      if (data.points !== undefined) formData.append('points', String(data.points));
      if (data.answer) formData.append('answer', data.answer);
      if (data.options) formData.append('options', JSON.stringify(data.options));
      if (data.existingQuestionImageFileId) formData.append('existingQuestionImageFileId', data.existingQuestionImageFileId);
      if (data.optionImageIndexes) formData.append('optionImageIndexes', JSON.stringify(data.optionImageIndexes));
      if (data.questionImage) formData.append('questionImage', data.questionImage);
      data.optionImages?.forEach((file) => formData.append('optionImages', file));
      return apiCall(`/admin/examinations/${examId}/questions/${questionId}`, 'PATCH', formData);
    },
    classrooms: () =>
      apiCall<ClassroomItem[]>('/admin/classrooms', 'GET'),
    teacherClassroom: () =>
      apiCall('/admin/teacher/classroom', 'GET'),
    teacherAssignments: () =>
      apiCall<{ examinations: any[]; results: any[] }>('/admin/teacher/assignments', 'GET'),
    createClassroom: (data: {
      gradeLevel: string;
      academicPeriod: string;
      classCode: string;
      homeroomTeacherId?: string;
      homeroomTeacherName?: string;
    }) => apiCall('/admin/classrooms', 'POST', data),
    updateClassroom: (id: string, data: Record<string, unknown>) =>
      apiCall(`/admin/classrooms/${id}`, 'PATCH', data),
    deleteClassroom: (id: string) =>
      apiCall(`/admin/classrooms/${id}`, 'DELETE'),
    addStudentsToClassroom: (id: string, studentIds: string[]) =>
      apiCall(`/admin/classrooms/${id}/students`, 'POST', { studentIds }),
    removeStudentFromClassroom: (classroomId: string, studentId: string) =>
      apiCall(`/admin/classrooms/${classroomId}/students/${studentId}`, 'DELETE'),
  },
  
  health: () => 
    apiCall('/auth/health', 'GET'),
};

export function setAuthState(isAuthenticated: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('isAuthenticated', isAuthenticated ? 'true' : 'false');
    window.dispatchEvent(new Event('auth-state-changed'));
  }
}

export function isAuthenticatedClient() {
  if (typeof window === 'undefined') {
    return false;
  }

  return localStorage.getItem('isAuthenticated') === 'true';
}

export function saveTokens(accessToken: string, refreshToken: string) {
  setAuthState(true);
}

export function saveUserSession(user?: {
  id?: string;
  email?: string;
  name?: string;
  fullName?: string;
  role?: string;
  badge?: string;
  phoneNumber?: string;
}) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!user) {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userBadge');
    localStorage.removeItem('accountId');
    return;
  }

  const displayName = user.fullName || user.name || user.email || 'User';

  localStorage.setItem('userRole', user.role || 'Guest');
  localStorage.setItem('userName', displayName);
  localStorage.setItem('userFullName', displayName);
  localStorage.setItem('userEmail', user.email || '');
  localStorage.setItem('userBadge', user.badge || '');
  if (user.phoneNumber) {
    localStorage.setItem('userPhoneNumber', user.phoneNumber);
  }
  if (user.id) {
    localStorage.setItem('accountId', user.id);
    sessionStorage.setItem('accountId', user.id);
  }
}

export function getTokens() {
  return {
    accessToken: isAuthenticatedClient() ? 'cookie-authenticated' : null,
    refreshToken: isAuthenticatedClient() ? 'cookie-authenticated' : null,
  };
}

export function clearTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userBadge');
    localStorage.removeItem('userPhoneNumber');
    localStorage.removeItem('accountId');
    window.dispatchEvent(new Event('auth-state-changed'));
    sessionStorage.removeItem('registrationId');
    sessionStorage.removeItem('registrationEmail');
    sessionStorage.removeItem('verificationCode');
    sessionStorage.removeItem('emailVerified');
    sessionStorage.removeItem('accountId');
    sessionStorage.removeItem('tempPassword');
    sessionStorage.removeItem('resetPasswordEmail');
    sessionStorage.removeItem('resetPasswordCode');
  }
}
