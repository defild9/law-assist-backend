import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bot, BotDocument } from 'src/schemas/bot.schema';
import { VectorStoreService } from 'src/vector-store/vector-store.service';
import { CreateBotDto } from './dto/create-bot.dto';

@Injectable()
export class BotsService {
  constructor(
    @InjectModel(Bot.name)
    private botModel: Model<BotDocument>,
    private readonly vectorStore: VectorStoreService,
  ) {}

  async createBot(createDto: CreateBotDto): Promise<Bot> {
    const collection = await this.vectorStore.getCollectionByName(
      createDto.chromaCollection,
    );

    if (!collection) {
      await this.vectorStore.createCollection(createDto.chromaCollection);
    }

    const bot = new this.botModel(createDto);
    return bot.save();
  }

  async getBots(): Promise<Bot[]> {
    return this.botModel.find().exec();
  }

  async getBotByName(name: string): Promise<Bot | null> {
    return this.botModel.findOne({ name }).exec();
  }

  async deleteBotById(id: string): Promise<Bot | null> {
    return this.botModel.findByIdAndDelete(id).exec();
  }

  async updateBotById(
    id: string,
    updateDto: CreateBotDto,
  ): Promise<Bot | null> {
    const bot = await this.botModel.findById(id).exec();
    if (!bot) throw new NotFoundException(`Bot ${id} not found`);

    if (
      updateDto.chromaCollection &&
      updateDto.chromaCollection !== bot.chromaCollection
    ) {
      const collection = await this.vectorStore.getCollectionByName(
        updateDto.chromaCollection,
      );

      if (!collection) {
        await this.vectorStore.createCollection(updateDto.chromaCollection);
      }
    }

    Object.assign(bot, updateDto);
    return bot.save();
  }
}
