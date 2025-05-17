import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsISO8601 } from 'class-validator';

export class UpdateScheduleDto {
  @ApiProperty({
    description: 'The scheduled date of the consultation',
    type: Date,
    example: '2021-01-01T00:00:00.000Z',
    required: true,
  })
  @IsISO8601()
  scheduledAt: Date;
}
