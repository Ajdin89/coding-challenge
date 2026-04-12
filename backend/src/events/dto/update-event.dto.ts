import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  Matches,
} from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsDateString()
  startUtc?: string;

  @IsOptional()
  @IsDateString()
  endUtc?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  timezone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/, { message: 'color must be a hex value like #3B82F6' })
  color?: string | null;
}
