import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmService } from './llm.service';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { MessageModule } from 'src/message/message.module';

@Module({
  imports: [ConfigModule, VectorStoreModule, MessageModule],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
