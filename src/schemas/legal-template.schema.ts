import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type BotDocument = HydratedDocument<LegalTemplate>;

@Schema({ timestamps: true })
export class LegalTemplate extends Document {
  @Prop({ required: true, unique: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  category?: string;
}

export const LegalTemplateSchema = SchemaFactory.createForClass(LegalTemplate);

LegalTemplateSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});
