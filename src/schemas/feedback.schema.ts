import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FeedbackDocument = HydratedDocument<Feedback>;

export enum FeedbackType {
  LIKE = 'like',
  DISLIKE = 'dislike',
}

export enum FeedbackTag {
  TOO_SHORT = 'too short',
  OFF_TOPIC = 'off-topic',
  HELPFUL = 'helpful',
  HARMFUL = 'harmful',
  SPAM = 'spam',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message', required: true })
  message: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(FeedbackType) })
  type: FeedbackType;

  @Prop({ required: false, enum: Object.values(FeedbackTag) })
  tag?: FeedbackTag;

  @Prop()
  comment?: string;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
FeedbackSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});
