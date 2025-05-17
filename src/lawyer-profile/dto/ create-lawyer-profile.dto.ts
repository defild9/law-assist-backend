import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateLawyerProfileDto {
  @ApiProperty({ example: 'Ivan' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Ivanov' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: 'Petrovich' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional({ example: 'Best Law Firm LLC' })
  @IsOptional()
  @IsString()
  lawFirm?: string;

  @ApiPropertyOptional({ example: 'Corporate Law' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ example: '12345-LAW' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ example: 'I have been practicing for 5 years…' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['MBA in Law', 'PhD in Corporate'],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['English', 'Ukrainian', 'Russian'],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  languages?: string[];
}
