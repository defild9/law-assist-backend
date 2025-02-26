import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import {
  Сonversation,
  ConversationDocument,
} from 'src/schemas/conversation.schema';
import { Message, MessageDocument } from 'src/schemas/message.schema';

@Injectable()
export class ConversationService {
  constructor(
    @InjectModel(Сonversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async createConversation(userId: string): Promise<ConversationDocument> {
    const conversation = new this.conversationModel({ userId });
    return conversation.save();
  }

  async findById(
    conversationId: string,
    userId: string,
  ): Promise<ConversationDocument | null> {
    if (!isValidObjectId(conversationId) || !userId) {
      return null;
    }
    return this.conversationModel
      .findOne({ _id: new Types.ObjectId(conversationId), userId })
      .exec();
  }

  async addMessages(
    conversationId: Types.ObjectId,
    messageIds: Types.ObjectId[],
  ) {
    await this.conversationModel.updateOne(
      { _id: conversationId },
      { $push: { messages: { $each: messageIds } } },
    );
  }

  async getConversationById(conversationId: string, userId: string) {
    try {
      if (!isValidObjectId(conversationId)) {
        throw new NotFoundException('Invalid conversation id');
      }

      const conversation = await this.conversationModel
        .findOne({ _id: conversationId, userId })
        .populate({
          path: 'messages',
          model: 'Message',
          options: { sort: { createdAt: 1 } },
        })
        .exec();

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      return conversation;
    } catch (error) {
      throw error;
    }
  }

  async deleteConversation(conversationId: string, userId: string) {
    if (!isValidObjectId(conversationId)) {
      throw new NotFoundException('Invalid conversation id');
    }

    const conversation = await this.conversationModel
      .findOneAndDelete({ _id: conversationId, userId })
      .exec();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.messageModel.deleteMany({ chatId: conversation._id });

    return {
      success: true,
      message: 'Conversation and its messages were successfully deleted',
    };
  }
}
