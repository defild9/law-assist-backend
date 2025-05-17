import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document, Types } from 'mongoose';

export type UserRole = 'user' | 'admin' | 'lawyer';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    required: true,
    enum: ['user', 'admin', 'lawyer'],
    default: 'user',
  })
  role: UserRole;

  @Prop({ default: undefined })
  profile_picture?: string;

  @Prop({ default: null })
  refreshToken?: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  verificationToken?: string;

  @Prop({ type: Types.ObjectId, ref: 'Subscription' })
  subscription?: Types.ObjectId;

  @Prop({ default: null })
  trialEndsAt?: Date;

  @Prop({ default: null })
  lastPaymentDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'LawyerProfile', default: null })
  lawyerProfile?: Types.ObjectId;

  readonly createdAt: Date;
  readonly updatedAt: Date;

  readonly _id: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

UserSchema.set('toObject', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
