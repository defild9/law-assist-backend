import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LawyerProfile,
  LawyerProfileDocument,
} from 'src/schemas/lawyer-profile.schema';

@Injectable()
export class LawyerProfileService {
  constructor(
    @InjectModel(LawyerProfile.name)
    private profileModel: Model<LawyerProfileDocument>,
  ) {}

  async create(
    userId: string,
    dto: Partial<LawyerProfile>,
  ): Promise<LawyerProfile> {
    const created = new this.profileModel({ ...dto, user: userId });
    return created.save();
  }

  async findByUser(userId: string): Promise<LawyerProfile> {
    const profile = await this.profileModel.findOne({ user: userId }).exec();
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async update(
    userId: string,
    dto: Partial<LawyerProfile>,
  ): Promise<LawyerProfile> {
    const profile = await this.profileModel
      .findOneAndUpdate({ user: userId }, dto, { new: true })
      .exec();
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }
}
