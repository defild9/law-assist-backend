import { Module } from '@nestjs/common';
import { BotsService } from './bots.service';
import { BotsController } from './bots.controller';
import { Bot, BotSchema } from 'src/schemas/bot.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { VectorStoreService } from 'src/vector-store/vector-store.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Bot.name, schema: BotSchema }])],
  controllers: [BotsController],
  providers: [BotsService, VectorStoreService],
})
export class BotsModule {}
