import { Model } from 'sequelize-typescript';
export declare class Class extends Model {
    id: string;
    grade: string;
    code: string;
    year: number;
    createdAt: Date;
    updatedAt: Date;
}
