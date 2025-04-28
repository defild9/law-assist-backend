import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Subscription,
  SubscriptionStatus,
} from 'src/schemas/subscription.schema';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
  ) {}

  async create(subscriptionData: Partial<Subscription>) {
    const subscription = new this.subscriptionModel(subscriptionData);
    return subscription.save();
  }

  async findActiveSubscription(userId: string) {
    return this.subscriptionModel.findOne({
      user: userId,
      status: 'active',
      endDate: { $gt: new Date() },
    });
  }

  async updateSubscription(
    subscriptionId: string,
    updateData: Partial<Subscription>,
  ) {
    return this.subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      updateData,
      {
        new: true,
      },
    );
  }

  async cancelSubscription(subscriptionId: string) {
    return this.subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      {
        status: 'canceled',
        cancellationDate: new Date(),
        autoRenew: false,
      },
      { new: true },
    );
  }

  async findById(subscriptionId: string) {
    return this.subscriptionModel.findById(subscriptionId);
  }

  async deleteSubscription(subscriptionId: string) {
    return this.subscriptionModel.findByIdAndDelete(subscriptionId);
  }

  async getUserSubscriptions(userId: string) {
    return this.subscriptionModel
      .find({ user: userId })
      .sort({ createdAt: -1 });
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus,
  ) {
    return this.subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      { status },
      { new: true },
    );
  }
}
