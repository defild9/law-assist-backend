import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VectorStoreService } from './vector-store.service';
import { VectorStoreController } from './vector-store.controller';

@Module({
  imports: [ConfigModule],
  providers: [VectorStoreService],
  exports: [VectorStoreService],
  controllers: [VectorStoreController],
})
export class VectorStoreModule {}
