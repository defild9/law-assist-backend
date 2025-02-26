import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from 'src/schemas/message.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async create(messageData: Partial<Message>): Promise<MessageDocument> {
    const message = new this.messageModel({
      ...messageData,
      chatId: new Types.ObjectId(messageData.chatId),
      parentId: messageData.parentId
        ? new Types.ObjectId(messageData.parentId)
        : null,
    });
    return message.save();
  }

  async addChild(parentId: Types.ObjectId, childId: Types.ObjectId) {
    await this.messageModel.updateOne(
      { _id: parentId },
      { $push: { children: childId } },
    );
  }

  async getLastMessage(
    chatId: Types.ObjectId,
  ): Promise<MessageDocument | null> {
    return this.messageModel.findOne({ chatId }).sort({ createdAt: -1 }).exec();
  }

  async getMessagesByChat(chatId: string) {
    return this.messageModel
      .find({ chatId: new Types.ObjectId(chatId) })
      .sort({ createdAt: 1 })
      .exec();
  }
}
