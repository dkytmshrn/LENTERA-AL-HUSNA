import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';

const phoneNumberRegex = /^(?:\+62|62|0)[0-9\s\-()]{8,15}$/;

export class RegisterAccountDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @Matches(phoneNumberRegex, {
    message:
      'Phone number must be a valid Indonesian local or international format, e.g. 0812xxxx or +62812xxxx',
  })
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  parentName?: string;

  @IsOptional()
  @Matches(phoneNumberRegex, {
    message:
      'Parent phone number must be a valid Indonesian local or international format, e.g. 0812xxxx or +62812xxxx',
  })
  @MaxLength(20)
  parentPhoneNumber?: string;

  @IsOptional()
  @IsString()
  reasonForRegistration?: string;
}

export class VerifyEmailDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  verificationCode: string;

  @IsOptional()
  @IsUUID()
  registrationRequestId?: string;
}

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class UpdatePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  resetCode: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @Matches(phoneNumberRegex, {
    message:
      'Phone number must be a valid Indonesian local or international format, e.g. 0812xxxx or +62812xxxx',
  })
  @MaxLength(20)
  phoneNumber?: string;
}

export class DeactivateAccountDto {
  @IsNotEmpty()
  @IsString()
  otp: string;
}

export class CreateTemporaryPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
