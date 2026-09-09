import type { Multer } from 'multer';
import { AuthService } from '../services/auth.service';
import { ApproveRegistrationDto, RejectRegistrationDto } from '../dto/registration-request.dto';
export declare class AdminController {
    private readonly authService;
    constructor(authService: AuthService);
    getRegistrationRequestsForAdmin(): Promise<any[]>;
    getAdminDashboardStats(): Promise<any>;
    getPrincipalReportStats(): Promise<any>;
    getTeacherAssignmentOptions(): Promise<any[]>;
    getCurriculumClassrooms(curriculumId: string): Promise<any[]>;
    assignCurriculumToClassrooms(curriculumId: string, body: {
        classroomIds?: string[];
    }): Promise<any[]>;
    getUsersForAdmin(role?: string, search?: string, searchEmail?: string, searchName?: string, page?: string, limit?: string): Promise<any[] | {
        items: any[];
        totalCount: number;
        totalPages: number;
        page: number;
        limit: number;
    }>;
    getUserByIdForAdmin(id: string): Promise<any>;
    updateUserForAdmin(id: string, updateDto: Record<string, any>): Promise<any>;
    updateUserRoleForAdmin(id: string, body: {
        role?: string;
        badge?: string;
    }): Promise<any>;
    deleteUserForAdmin(id: string): Promise<any>;
    updateUserBadges(id: string, body: {
        badges: string[];
        mfaCode?: string;
    }): Promise<any>;
    getAvailableBadges(): Promise<any>;
    approveRegistrationMethodHint(): Promise<void>;
    approveRegistration(req: any, approveDto: ApproveRegistrationDto): Promise<any>;
    rejectRegistration(rejectDto: RejectRegistrationDto): Promise<any>;
    getCurriculums(req: any): Promise<any[]>;
    createCurriculum(body: {
        subjectName: string;
        gradeLevel: string;
        year?: number | string;
        endYear?: number | string | null;
        teacherIds?: string[];
        teacherId?: string;
    }): Promise<any>;
    updateCurriculum(id: string, body: Record<string, any>): Promise<any>;
    deleteCurriculum(id: string): Promise<any>;
    getCurriculumLessons(curriculumId: string, req: any): Promise<any[]>;
    createCurriculumLesson(curriculumId: string, body: {
        title: string;
        source?: string;
        description?: string;
        week?: string;
    }, file?: Multer.File): Promise<any>;
    updateCurriculumLesson(curriculumId: string, lessonId: string, body: Record<string, any>, file?: Multer.File): Promise<any>;
    deleteCurriculumLesson(curriculumId: string, lessonId: string): Promise<any>;
    getCurriculumExaminations(curriculumId: string, req: any): Promise<any[]>;
    getCurriculumLessonPreviewUrl(curriculumId: string, lessonId: string): Promise<{
        previewUrl: string;
    }>;
    getExaminationQuestions(examId: string, req: any): Promise<any[]>;
    generateExaminationQuestions(body: {
        subjectName?: string;
        gradeLevel?: string;
        multipleChoiceCount?: number;
        essayCount?: number;
    }): Promise<any>;
    createExaminationQuestion(examId: string, body: Record<string, any>, req: any, files?: {
        questionImage?: Multer.File[];
        optionImages?: Multer.File[];
    }): Promise<any>;
    updateExaminationQuestion(examId: string, questionId: string, body: Record<string, any>, req: any, files?: {
        questionImage?: Multer.File[];
        optionImages?: Multer.File[];
    }): Promise<any>;
    createExaminationQuestionWithOptionImages(examId: string, body: Record<string, any>, optionImages?: Multer.File[]): Promise<any>;
    createCurriculumExamination(curriculumId: string, body: {
        title: string;
        examType?: string;
        description?: string;
        examDate?: string;
    }, req: any): Promise<any>;
    updateCurriculumExamination(curriculumId: string, examId: string, body: Record<string, any>, req: any): Promise<any>;
    deleteCurriculumExamination(curriculumId: string, examId: string, req: any): Promise<any>;
    approveExamination(examId: string, req: any): Promise<any>;
    unlockExamination(examId: string): Promise<any>;
    getClassrooms(): Promise<any[]>;
    getTeacherClassroom(req: any): Promise<any>;
    getTeacherAssignments(req: any): Promise<{
        examinations: any[];
        results: any[];
    }>;
    createClassroom(body: {
        gradeLevel: string;
        academicPeriod: string;
        classCode: string;
        homeroomTeacherId?: string;
        homeroomTeacherName?: string;
    }): Promise<any>;
    updateClassroom(id: string, body: Record<string, any>): Promise<any>;
    deleteClassroom(id: string): Promise<any>;
    addStudentsToClassroom(id: string, body: {
        studentIds: string[];
    }): Promise<any>;
    removeStudentFromClassroom(id: string, studentId: string): Promise<any>;
}
