import type { Response } from 'express';
import { AuthService } from '../services/auth.service';
export declare class UserController {
    private readonly authService;
    constructor(authService: AuthService);
    getCurrentUser(req: any): Promise<any>;
    getStudentDashboard(req: any): Promise<any>;
    generateLessonPractice(lessonId: string, req: any): Promise<any>;
    gradeLessonPractice(body: {
        questions?: any[];
        answers?: Record<number, string>;
    }): Promise<any>;
    getStudentReportCard(req: any, grade?: string): Promise<any>;
    downloadStudentReportCard(req: any, res: Response, grade?: string): Promise<void>;
    getStudentExaminations(req: any): Promise<any[]>;
    startStudentExamination(examId: string, req: any): Promise<any>;
    saveStudentAnswers(examId: string, req: any, body: {
        answers?: Record<string, unknown>;
    }): Promise<any>;
    submitStudentExamination(examId: string, req: any): Promise<any>;
}
