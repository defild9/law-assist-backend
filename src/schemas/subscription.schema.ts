import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionStatus = 'active' | 'canceled' | 'paused' | 'expired';

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubscriptionPlan', required: true })
  plan: Types.ObjectId;

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

SubscriptionSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});
