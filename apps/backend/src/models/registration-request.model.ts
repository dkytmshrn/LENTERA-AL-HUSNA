import {
  Column,
  DataType,
  Model,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
} from 'sequelize-typescript';

export enum RegistrationStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Table({
  tableName: 'registration_requests',
  timestamps: true,
})
export class RegistrationRequest extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare fullName: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare email: string;

  @Column({
    type: DataType.STRING(20),
  })
  declare phoneNumber: string;

  @Column({
    type: DataType.DATE,
  })
  declare birthday: Date;

  @Column({
    type: DataType.STRING(50),
  })
  declare gender: string;

  @Column({
    type: DataType.STRING(255),
  })
  declare parentName: string;

  @Column({
    type: DataType.STRING(255),
  })
  declare parentPhoneNumber: string;

  @Column({
    type: DataType.TEXT,
  })
  declare reasonForRegistration: string;

  @Default(RegistrationStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(RegistrationStatus)),
    allowNull: false,
  })
  declare status: RegistrationStatus;

  @Column({
    type: DataType.STRING(50),
  })
  declare assignedRole: string;

  @Column({
    type: DataType.STRING(100),
  })
  declare assignedBadge: string;

  @Column({
    type: DataType.DATE,
  })
  declare approvedAt: Date;

  @Column({
    type: DataType.UUID,
  })
  declare approvedBy: string;

  @Column({
    type: DataType.TEXT,
  })
  declare rejectionReason: string;

  @Column({
    type: DataType.STRING(255),
  })
  declare verificationCode: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare otpResendCount: number;

  @Column({
    type: DataType.DATE,
  })
  declare lastOtpSentAt: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare emailVerified: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
