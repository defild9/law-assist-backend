import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import {
  Subscription,
  SubscriptionStatus,
} from 'src/schemas/subscription.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionPlan } from 'src/schemas/subscription-plan.schema';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<Subscription>,
  ) {}

  async create(
    userId: string,
    dto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const data = {
      user: new Types.ObjectId(userId),
      plan: new Types.ObjectId(dto.plan),
      startDate: dto.startDate ?? new Date(),
      endDate: dto.endDate,
      autoRenew: dto.autoRenew ?? true,
      status: 'active' as const,
    };
    const sub = await this.subscriptionModel.create(data);
    return sub.populate('plan');
  }

  async findActiveSubscription(userId: string) {
    return this.subscriptionModel
      .findOne({ user: userId, status: 'active', endDate: { $gt: new Date() } })
      .populate<{ plan: SubscriptionPlan }>('plan', 'name')
      .exec();
  }

  async updateSubscription(
    subscriptionId: string,
    dto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    if (!Types.ObjectId.isValid(subscriptionId)) {
      throw new NotFoundException('Invalid subscription ID');
    }
    const updated = await this.subscriptionModel
      .findByIdAndUpdate(subscriptionId, dto, {
        new: true,
        runValidators: true,
      })
      .populate('plan')
      .exec();
    if (!updated) {
      throw new NotFoundException('Subscription not found');
    }
    return updated;
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    const updated = await this.subscriptionModel
      .findByIdAndUpdate(
        subscriptionId,
        { status: 'canceled', cancellationDate: new Date(), autoRenew: false },
        { new: true },
      )
      .populate('plan')
      .exec();
    if (!updated) {
      throw new NotFoundException('Subscription not found');
    }
    return updated;
  }

  async findById(subscriptionId: string): Promise<Subscription> {
    if (!Types.ObjectId.isValid(subscriptionId)) {
      throw new NotFoundException('Invalid subscription ID');
    }
    const sub = await this.subscriptionModel
      .findById(subscriptionId)
      .populate('plan')
      .exec();
    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }
    return sub;
  }

  async deleteSubscription(subscriptionId: string): Promise<Subscription> {
    if (!Types.ObjectId.isValid(subscriptionId)) {
      throw new NotFoundException('Invalid subscription ID');
    }
    const deleted = await this.subscriptionModel
      .findByIdAndDelete(subscriptionId)
      .populate('plan')
      .exec();
    if (!deleted) {
      throw new NotFoundException('Subscription not found');
    }
    return deleted;
  }

  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    return this.subscriptionModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('plan')
      .exec();
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    status: Subscription['status'],
  ): Promise<Subscription> {
    if (!Types.ObjectId.isValid(subscriptionId)) {
      throw new NotFoundException('Invalid subscription ID');
    }
    const updated = await this.subscriptionModel
      .findByIdAndUpdate(subscriptionId, { status }, { new: true })
      .populate('plan')
      .exec();
    if (!updated) {
      throw new NotFoundException('Subscription not found');
    }
    return updated;
  }

  async findAll(
    page = 1,
    limit = 10,
    status?: SubscriptionStatus,
    search?: string,
  ): Promise<{
    data: Subscription[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const matchConditions: any = {};
    if (status) {
      matchConditions.status = status;
    }

    const pipeline: any[] = [
      {
        $addFields: {
          userObjId: { $toObjectId: '$user' },
          planObjId: { $toObjectId: '$plan' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userObjId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'planObjId',
          foreignField: '_id',
          as: 'plan',
        },
      },
      { $unwind: '$plan' },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'user.email': { $regex: search, $options: 'i' } },
            { 'user.role': { $regex: search, $options: 'i' } },
            { 'plan.name': { $regex: search, $options: 'i' } },
            { 'plan.description': { $regex: search, $options: 'i' } },
          ],
          ...matchConditions,
        },
      });
    } else if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    pipeline.push({
      $project: {
        _id: 0,
        id: '$_id',
        status: 1,
        startDate: 1,
        endDate: 1,
        renewalDate: 1,
        cancellationDate: 1,
        autoRenew: 1,
        createdAt: 1,
        updatedAt: 1,

        user: {
          id: '$user._id',
          email: '$user.email',
          role: '$user.role',
          refreshToken: '$user.refreshToken',
          isEmailVerified: '$user.isEmailVerified',
          verificationToken: '$user.verificationToken',
          trialEndsAt: '$user.trialEndsAt',
          lastPaymentDate: '$user.lastPaymentDate',
          createdAt: '$user.createdAt',
          updatedAt: '$user.updatedAt',
          subscription: '$user.subscription',
        },

        plan: {
          id: '$plan._id',
          name: '$plan.name',
          description: '$plan.description',
          price: '$plan.price',
          features: '$plan.features',
          createdAt: '$plan.createdAt',
          updatedAt: '$plan.updatedAt',
          stripePriceId: '$plan.stripePriceId',
        },
      },
    });

    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    });

    const result = await this.subscriptionModel.aggregate(pipeline).exec();
    const data = result[0]?.data || [];
    const total = result[0]?.total[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return { data, total, page, totalPages };
  }
}
