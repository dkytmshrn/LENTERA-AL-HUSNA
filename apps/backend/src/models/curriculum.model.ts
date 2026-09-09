import {
  Column,
  DataType,
  Model,
  Table,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'curriculums',
  timestamps: true,
})
export class Curriculum extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING(120),
    allowNull: false,
  })
  declare subjectName: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  declare gradeLevel: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: () => new Date().getFullYear(),
  })
  declare year: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare endYear?: number | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare teacherIds?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare teacherNames?: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
