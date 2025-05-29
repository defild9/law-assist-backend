import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

interface ImagePart {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

interface FilePart {
  type: 'file';
  file: {
    file_data: string;
    filename: string;
  };
}

export type FilePartItem = ImagePart | FilePart;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Сonversation', required: true })
  chatId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  parentId: Types.ObjectId | null;

  @Prop({ required: true, enum: ['user', 'assistant'] })
  role: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Message' }], default: [] })
  children: Types.ObjectId[];

  @Prop({ type: [Object], default: [] })
  files: FilePartItem[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  },
});
