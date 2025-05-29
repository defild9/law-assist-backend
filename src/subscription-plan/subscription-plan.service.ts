import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubscriptionPlan } from 'src/schemas/subscription-plan.schema';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionPlanService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-04-30.basil',
  });

  constructor(
    @InjectModel(SubscriptionPlan.name)
    private readonly planModel: Model<SubscriptionPlan>,
  ) {}

  async create(dto: CreateSubscriptionPlanDto) {
    try {
      const product = await this.stripe.products.create({
        name: dto.name,
        description: dto.description,
      });

      const price = await this.stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(dto.price * 100),
        currency: 'usd',
        recurring: {
          interval: 'month',
          ...(dto.trialPeriodDays && {
            trial_period_days: dto.trialPeriodDays,
          }),
        },
        lookup_key: dto.name,
      });

      const created = new this.planModel({ ...dto, stripePriceId: price.id });

      const savedPlan = await created.save();

      return savedPlan;
    } catch (error) {
      throw new Error('Error creating Stripe price');
    }
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.planModel.find(query).skip(skip).limit(limit).exec(),
      this.planModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Invalid plan ID');
    const plan = await this.planModel.findById(id).exec();
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto) {
    const plan = await this.findOne(id);

    const updated = await this.planModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();

    if (dto.price && plan.stripePriceId) {
      try {
        await this.stripe.prices.update(plan.stripePriceId, { active: false });
        const oldPrice = await this.stripe.prices.retrieve(plan.stripePriceId);
        const newPrice = await this.stripe.prices.create({
          product: oldPrice.product as string,
          unit_amount: Math.round(dto.price * 100),
          currency: 'usd',
          recurring: {
            interval: 'month',
            ...(plan.trialPeriodDays && {
              trial_period_days: plan.trialPeriodDays,
            }),
          },
          lookup_key: plan.name,
          metadata: {
            planId: plan.id,
          },
        });

        await this.planModel.findByIdAndUpdate(id, {
          stripePriceId: newPrice.id,
        });

        return updated;
      } catch (error) {
        console.error('Error updating Stripe price:', error);
        return updated;
      }
    }

    return updated;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid plan ID');
    }

    const plan = await this.findOne(id);

    const deleted = await this.planModel.findByIdAndDelete(id).exec();

    if (plan.stripePriceId) {
      try {
        await this.stripe.prices.update(plan.stripePriceId, { active: false });
      } catch (error) {
        console.error('Error archiving Stripe price:', error);
      }
    }

    if (!deleted) {
      throw new NotFoundException('Plan not found');
    }
    return deleted;
  }

  async findByStripePriceId(stripePriceId: string) {
    return this.planModel.findOne({ stripePriceId }).exec();
  }
}
