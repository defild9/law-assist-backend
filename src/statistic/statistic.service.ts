import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/schemas/user.schema';
import { Bot, BotDocument } from 'src/schemas/bot.schema';
import { Subscription } from 'rxjs';
import {
  Сonversation,
  ConversationDocument,
} from 'src/schemas/conversation.schema';
import { Feedback, FeedbackDocument } from 'src/schemas/feedback.schema';
import {
  VideoConsultation,
  VideoConsultationDocument,
} from 'src/schemas/video-consultation.schema';
import { SubscriptionDocument } from 'src/schemas/subscription.schema';

interface SummaryStats {
  totalUsers: number;
  totalBots: number;
  totalLawyers: number;
  totalFeedback: number;
  totalSubscriptions: number;
  totalVideoConsultations: number;
  totalConversations: number;

  userGrowth: number;
  botGrowth: number;
  lawyerGrowth: number;
  feedbackGrowth: number;
  subscriptionGrowth: number;
  vcGrowth: number;
  conversationGrowth: number;
}

@Injectable()
export class StatisticService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Bot.name) private readonly botModel: Model<BotDocument>,
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(VideoConsultation.name)
    private readonly vcModel: Model<VideoConsultationDocument>,
    @InjectModel(Сonversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
  ) {}

  async getActivityStats(
    days: number,
  ): Promise<{ date: string; users: number; bots: number; lawyers: number }[]> {
    const allowed = [7, 30, 90];
    if (!allowed.includes(days)) {
      throw new BadRequestException(`Only ${allowed.join(', ')} days allowed`);
    }

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Аггрегуємо користувачів: групуємо за ролями й датою створення (YYYY-MM-DD)
    const userAgg = await this.userModel.aggregate<{
      _id: { date: string; role: string };
      count: number;
    }>([
      { $match: { createdAt: { $gte: fromDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            role: '$role',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Аггрегуємо боти: групуємо тільки за датою створення (YYYY-MM-DD)
    const botAgg = await this.botModel.aggregate<{
      _id: string;
      count: number;
    }>([
      { $match: { createdAt: { $gte: fromDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]);

    // Формуємо мапу, де ключ — дата, а значення — об’єкт із лічильниками
    const dateMap = new Map<
      string,
      { users: number; bots: number; lawyers: number }
    >();

    // Заповнюємо по користувачах
    for (const entry of userAgg) {
      const date = entry._id.date;
      const role = entry._id.role;
      if (!dateMap.has(date)) {
        dateMap.set(date, { users: 0, bots: 0, lawyers: 0 });
      }
      const bucket = dateMap.get(date)!;
      if (role === 'user') bucket.users += entry.count;
      else if (role === 'lawyer') bucket.lawyers += entry.count;
      // ролі 'admin' можна ігнорувати, якщо їх не потрібно показувати в цій статистиці
    }

    // Заповнюємо по ботах
    for (const entry of botAgg) {
      const date = entry._id;
      if (!dateMap.has(date)) {
        dateMap.set(date, { users: 0, bots: 0, lawyers: 0 });
      }
      dateMap.get(date)!.bots += entry.count;
    }

    // Переносимо в масив та сортуємо за датою
    const result = Array.from(dateMap.entries())
      .map(([date, counts]) => ({
        date,
        users: counts.users,
        bots: counts.bots,
        lawyers: counts.lawyers,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }

  private computeGrowth(totalNow: number, totalBefore: number): number {
    if (totalBefore === 0) {
      return totalNow > 0 ? 100 : 0;
    }
    const diff = totalNow - totalBefore;
    return parseFloat(((diff / totalBefore) * 100).toFixed(1));
  }

  async getSummaryStats(days: number): Promise<SummaryStats> {
    const allowed = [7, 30, 90];
    if (!allowed.includes(days)) {
      throw new BadRequestException(
        `Параметр days повинен бути одним із: ${allowed.join(', ')}.`,
      );
    }

    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(fromDate.getDate() - days);

    // ——————— USERS ———————
    const totalUsers = await this.userModel.countDocuments().exec();
    const usersBeforeCount = await this.userModel
      .countDocuments({ createdAt: { $lt: fromDate } })
      .exec();
    const totalLawyers = await this.userModel
      .countDocuments({ role: 'lawyer' })
      .exec();
    const lawyersBeforeCount = await this.userModel
      .countDocuments({ role: 'lawyer', createdAt: { $lt: fromDate } })
      .exec();
    // Note: when counting Bot-entity separately, “bot users” are in Bot collection.

    // ——————— BOTS ———————
    const totalBots = await this.botModel.countDocuments().exec();
    const botsBeforeCount = await this.botModel
      .countDocuments({ createdAt: { $lt: fromDate } })
      .exec();

    // ——————— FEEDBACK ———————
    const totalFeedback = await this.feedbackModel.countDocuments().exec();
    const feedbackBeforeCount = await this.feedbackModel
      .countDocuments({ createdAt: { $lt: fromDate } })
      .exec();

    // ——————— SUBSCRIPTIONS ———————
    const totalSubscriptions = await this.subscriptionModel
      .countDocuments()
      .exec();
    const subscriptionsBeforeCount = await this.subscriptionModel
      .countDocuments({ createdAt: { $lt: fromDate } })
      .exec();

    // ——————— VIDEO CONSULTATIONS ———————
    const totalVideoConsultations = await this.vcModel.countDocuments().exec();
    const vcBeforeCount = await this.vcModel
      .countDocuments({ createdAt: { $lt: fromDate } })
      .exec();

    // ——————— CONVERSATIONS ———————
    const totalConversations = await this.conversationModel
      .countDocuments()
      .exec();
    const convBeforeCount = await this.conversationModel
      .countDocuments({ createdAt: { $lt: fromDate } })
      .exec();

    return {
      totalUsers,
      totalBots,
      totalLawyers,
      totalFeedback,
      totalSubscriptions,
      totalVideoConsultations,
      totalConversations,

      userGrowth: this.computeGrowth(totalUsers, usersBeforeCount),
      botGrowth: this.computeGrowth(totalBots, botsBeforeCount),
      lawyerGrowth: this.computeGrowth(totalLawyers, lawyersBeforeCount),
      feedbackGrowth: this.computeGrowth(totalFeedback, feedbackBeforeCount),
      subscriptionGrowth: this.computeGrowth(
        totalSubscriptions,
        subscriptionsBeforeCount,
      ),
      vcGrowth: this.computeGrowth(totalVideoConsultations, vcBeforeCount),
      conversationGrowth: this.computeGrowth(
        totalConversations,
        convBeforeCount,
      ),
    };
  }
}
