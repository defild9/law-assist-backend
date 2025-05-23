import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { FileSchema } from './file.schema';

export type VectorCollectionDocument = HydratedDocument<VectorCollection>;

@Schema({ timestamps: true })
export class VectorCollection extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ type: [FileSchema], default: [] })
  files: Types.DocumentArray<File>;
}

export const VectorCollectionSchema =
  SchemaFactory.createForClass(VectorCollection);

VectorCollectionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});
