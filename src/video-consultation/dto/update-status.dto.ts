import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ConsultationStatus } from 'src/schemas/video-consultation.schema';
export class UpdateStatusDto {
  @ApiProperty({
    description: 'Status of the consultation',
    enum: ConsultationStatus,
    default: ConsultationStatus.PENDING,
    required: false,
  })
  @IsEnum(ConsultationStatus)
  status?: ConsultationStatus;
}
