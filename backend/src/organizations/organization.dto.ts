import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { INDUSTRIES } from '../domain/industries';
import { IsWebsite, Trim, TrimToNull, WebsiteToNull } from '../common/validation';

const INDUSTRY_MESSAGE = 'Choose an industry from the list';

export class CreateOrganizationDto {
  @Trim()
  @IsString({ message: 'Enter a name' })
  @IsNotEmpty({ message: 'Enter a name' })
  @MaxLength(200)
  name: string;

  @WebsiteToNull()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsWebsite()
  website?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsIn(INDUSTRIES, { message: INDUSTRY_MESSAGE })
  industry?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  notes?: string | null;
}

export class UpdateOrganizationDto {
  @Trim()
  @ValidateIf((_, v) => v !== undefined)
  @IsString({ message: 'Enter a name' })
  @IsNotEmpty({ message: 'Enter a name' })
  @MaxLength(200)
  name?: string;

  @WebsiteToNull()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsWebsite()
  website?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsIn(INDUSTRIES, { message: INDUSTRY_MESSAGE })
  industry?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  notes?: string | null;
}
