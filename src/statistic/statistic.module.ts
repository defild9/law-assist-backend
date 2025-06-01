import { Module } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { StatisticController } from './statistic.controller';
import { FeedbackModule } from 'src/feedback/feedback.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Bot, BotSchema } from 'src/schemas/bot.schema';
import { User, UserSchema } from 'src/schemas/user.schema';
import { Subscription } from 'rxjs';
import {
  Сonversation,
  СonversationSchema,
} from 'src/schemas/conversation.schema';
import { Feedback, FeedbackSchema } from 'src/schemas/feedback.schema';
import { SubscriptionSchema } from 'src/schemas/subscription.schema';
import {
  VideoConsultation,
  VideoConsultationSchema,
} from 'src/schemas/video-consultation.schema';

@Module({
  imports: [
    FeedbackModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Bot.name, schema: BotSchema },
      { name: Feedback.name, schema: FeedbackSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: VideoConsultation.name, schema: VideoConsultationSchema },
      { name: Сonversation.name, schema: СonversationSchema },
    ]),
  ],
  controllers: [StatisticController],
  providers: [StatisticService],
})
export class StatisticModule {}
