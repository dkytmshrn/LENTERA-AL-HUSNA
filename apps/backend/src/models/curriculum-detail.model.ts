import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
} from 'sequelize-typescript';
import { Curriculum } from './curriculum.model';
import { Account } from './account.model';

@Table({
  tableName: 'curriculum_lessons',
  timestamps: true,
})
export class CurriculumLesson extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Curriculum)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare curriculumId: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare source?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare week?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare fileId?: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
    defaultValue: 0,
  })
  declare fileSizeBytes?: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare originalFileName?: string;

  @BelongsTo(() => Curriculum)
  declare curriculum?: Curriculum;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}

@Table({
  tableName: 'curriculum_examinations',
  timestamps: true,
})
export class CurriculumExamination extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Curriculum)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare curriculumId: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.STRING(80),
    allowNull: false,
    defaultValue: 'Regular Examination',
  })
  declare examType: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description?: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare examDate?: string;

  @Column({
    type: DataType.TIME,
    allowNull: true,
  })
  declare examStartTime?: string;

  @Column({
    type: DataType.TIME,
    allowNull: true,
  })
  declare examEndTime?: string;

  @Column({ type: DataType.ENUM('draft', 'approved'), allowNull: false, defaultValue: 'draft' })
  declare approvalStatus: 'draft' | 'approved';

  @Column({ type: DataType.DATE, allowNull: true })
  declare approvedAt?: Date;

  @Column({ type: DataType.UUID, allowNull: true })
  declare approvedBy?: string;

  @BelongsTo(() => Curriculum)
  declare curriculum?: Curriculum;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}

@Table({ tableName: 'examination_attempts', timestamps: true })
export class ExaminationAttempt extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @ForeignKey(() => CurriculumExamination)
  @Column({ type: DataType.UUID, allowNull: false })
  declare examinationId: string;

  @ForeignKey(() => Account)
  @Column({ type: DataType.UUID, allowNull: false })
  declare studentId: string;

  @Column({ type: DataType.ENUM('in_progress', 'submitted', 'expired'), allowNull: false, defaultValue: 'in_progress' })
  declare status: 'in_progress' | 'submitted' | 'expired';

  @Column({ type: DataType.JSON, allowNull: false, defaultValue: {} })
  declare answers: Record<string, unknown>;

  @Column({ type: DataType.DATE, allowNull: false })
  declare startedAt: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  declare submittedAt?: Date;

  @Column({ type: DataType.FLOAT, allowNull: true })
  declare score?: number;

  @Column({ type: DataType.FLOAT, allowNull: true })
  declare rawScore?: number;

  @Column({ type: DataType.FLOAT, allowNull: true })
  declare maxScore?: number;

  @Column({ type: DataType.BOOLEAN, allowNull: true })
  declare passed?: boolean;

  @Column({ type: DataType.JSON, allowNull: false, defaultValue: {} })
  declare questionResults: Record<string, unknown>;

  @Column({ type: DataType.JSON, allowNull: false, defaultValue: {} })
  declare questionOrder: { questionIds?: string[]; optionOrders?: Record<string, number[]> };

  @Column({ type: DataType.ENUM('complete', 'pending_ai'), allowNull: false, defaultValue: 'complete' })
  declare gradingStatus: 'complete' | 'pending_ai';
}

@Table({
  tableName: 'examination_questions',
  timestamps: true,
})
export class ExaminationQuestion extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => CurriculumExamination)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare examinationId: string;

  @Column({
    type: DataType.ENUM('essay', 'multiple_choice'),
    allowNull: false,
    defaultValue: 'essay',
  })
  declare type: 'essay' | 'multiple_choice';

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare questionText?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare questionImageFileId?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare questionImageUrl?: string;

  @Column({ type: DataType.STRING(10), allowNull: true })
  declare questionImageExtension?: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare options?: any[];

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare correctOptionIndex?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 1,
  })
  declare points?: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Correct answer for the question (for essay or reference)',
  })
  declare answer?: string;

  @BelongsTo(() => CurriculumExamination)
  declare examination?: CurriculumExamination;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
