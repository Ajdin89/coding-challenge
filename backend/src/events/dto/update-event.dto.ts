import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
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
}
