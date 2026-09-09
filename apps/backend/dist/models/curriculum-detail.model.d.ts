import { Model } from 'sequelize-typescript';
import { Curriculum } from './curriculum.model';
export declare class CurriculumLesson extends Model {
    id: string;
    curriculumId: string;
    title: string;
    source?: string;
    description?: string;
    week?: string;
    fileId?: string;
    fileSizeBytes?: number;
    originalFileName?: string;
    curriculum?: Curriculum;
    createdAt: Date;
    updatedAt: Date;
}
export declare class CurriculumExamination extends Model {
    id: string;
    curriculumId: string;
    title: string;
    examType: string;
    description?: string;
    examDate?: string;
    examStartTime?: string;
    examEndTime?: string;
    approvalStatus: 'draft' | 'approved';
    approvedAt?: Date;
    approvedBy?: string;
    curriculum?: Curriculum;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ExaminationAttempt extends Model {
    id: string;
    examinationId: string;
    studentId: string;
    status: 'in_progress' | 'submitted' | 'expired';
    answers: Record<string, unknown>;
    startedAt: Date;
    submittedAt?: Date;
    score?: number;
    rawScore?: number;
    maxScore?: number;
    passed?: boolean;
    questionResults: Record<string, unknown>;
    questionOrder: {
        questionIds?: string[];
        optionOrders?: Record<string, number[]>;
    };
    gradingStatus: 'complete' | 'pending_ai';
}
export declare class ExaminationQuestion extends Model {
    id: string;
    examinationId: string;
    type: 'essay' | 'multiple_choice';
    questionText?: string;
    questionImageFileId?: string;
    questionImageUrl?: string;
    questionImageExtension?: string;
    options?: any[];
    correctOptionIndex?: number;
    points?: number;
    answer?: string;
    examination?: CurriculumExamination;
    createdAt: Date;
    updatedAt: Date;
}
