// src/statistic/dto/combined-stats.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { FeedbackStatsDto } from './feedback-stats.dto';

export class ActivityDto {
  @ApiProperty({
    example: '2025-05-25',
    description: 'Дата у форматі YYYY-MM-DD',
  })
  date: string;

  @ApiProperty({
    example: 150,
    description: 'Кількість звичайних користувачів, створених у цей день',
  })
  users: number;

  @ApiProperty({
    example: 30,
    description: 'Кількість ботів, створених у цей день',
  })
  bots: number;

  @ApiProperty({
    example: 45,
    description: 'Кількість юристів, створених у цей день',
  })
  lawyers: number;
}

export class SummaryDto {
  @ApiProperty({
    example: 1234,
    description: 'Загальна кількість користувачів',
  })
  totalUsers: number;

  @ApiProperty({ example: 45, description: 'Загальна кількість ботів' })
  totalBots: number;

  @ApiProperty({ example: 78, description: 'Загальна кількість юристів' })
  totalLawyers: number;

  @ApiProperty({
    example: 890,
    description: 'Загальна кількість відгуків',
  })
  totalFeedback: number;

  @ApiProperty({
    example: 120,
    description: 'Загальна кількість підписок',
  })
  totalSubscriptions: number;

  @ApiProperty({
    example: 300,
    description: 'Загальна кількість відеоконсультацій',
  })
  totalVideoConsultations: number;

  @ApiProperty({
    example: 560,
    description: 'Загальна кількість чатів',
  })
  totalConversations: number;

  @ApiProperty({
    example: 12.5,
    description: 'Відсоток росту користувачів за період',
  })
  userGrowth: number;

  @ApiProperty({
    example: 8.3,
    description: 'Відсоток росту ботів за період',
  })
  botGrowth: number;

  @ApiProperty({
    example: 15.7,
    description: 'Відсоток росту юристів за період',
  })
  lawyerGrowth: number;

  @ApiProperty({
    example: -2.4,
    description: 'Відсоток зміни кількості відгуків за період',
  })
  feedbackGrowth: number;

  @ApiProperty({
    example: 5.0,
    description: 'Відсоток росту підписок за період',
  })
  subscriptionGrowth: number;

  @ApiProperty({
    example: 10.2,
    description: 'Відсоток росту відеоконсультацій',
  })
  vcGrowth: number;

  @ApiProperty({
    example: -1.3,
    description: 'Відсоток зміни кількості чатів за період',
  })
  conversationGrowth: number;
}

export class CombinedStatsDto {
  @ApiProperty({
    description: 'Статистика по тегах та реакціям (лайки/дизлайки) за період',
    type: FeedbackStatsDto,
  })
  feedback: FeedbackStatsDto;

  @ApiProperty({
    description:
      'Масив щоденної активності (користувачі, боти, юристи) за період',
    type: [ActivityDto],
  })
  activity: ActivityDto[];

  @ApiProperty({
    description: 'Зведені підсумкові лічильники та відсотки росту',
    type: SummaryDto,
    example: {
      totalUsers: 1234,
      totalBots: 45,
      totalLawyers: 78,
      totalFeedback: 890,
      totalSubscriptions: 120,
      totalVideoConsultations: 300,
      totalConversations: 560,
      userGrowth: 12.5,
      botGrowth: 8.3,
      lawyerGrowth: 15.7,
      feedbackGrowth: -2.4,
      subscriptionGrowth: 5.0,
      vcGrowth: 10.2,
      conversationGrowth: -1.3,
    },
  })
  summary: SummaryDto;
}
