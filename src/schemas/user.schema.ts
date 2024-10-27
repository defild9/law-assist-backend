import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: ['client', 'admin'], default: 'client' })
  userType: 'client' | 'admin';

  @Prop({ default: undefined })
  profile_picture?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
