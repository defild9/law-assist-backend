import { Module } from '@nestjs/common';
import { VideoConsultationService } from './video-consultation.service';
import { VideoConsultationController } from './video-consultation.controller';
import {
  VideoConsultation,
  VideoConsultationSchema,
} from 'src/schemas/video-consultation.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VideoConsultation.name, schema: VideoConsultationSchema },
    ]),
    UserModule,
  ],
  controllers: [VideoConsultationController],
  providers: [VideoConsultationService],
})
export class VideoConsultationModule {}
