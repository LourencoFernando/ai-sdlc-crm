import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { IsCalendarDate, Trim } from '../common/validation';

export const ACTIVITY_KINDS = ['note', 'call', 'email'] as const;
const KIND_MESSAGE = 'Choose Note, Call or Email';
const DESCRIPTION_MESSAGE = 'Enter a description';

export class CreateActivityDto {
  @IsIn(ACTIVITY_KINDS, { message: KIND_MESSAGE })
  kind: (typeof ACTIVITY_KINDS)[number];

  @Trim()
  @IsString({ message: DESCRIPTION_MESSAGE })
  @IsNotEmpty({ message: DESCRIPTION_MESSAGE })
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsCalendarDate({ message: 'Enter the date it happened' })
  occurredOn?: string;

  @IsOptional()
  @IsCalendarDate({ message: 'Enter the follow-up date' })
  followUpOn?: string | null;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @IsInt()
  contactId?: number | null;

  @IsOptional()
  @IsInt()
  dealId?: number | null;

  /** Logged on a deal, the activity also relates to its main contact unless this is false (A2). */
  @IsOptional()
  @IsBoolean()
  relateToMainContact?: boolean;

  @IsOptional()
  @IsCalendarDate()
  today?: string;
}

export class UpdateActivityDto {
  @ValidateIf((_, v) => v !== undefined)
  @IsIn(ACTIVITY_KINDS, { message: KIND_MESSAGE })
  kind?: (typeof ACTIVITY_KINDS)[number];

  @Trim()
  @ValidateIf((_, v) => v !== undefined)
  @IsString({ message: DESCRIPTION_MESSAGE })
  @IsNotEmpty({ message: DESCRIPTION_MESSAGE })
  @MaxLength(2000)
  description?: string;

  @ValidateIf((_, v) => v !== undefined)
  @IsCalendarDate({ message: 'Enter the date it happened' })
  occurredOn?: string;

  @IsOptional()
  @IsCalendarDate({ message: 'Enter the follow-up date' })
  followUpOn?: string | null;

  @ValidateIf((_, v) => v !== undefined)
  @IsBoolean()
  done?: boolean;
}
