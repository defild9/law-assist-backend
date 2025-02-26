import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { console } from 'inspector';
import { isValidObjectId, Model, Types } from 'mongoose';
import {
  Сonversation,
  ConversationDocument,
} from 'src/schemas/conversation.schema';

@Injectable()
export class ConversationService {
  constructor(
    @InjectModel(Сonversation.name)
    private conversationModel: Model<ConversationDocument>,
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

  async getUserConversations(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    if (!userId) {
      throw new NotFoundException('User ID is required');
    }

    const skip = (page - 1) * limit;
    const [conversations, total] = await Promise.all([
      this.conversationModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.conversationModel.countDocuments({ userId }),
    ]);

    return {
      conversations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchConversationByMessageContent(
    userId: string,
    searchText: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      const results = await this.conversationModel.aggregate([
        {
          $lookup: {
            from: 'messages',
            localField: 'messages',
            foreignField: '_id',
            as: 'messages_details',
          },
        },
        {
          $match: {
            userId: userId,
            'messages_details.content': { $regex: searchText, $options: 'i' },
          },
        },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            totalCount: [{ $count: 'total' }],
          },
        },
      ]);

      const { data, totalCount } = results[0] || { data: [], totalCount: [] };
      const total = totalCount[0] ? totalCount[0].total : 0;

      return {
        conversations: data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw error;
    }
  }
}
