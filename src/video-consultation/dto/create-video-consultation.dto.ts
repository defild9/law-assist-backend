import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ConsultationStatus } from 'src/schemas/video-consultation.schema';

export class CreateVideoConsultationDto {
  @ApiProperty({
    description: 'Lawyer ID assigned to the consultation',
    example: '60d21b4667d0d8992e610c86',
  })
  @IsMongoId()
  lawyerId: string;

  @ApiProperty({
    description: 'Scheduled date and time in ISO format',
    example: '2025-05-10T15:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  scheduledAt: string;

  @ApiProperty({
    description: 'Initial status of the consultation',
    enum: ConsultationStatus,
    default: ConsultationStatus.PENDING,
    required: false,
  })
  @IsEnum(ConsultationStatus)
  @IsOptional()
  status?: ConsultationStatus;

  @ApiProperty({
    description: 'Room identifier for the video call',
    example: 'room-1234',
    required: false,
  })
  @IsString()
  @IsOptional()
  room?: string;

  @ApiProperty({
    description: 'Additional notes or instructions',
    example: 'Client has urgent questions about contract review',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
