import { Model } from 'sequelize-typescript';
export declare class Curriculum extends Model {
    id: string;
    subjectName: string;
    gradeLevel: string;
    year: number;
    endYear?: number | null;
    teacherIds?: string;
    teacherNames?: string;
    createdAt: Date;
    updatedAt: Date;
}
