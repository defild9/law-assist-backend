import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LawyerProfileDocument = LawyerProfile & Document;

@Schema({ timestamps: true })
export class LawyerProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  middleName?: string;

  @Prop()
  lawFirm?: string;

  @Prop()
  specialization?: string;

  @Prop()
  licenseNumber?: string;

  @Prop()
  yearsOfExperience?: number;

  @Prop()
  bio?: string;

  @Prop([String])
  certifications?: string[];

  @Prop([String])
  languages?: string[];
}

export const LawyerProfileSchema = SchemaFactory.createForClass(LawyerProfile);

LawyerProfileSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

LawyerProfileSchema.set('toObject', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
