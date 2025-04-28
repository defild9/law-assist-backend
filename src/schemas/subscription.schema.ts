import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'paused' | 'expired';

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free',
  })
  plan: SubscriptionPlan;

  @Prop({
    required: true,
    enum: ['active', 'canceled', 'paused', 'expired'],
    default: 'active',
  })
  status: SubscriptionStatus;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  renewalDate?: Date;

  @Prop()
  cancellationDate?: Date;

  @Prop({ default: true })
  autoRenew: boolean;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
