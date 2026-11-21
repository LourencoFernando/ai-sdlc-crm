import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { STAGE_KEYS, Stage } from '../domain/stages';
import { IsCalendarDate, Trim } from '../common/validation';

const STAGE_MESSAGE = 'Choose a stage';
const VALUE_MESSAGE = 'Enter a value of 0 or more, in whole dollars';
const PROBABILITY_MESSAGE = 'Enter a probability from 0 to 100';

export class CreateDealDto {
  @Trim()
  @IsString({ message: 'Enter a name' })
  @IsNotEmpty({ message: 'Enter a name' })
  @MaxLength(200)
  name: string;

  @IsInt({ message: 'Choose an organization' })
  organizationId: number;

  @IsOptional()
  @IsInt({ message: 'Choose a contact' })
  contactId?: number | null;

  @IsOptional()
  @IsIn(STAGE_KEYS, { message: STAGE_MESSAGE })
  stage?: Stage;

  @IsInt({ message: VALUE_MESSAGE })
  @Min(0, { message: VALUE_MESSAGE })
  value: number;

  @IsOptional()
  @IsInt({ message: PROBABILITY_MESSAGE })
  @Min(0, { message: PROBABILITY_MESSAGE })
  @Max(100, { message: PROBABILITY_MESSAGE })
  probability?: number;

  @IsCalendarDate({ message: 'Enter the expected close date' })
  closeDate: string;

  @IsOptional()
  @IsCalendarDate()
  today?: string;
}

export class UpdateDealDto {
  @Trim()
  @ValidateIf((_, v) => v !== undefined)
  @IsString({ message: 'Enter a name' })
  @IsNotEmpty({ message: 'Enter a name' })
  @MaxLength(200)
  name?: string;

  @ValidateIf((_, v) => v !== undefined)
  @IsInt({ message: 'Choose an organization' })
  organizationId?: number;

  @IsOptional()
  @IsInt({ message: 'Choose a contact' })
  contactId?: number | null;

  @ValidateIf((_, v) => v !== undefined)
  @IsIn(STAGE_KEYS, { message: STAGE_MESSAGE })
  stage?: Stage;

  @ValidateIf((_, v) => v !== undefined)
  @IsInt({ message: VALUE_MESSAGE })
  @Min(0, { message: VALUE_MESSAGE })
  value?: number;

  @ValidateIf((_, v) => v !== undefined)
  @IsInt({ message: PROBABILITY_MESSAGE })
  @Min(0, { message: PROBABILITY_MESSAGE })
  @Max(100, { message: PROBABILITY_MESSAGE })
  probability?: number;

  @ValidateIf((_, v) => v !== undefined)
  @IsCalendarDate({ message: 'Enter the expected close date' })
  closeDate?: string;

  @IsOptional()
  @IsCalendarDate()
  today?: string;
}

export class MoveDealDto {
  @IsIn(STAGE_KEYS, { message: STAGE_MESSAGE })
  stage: Stage;

  @IsInt({ message: 'Send the index as a whole number' })
  @Min(0, { message: 'Send the index as a whole number' })
  index: number;

  @IsOptional()
  @IsCalendarDate()
  today?: string;
}
