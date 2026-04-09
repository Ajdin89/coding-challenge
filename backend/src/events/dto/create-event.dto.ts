import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsDateString()
  startUtc!: string;

  @IsDateString()
  endUtc!: string;

  @IsString()
  @IsNotEmpty()
  timezone!: string;
}
