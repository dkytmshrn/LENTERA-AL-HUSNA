import {
  Column,
  DataType,
  Model,
  Table,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
  ForeignKey,
  BelongsToMany,
} from 'sequelize-typescript';
import { Account } from './account.model';
import { Curriculum } from './curriculum.model';

@Table({
  tableName: 'classrooms',
  timestamps: true,
})
export class Classroom extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  declare gradeLevel: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare academicPeriod: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare classCode: string;

  @ForeignKey(() => Account)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare homeroomTeacherId?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare homeroomTeacherName?: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}

@Table({
  tableName: 'classroom_students',
  timestamps: true,
})
export class ClassroomStudent extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Classroom)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare classroomId: string;

  @ForeignKey(() => Account)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare studentId: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}

@Table({ tableName: 'classroom_curriculums', timestamps: true })
export class ClassroomCurriculum extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @ForeignKey(() => Classroom)
  @Column({ type: DataType.UUID, allowNull: false })
  declare classroomId: string;

  @ForeignKey(() => Curriculum)
  @Column({ type: DataType.UUID, allowNull: false })
  declare curriculumId: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
