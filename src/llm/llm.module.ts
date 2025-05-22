import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmService } from './llm.service';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { MessageModule } from 'src/message/message.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LegalTemplate,
  LegalTemplateSchema,
} from 'src/schemas/legal-template.schema';

@Module({
  imports: [
    ConfigModule,
    VectorStoreModule,
    MessageModule,
    MongooseModule.forFeature([
      { name: LegalTemplate.name, schema: LegalTemplateSchema },
    ]),
  ],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
