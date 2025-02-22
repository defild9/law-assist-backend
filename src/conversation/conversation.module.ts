import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { LlmModule } from 'src/llm/llm.module';

@Module({
  imports: [LlmModule],
  controllers: [ConversationController],
})
export class ConversationModule {}
