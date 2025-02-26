import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { LlmModule } from 'src/llm/llm.module';
import { MessageModule } from 'src/message/message.module';
import { ConversationService } from './conversation.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Сonversation,
  СonversationSchema,
} from 'src/schemas/conversation.schema';

@Module({
  imports: [
    LlmModule,
    MessageModule,
    MongooseModule.forFeature([
      { name: Сonversation.name, schema: СonversationSchema },
    ]),
  ],
  controllers: [ConversationController],
  providers: [ConversationService],
})
export class ConversationModule {}
