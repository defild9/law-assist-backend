import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FeedbackService } from 'src/feedback/feedback.service';
import { StatisticService } from './statistic.service';
import { CombinedStatsDto } from './dto/combined-stats.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
@ApiTags('Statistic')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
@Controller('statistic')
export class StatisticController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly statisticService: StatisticService,
  ) {}

  @Get()
  @Roles('admin', 'lawyer')
  @ApiOperation({
    summary:
      'Get combined statistics (feedback, activity, summary) for a given period',
  })
  @ApiQuery({
    name: 'days',
    type: Number,
    required: true,
    description: 'Number of days to look back (allowed values: 7, 30, 90)',
    example: 30,
  })
  @ApiOkResponse({
    description:
      'Combined object with feedback, activity, and summary statistics',
    type: CombinedStatsDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid `days` parameter (not one of 7, 30, 90)',
  })
  async getAllStats(
    @Query('days', ParseIntPipe) days: number,
  ): Promise<CombinedStatsDto> {
    const [feedbackStats, activityStats, summaryStats] = await Promise.all([
      this.feedbackService.getStatistics(days),
      this.statisticService.getActivityStats(days),
      this.statisticService.getSummaryStats(days),
    ]);

    return {
      feedback: feedbackStats,
      activity: activityStats,
      summary: summaryStats,
    };
  }
}
