import { Module } from '@nestjs/common';
import { BotsService } from './bots.service';
import { BotsController } from './bots.controller';
import { Bot, BotSchema } from 'src/schemas/bot.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { VectorStoreService } from 'src/vector-store/vector-store.service';
import {
  VectorCollection,
  VectorCollectionSchema,
} from 'src/schemas/vector-collection.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bot.name, schema: BotSchema }]),
    MongooseModule.forFeature([
      { name: VectorCollection.name, schema: VectorCollectionSchema },
    ]),
  ],
  controllers: [BotsController],
  providers: [BotsService, VectorStoreService],
  exports: [BotsService],
})
export class BotsModule {}
