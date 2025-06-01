import { ApiProperty } from '@nestjs/swagger';

export class StatisticDto {
  @ApiProperty({
    description: 'Feedback tag name (raw value from database)',
    example: 'helpful',
  })
  name: string;

  @ApiProperty({
    description: 'Number of feedback entries for this tag',
    example: 65,
  })
  value: number;
}
