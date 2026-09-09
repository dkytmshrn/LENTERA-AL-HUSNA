import { Model } from 'sequelize-typescript';
export declare class Classroom extends Model {
    id: string;
    gradeLevel: string;
    academicPeriod: string;
    classCode: string;
    homeroomTeacherId?: string;
    homeroomTeacherName?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ClassroomStudent extends Model {
    id: string;
    classroomId: string;
    studentId: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ClassroomCurriculum extends Model {
    id: string;
    classroomId: string;
    curriculumId: string;
    createdAt: Date;
    updatedAt: Date;
}
