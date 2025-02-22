import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmService } from './llm.service';
import { VectorStoreModule } from '../vector-store/vector-store.module';

@Module({
  imports: [ConfigModule, VectorStoreModule],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
