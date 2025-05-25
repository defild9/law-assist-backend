import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SubscriptionPlan extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop()
  trialPeriodDays?: number;

  @Prop()
  stripePriceId?: string;
}

export const SubscriptionPlanSchema =
  SchemaFactory.createForClass(SubscriptionPlan);

SubscriptionPlanSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});
