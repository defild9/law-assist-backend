import { Module } from '@nestjs/common';
import { LawyerProfileService } from './lawyer-profile.service';
import { LawyerProfileController } from './lawyer-profile.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LawyerProfile,
  LawyerProfileSchema,
} from 'src/schemas/lawyer-profile.schema';
import { User, UserSchema } from 'src/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LawyerProfile.name, schema: LawyerProfileSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [LawyerProfileService],
  controllers: [LawyerProfileController],
  exports: [LawyerProfileService],
})
export class LawyerProfileModule {}
