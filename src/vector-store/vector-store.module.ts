import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VectorStoreService } from './vector-store.service';
import { VectorStoreController } from './vector-store.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VectorCollection,
  VectorCollectionSchema,
} from 'src/schemas/vector-collection.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: VectorCollection.name, schema: VectorCollectionSchema },
    ]),
  ],
  providers: [VectorStoreService],
  exports: [VectorStoreService],
  controllers: [VectorStoreController],
})
export class VectorStoreModule {}
