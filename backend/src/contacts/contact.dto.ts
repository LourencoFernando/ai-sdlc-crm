import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { Trim, TrimToNull } from '../common/validation';

export const CONTACT_STATUSES = ['lead', 'qualified', 'customer'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

const EMAIL_MESSAGE = 'Enter a valid email address';
const lowerEmail = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() || null : value));

export class CreateContactDto {
  @Trim()
  @IsString({ message: 'Enter a first name' })
  @IsNotEmpty({ message: 'Enter a first name' })
  @MaxLength(100)
  firstName: string;

  @Trim()
  @IsString({ message: 'Enter a last name' })
  @IsNotEmpty({ message: 'Enter a last name' })
  @MaxLength(100)
  lastName: string;

  @lowerEmail()
  @IsOptional()
  @IsEmail({}, { message: EMAIL_MESSAGE })
  email?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  jobTitle?: string | null;

  @IsOptional()
  @IsInt({ message: 'Choose an organization' })
  organizationId?: number | null;

  @IsOptional()
  @IsIn(CONTACT_STATUSES, { message: 'Choose Lead, Qualified or Customer' })
  status?: ContactStatus;
}

export class UpdateContactDto {
  @Trim()
  @ValidateIf((_, v) => v !== undefined)
  @IsString({ message: 'Enter a first name' })
  @IsNotEmpty({ message: 'Enter a first name' })
  @MaxLength(100)
  firstName?: string;

  @Trim()
  @ValidateIf((_, v) => v !== undefined)
  @IsString({ message: 'Enter a last name' })
  @IsNotEmpty({ message: 'Enter a last name' })
  @MaxLength(100)
  lastName?: string;

  @lowerEmail()
  @IsOptional()
  @IsEmail({}, { message: EMAIL_MESSAGE })
  email?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  jobTitle?: string | null;

  @IsOptional()
  @IsInt({ message: 'Choose an organization' })
  organizationId?: number | null;

  @ValidateIf((_, v) => v !== undefined)
  @IsIn(CONTACT_STATUSES, { message: 'Choose Lead, Qualified or Customer' })
  status?: ContactStatus;

  /** Confirms that deals with this contact as main contact may lose it (organization change). */
  @IsOptional()
  @IsBoolean()
  confirmUnlink?: boolean;
}
