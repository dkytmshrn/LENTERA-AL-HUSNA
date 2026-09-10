import {
  Column,
  DataType,
  Model,
  Table,
  Unique,
  CreatedAt,
  UpdatedAt,
  Default,
  BeforeCreate,
} from 'sequelize-typescript';

export enum AccountRole {
  GUEST = 'Guest',
  STUDENT = 'Student',
  TEACHER = 'Teacher',
  PRINCIPAL = 'Principal',
  SYSADMIN = 'SysAdmin',
}

export enum AccountStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  SUSPENDED = 'Suspended',
}

export enum AccountGender {
  MALE = 'Male',
  FEMALE = 'Female',
}

@Table({
  tableName: 'accounts',
  timestamps: true,
})
export class Account extends Model {
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
    type: DataType.STRING(100),
  })
  declare badge: string;

  @Default(AccountRole.GUEST)
  @Column({
    type: DataType.ENUM(...Object.values(AccountRole)),
    allowNull: false,
  })
  declare role: AccountRole;

  @Column({
    type: DataType.DATEONLY,
  })
  declare birthday: Date;

  @Default(AccountGender.MALE)
  @Column({
    type: DataType.ENUM(...Object.values(AccountGender)),
  })
  declare gender: AccountGender;

  @Unique
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare password: string;

  @Unique
  @Column({
    type: DataType.STRING(20),
  })
  declare phoneNumber: string;

  @Column({
    type: DataType.STRING(255),
  })
  declare parentName: string;

  @Default(AccountStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(AccountStatus)),
    allowNull: false,
  })
  declare status: AccountStatus;

  @Column({
    type: DataType.STRING(255),
  })
  declare passwordResetToken?: string;

  @Column({
    type: DataType.DATE,
  })
  declare passwordResetExpires?: Date;

  @Column({
    type: DataType.STRING(255),
  })
  declare refreshToken?: string;

  @Column({
    type: DataType.DATE,
  })
  declare refreshTokenExpiresAt?: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare emailVerified: boolean;

  @Column({
    type: DataType.DATE,
  })
  declare lastLoginAt?: Date;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
