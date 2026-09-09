import { IsString, IsArray, IsOptional, IsNotEmpty } from 'class-validator';

export class AssignBadgesDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  badges: string[];
}

export class UpdateUserBadgesDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  badges: string[];

  @IsOptional()
  @IsString()
  mfaCode?: string; // Required when assigning TU badge
}

export class VerifyBadgeAssignmentMfaDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  mfaCode: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  badges: string[];
}
