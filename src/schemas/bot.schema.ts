import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document } from 'mongoose';

export type BotDocument = HydratedDocument<Bot>;

@Schema({ timestamps: true })
export class Bot extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  //   TODO: array of collections
  @Prop({ required: true })
  chromaCollection: string;

  @Prop()
  description?: string;
}

export const BotSchema = SchemaFactory.createForClass(Bot);

BotSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});
