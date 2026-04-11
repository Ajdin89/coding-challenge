import {
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsArray,
  IsOptional,
  ArrayNotEmpty,
  ArrayUnique,
} from 'class-validator';

export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class RecurrenceDto {
  @IsEnum(RecurrenceFrequency)
  frequency!: RecurrenceFrequency;

  @IsInt()
  @Min(1)
  @Max(365)
  interval!: number;

  /** 0 = Sunday … 6 = Saturday. Only meaningful for weekly recurrence. */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek?: number[];

  /** Inclusive end date of the series, YYYY-MM-DD. */
  @IsDateString()
  until!: string;
}
