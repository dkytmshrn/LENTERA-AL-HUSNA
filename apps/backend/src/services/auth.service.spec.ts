import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Account } from '../models/account.model';
import { Classroom, ClassroomStudent } from '../models/classroom.model';
import { RegistrationRequest } from '../models/registration-request.model';
import { PasswordUtil } from '../utils/password.util';

describe('AuthService verifyEmailOTP', () => {
  const service = new AuthService({} as any, {} as any, {
    sendOTPEmail: jest.fn().mockResolvedValue(true),
  } as any);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws a bad request when the verification code is missing from the stored registration request', async () => {
    jest.spyOn(Account, 'findOne').mockResolvedValue(null);
    jest.spyOn(RegistrationRequest, 'findAll').mockResolvedValue([
      {
        id: 'request-1',
        email: 'user@example.com',
        emailVerified: false,
        createdAt: new Date(),
        verificationCode: undefined,
        otpResendCount: 0,
        name: 'User',
        update: jest.fn().mockResolvedValue({
          id: 'request-1',
          email: 'user@example.com',
          verificationCode: 'hashed-new-otp',
        }),
      },
    ] as any);
    jest.spyOn(RegistrationRequest, 'findOne').mockResolvedValue({
      id: 'request-1',
      email: 'user@example.com',
      emailVerified: false,
      createdAt: new Date(),
      verificationCode: undefined,
      otpResendCount: 0,
      name: 'User',
      update: jest.fn().mockResolvedValue({
        id: 'request-1',
        email: 'user@example.com',
        verificationCode: 'hashed-new-otp',
      }),
    } as any);

    await expect(service.verifyEmailOTP('user@example.com', '123456')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('reuses the pending registration request and replaces its OTP instead of creating a duplicate record', async () => {
    const existingRequest = {
      id: 'request-1',
      email: 'user@example.com',
      name: 'User',
      fullName: 'User Example',
      phoneNumber: '081234567890',
      birthday: '1998-01-01',
      gender: 'male',
      parentName: 'Parent',
      parentPhoneNumber: '081234567891',
      reasonForRegistration: 'testing',
      emailVerified: false,
      status: 'Pending',
      verificationCode: 'old-hash',
      otpResendCount: 0,
      lastOtpSentAt: new Date(),
      createdAt: new Date(),
      update: jest.fn().mockResolvedValue({
        id: 'request-1',
        email: 'user@example.com',
        verificationCode: 'new-hash',
      }),
    };

    jest.spyOn(Account, 'findOne').mockResolvedValue(null);
    jest.spyOn(RegistrationRequest, 'findAll').mockResolvedValue([existingRequest] as any);
    const createSpy = jest.spyOn(RegistrationRequest, 'create');

    const result = await service.registerUser({
      name: 'User',
      fullName: 'User Example',
      email: 'user@example.com',
      phoneNumber: '081234567890',
      birthday: '1998-01-01',
      gender: 'male',
      parentName: 'Parent',
      parentPhoneNumber: '081234567891',
      reasonForRegistration: 'testing',
    });

    expect(createSpy).not.toHaveBeenCalled();
    expect(existingRequest.update).toHaveBeenCalled();
    expect(result.email).toBe('user@example.com');
  });

  it('does not generate a new OTP when verify-email fails with an invalid code', async () => {
    const emailService = {
      sendOTPEmail: jest.fn().mockResolvedValue(true),
    };
    const serviceWithEmail = new AuthService({} as any, {} as any, emailService as any);

    const request = {
      id: 'request-2',
      email: 'user@example.com',
      name: 'User',
      emailVerified: false,
      createdAt: new Date(),
      verificationCode: '$2b$12$abcdefghijklmnopqrstuv',
      otpResendCount: 0,
      update: jest.fn(),
    };

    jest.spyOn(Account, 'findOne').mockResolvedValue(null);
    jest.spyOn(RegistrationRequest, 'findAll').mockResolvedValue([request] as any);

    await expect(serviceWithEmail.verifyEmailOTP('user@example.com', '000000')).rejects.toThrow(
      'Invalid or expired verification code.',
    );

    expect(emailService.sendOTPEmail).not.toHaveBeenCalled();
  });

  it('throws a clear validation error instead of crashing bcrypt when the stored verification code is missing', async () => {
    const request = {
      id: 'request-missing-hash',
      email: 'user@example.com',
      name: 'User',
      emailVerified: false,
      createdAt: new Date(),
      verificationCode: undefined,
      otpResendCount: 0,
      destroy: jest.fn().mockResolvedValue(true),
      update: jest.fn(),
    };

    jest.spyOn(Account, 'findOne').mockResolvedValue(null);
    jest.spyOn(RegistrationRequest, 'findOne').mockResolvedValue(request as any);
    const compareSpy = jest.spyOn(PasswordUtil, 'comparePassword');

    await expect(service.verifyEmailOTP('user@example.com', '123456', 'request-missing-hash')).rejects.toThrow(
      'The stored verification code is missing.',
    );

    expect(compareSpy).not.toHaveBeenCalled();
  });

  it('verifies only the selected registration request by id and removes duplicate pending requests for the same email after success', async () => {
    const targetRequest = {
      id: 'request-selected',
      email: 'user@example.com',
      name: 'User',
      emailVerified: false,
      createdAt: new Date(),
      verificationCode: '$2b$12$abcdefghijklmnopqrstuv',
      status: 'Pending',
      update: jest.fn().mockResolvedValue(true),
    };

    jest.spyOn(Account, 'findOne').mockResolvedValue(null);
    jest.spyOn(RegistrationRequest, 'findOne').mockResolvedValue(targetRequest as any);
    jest.spyOn(RegistrationRequest, 'destroy').mockResolvedValue(1 as any);

    const compareSpy = jest.spyOn(PasswordUtil, 'comparePassword').mockResolvedValue(true);

    await service.verifyEmailOTP('user@example.com', '123456', 'request-selected');

    expect(compareSpy).toHaveBeenCalledWith('123456', targetRequest.verificationCode);
    expect(targetRequest.update).toHaveBeenCalledWith({ emailVerified: true });
    expect(RegistrationRequest.destroy).toHaveBeenCalled();
  });

  it('lists registration requests for admin dashboard without exposing the raw verification hash', async () => {
    const serviceWithAdmin = new AuthService({} as any, {} as any, {
      sendOTPEmail: jest.fn().mockResolvedValue(true),
    } as any);

    jest.spyOn(RegistrationRequest, 'findAll').mockResolvedValue([
      {
        id: 'request-1',
        name: 'Student',
        fullName: 'Student One',
        email: 'student@example.com',
        phoneNumber: '081234567890',
        birthday: '2008-01-02',
        gender: 'Male',
        parentName: 'Parent One',
        parentPhoneNumber: '081234567891',
        status: 'Pending',
        emailVerified: true,
        verificationCode: 'hashed-secret',
        assignedRole: 'Student',
        rejectionReason: null,
        createdAt: new Date(),
      },
    ] as any);

    const result = await serviceWithAdmin.getRegistrationRequestsForAdmin();

    expect(result[0]).toMatchObject({
      id: 'request-1',
      email: 'student@example.com',
      status: 'Pending',
    });
    expect(result[0].verificationCode).toBeUndefined();
  });

  it('lists user accounts for admin dashboard and excludes password hashes', async () => {
    const serviceWithAdmin = new AuthService({} as any, {} as any, {
      sendOTPEmail: jest.fn().mockResolvedValue(true),
    } as any);

    jest.spyOn(Account, 'findAll').mockResolvedValue([
      {
        id: 'user-1',
        name: 'student.name',
        fullName: 'Student One',
        email: 'student@example.com',
        role: 'Student',
        badge: 'Alpha',
        status: 'Active',
        gender: 'Male',
        phoneNumber: '081234567890',
        password: 'hashed-password',
        createdAt: new Date(),
      },
    ] as any);

    const result = await serviceWithAdmin.getUsersForAdmin();

    expect(result[0]).toMatchObject({
      id: 'user-1',
      email: 'student@example.com',
      role: 'Student',
    });
    expect(result[0].password).toBeUndefined();
  });

  it('approves a registration request with the Guru badge even when no assigned role is sent', async () => {
    const serviceWithAdmin = new AuthService({} as any, {} as any, {
      sendTemporaryPasswordEmail: jest.fn().mockResolvedValue(true),
    } as any);

    const registrationRequest = {
      id: 'request-guru',
      email: 'guru@example.com',
      name: 'Guru User',
      fullName: 'Guru User',
      phoneNumber: '081234567890',
      birthday: '1995-01-01',
      gender: 'female',
      parentName: 'Parent',
      password: 'hashed-password',
      status: 'Pending',
      emailVerified: true,
      update: jest.fn().mockResolvedValue(true),
      destroy: jest.fn().mockResolvedValue(true),
    };

    jest.spyOn(RegistrationRequest, 'findOne').mockResolvedValue(registrationRequest as any);
    const createSpy = jest.spyOn(Account, 'create').mockResolvedValue({
      id: 'user-guru',
      email: 'guru@example.com',
      role: 'Teacher',
      badge: 'Guru',
    } as any);

    const result = await serviceWithAdmin.approveRegistration(
      {
        email: 'guru@example.com',
        assignedRole: '',
        assignedBadge: 'Guru',
      },
      'admin-1',
    );

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'Teacher',
        badge: 'Guru',
      }),
    );
    expect(result.role).toBe('Teacher');
  });

  it('orders teacher lookups by name and merges a homeroom badge into the teacher badge', async () => {
    const serviceWithAdmin = new AuthService({} as any, {} as any, {
      sendOTPEmail: jest.fn().mockResolvedValue(true),
    } as any);

    const teacher = {
      id: 'teacher-2',
      fullName: 'Budi Teacher',
      name: 'Budi Teacher',
      role: 'Teacher',
      badge: 'Guru',
      update: jest.fn().mockResolvedValue(true),
      toJSON: () => ({
        id: 'teacher-2',
        fullName: 'Budi Teacher',
        name: 'Budi Teacher',
        role: 'Teacher',
        badge: 'Guru',
      }),
    };

    jest.spyOn(Account, 'findAll').mockResolvedValue([
      { id: 'teacher-1', fullName: 'Zeta Teacher', name: 'Zeta Teacher', role: 'Teacher', badge: 'Guru', toJSON: () => ({ id: 'teacher-1', fullName: 'Zeta Teacher', name: 'Zeta Teacher', role: 'Teacher', badge: 'Guru' }) },
      teacher,
    ] as any);
    jest.spyOn(Account, 'findByPk').mockResolvedValue(teacher as any);
    jest.spyOn(Classroom, 'create').mockResolvedValue({
      id: 'class-1',
      gradeLevel: '7',
      academicPeriod: 'Genap 2026 - Ganjil 2027',
      classCode: 'A',
      homeroomTeacherId: 'teacher-2',
      homeroomTeacherName: 'Budi Teacher',
    } as any);

    const users = await serviceWithAdmin.getUsersForAdmin({ role: 'Teacher' });
    expect(Array.isArray(users)).toBe(true);
    expect((users as any[]).map((user) => user.fullName)).toEqual(['Zeta Teacher', 'Budi Teacher']);

    const result = await serviceWithAdmin.createClassroom({
      gradeLevel: '7',
      academicPeriod: 'Genap 2026 - Ganjil 2027',
      classCode: 'A',
      homeroomTeacherId: 'teacher-2',
      homeroomTeacherName: 'Budi Teacher',
    });

    expect(teacher.update).toHaveBeenCalledWith({ badge: 'Guru, Wali Kelas' });
    expect(result.homeroomTeacherId).toBe('teacher-2');
  });

  it('updates a user phone number for the current profile and returns the saved record', async () => {
    const serviceWithUser = new AuthService({} as any, {} as any, {
      sendOTPEmail: jest.fn().mockResolvedValue(true),
    } as any);

    const account = {
      id: 'user-005',
      email: 'profile@example.com',
      name: 'Profile',
      fullName: 'Profile User',
      phoneNumber: '081111111111',
      role: 'Student',
      badge: 'Siswa',
      status: 'Active',
      update: jest.fn().mockImplementation(async (updates) => {
        Object.assign(account, updates);
        return account;
      }),
      toJSON: () => ({
        id: 'user-005',
        email: 'profile@example.com',
        name: 'Profile',
        fullName: 'Profile User',
        phoneNumber: account.phoneNumber,
        role: 'Student',
        badge: 'Siswa',
        status: 'Active',
      }),
    };

    jest.spyOn(Account, 'findByPk').mockResolvedValue(account as any);

    const result = await serviceWithUser.updateCurrentUserProfile('user-005', {
      phoneNumber: '+6281234567890',
    });

    expect(account.update).toHaveBeenCalledWith({ phoneNumber: '+6281234567890' });
    expect(result.phoneNumber).toBe('+6281234567890');
  });

  it('counts assigned classroom students without fetching full student records', async () => {
    const serviceWithClassroom = new AuthService({} as any, {} as any, {
      sendOTPEmail: jest.fn().mockResolvedValue(true),
    } as any);

    jest.spyOn(Classroom, 'findAll').mockResolvedValue([
      {
        id: 'classroom-1',
        gradeLevel: '7',
        academicPeriod: 'Genap 2026 - Ganjil 2027',
        classCode: 'A',
        homeroomTeacherId: 'teacher-1',
        homeroomTeacherName: 'Teacher One',
        toJSON: () => ({
          id: 'classroom-1',
          gradeLevel: '7',
          academicPeriod: 'Genap 2026 - Ganjil 2027',
          classCode: 'A',
          homeroomTeacherId: 'teacher-1',
          homeroomTeacherName: 'Teacher One',
        }),
      },
    ] as any);

    jest.spyOn(ClassroomStudent, 'findAll').mockResolvedValue([
      { classroomId: 'classroom-1', studentId: 'student-1' },
      { classroomId: 'classroom-1', studentId: 'student-2' },
    ] as any);

    const accountFindAllSpy = jest.spyOn(Account, 'findAll');

    const result = await serviceWithClassroom.getClassrooms();

    expect(result[0].studentCount).toBe(2);
    expect(result[0].studentIds).toEqual(['student-1', 'student-2']);
    expect(accountFindAllSpy).not.toHaveBeenCalled();
  });

  it('sends a deactivation OTP and confirms it to deactivate the user account', async () => {
    const emailService = {
      sendAccountDeactivationOTPEmail: jest.fn().mockResolvedValue(true),
    };
    const serviceWithUser = new AuthService({} as any, {} as any, emailService as any);

    const account = {
      id: 'user-999',
      email: 'deactivate@example.com',
      name: 'Deactivate',
      fullName: 'Deactivate User',
      status: 'Active',
      passwordResetToken: null,
      passwordResetExpires: null,
      update: jest.fn().mockImplementation(async (updates) => {
        Object.assign(account, updates);
        return account;
      }),
      toJSON: () => ({
        id: 'user-999',
        email: 'deactivate@example.com',
        name: 'Deactivate',
        fullName: 'Deactivate User',
        status: account.status,
      }),
    };

    jest.spyOn(Account, 'findByPk').mockResolvedValue(account as any);

    const otpResult = await serviceWithUser.requestAccountDeactivationOTP('user-999');
    expect(emailService.sendAccountDeactivationOTPEmail).toHaveBeenCalledWith(
      'deactivate@example.com',
      expect.any(String),
      'Deactivate User',
    );

    const otp = (emailService.sendAccountDeactivationOTPEmail as jest.Mock).mock.calls[0][1];
    const finalResult = await serviceWithUser.confirmAccountDeactivation('user-999', otp);

    expect(account.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'Inactive',
      }),
    );
    expect(finalResult.message).toMatch(/deactivated/i);
    expect(otpResult.message).toMatch(/OTP/i);
  });
});
