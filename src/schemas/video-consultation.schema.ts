import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document, Types } from 'mongoose';

export enum ConsultationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  CANCELED = 'canceled',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class VideoConsultation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  lawyer: Types.ObjectId;

  @Prop()
  scheduledAt: Date;

  @Prop({
    required: true,
    enum: ConsultationStatus,
    default: ConsultationStatus.PENDING,
  })
  status: ConsultationStatus;

  @Prop()
  roomCode?: string;

  @Prop()
  notes?: string;
}

export const VideoConsultationSchema =
  SchemaFactory.createForClass(VideoConsultation);

VideoConsultationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
