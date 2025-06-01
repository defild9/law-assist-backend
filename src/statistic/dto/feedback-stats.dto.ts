import { ApiProperty } from '@nestjs/swagger';

class TagCountDto {
  @ApiProperty({
    description: 'Feedback tag name',
    example: 'helpful',
  })
  name: string;

  @ApiProperty({
    description: 'Number of feedback entries із цим тегом',
    example: 65,
  })
  value: number;
}

export class FeedbackStatsDto {
  @ApiProperty({
    description: 'Масив статистики по тегах (tag → count)',
    type: [TagCountDto],
    example: [
      { name: 'helpful', value: 65 },
      { name: 'off-topic', value: 15 },
    ],
  })
  tagsStatus: TagCountDto[];

  @ApiProperty({
    description: 'Відсоток лайків серед усіх реакцій за період',
    example: 80.0,
  })
  likePercent: number;

  @ApiProperty({
    description: 'Відсоток дизлайків серед усіх реакцій за період',
    example: 20.0,
  })
  dislikePercent: number;
}
