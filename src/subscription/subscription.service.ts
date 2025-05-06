import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription } from 'src/schemas/subscription.schema';
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
}
