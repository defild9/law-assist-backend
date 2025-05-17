import { Module } from '@nestjs/common';
import { LawyerProfileService } from './lawyer-profile.service';
import { LawyerProfileController } from './lawyer-profile.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LawyerProfile,
  LawyerProfileSchema,
} from 'src/schemas/lawyer-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LawyerProfile.name, schema: LawyerProfileSchema },
    ]),
  ],
  providers: [LawyerProfileService],
  controllers: [LawyerProfileController],
  exports: [LawyerProfileService],
})
export class LawyerProfileModule {}
