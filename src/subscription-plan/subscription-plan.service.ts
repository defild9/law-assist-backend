import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubscriptionPlan } from 'src/schemas/subscription-plan.schema';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Injectable()
export class SubscriptionPlanService {
  constructor(
    @InjectModel(SubscriptionPlan.name)
    private readonly planModel: Model<SubscriptionPlan>,
  ) {}

  async create(dto: CreateSubscriptionPlanDto) {
    const created = new this.planModel(dto);
    return created.save();
  }

  findAll() {
    return this.planModel.find().exec();
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Invalid plan ID');
    const plan = await this.planModel.findById(id).exec();
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto) {
    const updated = await this.planModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    if (!updated) throw new NotFoundException('Plan not found');
    return updated;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid plan ID');
    }

    const deleted = await this.planModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('Plan not found');
    }
    return deleted;
  }
}
