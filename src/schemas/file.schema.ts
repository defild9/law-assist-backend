import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type FileDocument = HydratedDocument<File>;

@Schema({ _id: false })
export class File {
  @Prop({ required: true })
  source: string;

  @Prop({ required: true, type: Date })
  firstAdded: Date;

  @Prop({ required: true, type: Date })
  lastUpdated: Date;
}

export const FileSchema = SchemaFactory.createForClass(File);
