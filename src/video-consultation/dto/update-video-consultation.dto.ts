import { PartialType } from '@nestjs/swagger';
import { CreateVideoConsultationDto } from './create-video-consultation.dto';

export class UpdateVideoConsultationDto extends PartialType(
  CreateVideoConsultationDto,
) {}
