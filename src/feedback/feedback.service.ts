import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import {
  Feedback,
  FeedbackDocument,
  FeedbackTag,
  FeedbackType,
} from 'src/schemas/feedback.schema';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,
  ) {}

  async create(dto: CreateFeedbackDto): Promise<Feedback> {
    const created = new this.feedbackModel(dto);
    return created.save();
  }

  async findAll(page = 1, limit = 10, tag?: FeedbackTag, type?: FeedbackType) {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be positive integers');
    }
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (tag) filter.tag = tag;
    if (type) filter.type = type;

    const docs = await this.feedbackModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .populate({ path: 'message', select: 'content' })
      .lean()
      .exec();

    const total = await this.feedbackModel.countDocuments(filter).exec();

    const data = docs.map((f: any) => ({
      ...f,
      message: f.message?.content ?? '',
    }));

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
  async findById(id: string): Promise<Feedback> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid feedback ID');
    }
    const fb = await this.feedbackModel.findById(id).exec();
    if (!fb) throw new NotFoundException(`Feedback ${id} not found`);
    return fb;
  }

  async findByMessage(messageId: string, page = 1, limit = 10) {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new BadRequestException('Invalid message ID');
    }
    const skip = (page - 1) * limit;
    const filter = { message: messageId };
    const [data, total] = await Promise.all([
      this.feedbackModel.find(filter).skip(skip).limit(limit).exec(),
      this.feedbackModel.countDocuments(filter).exec(),
    ]);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, dto: UpdateFeedbackDto): Promise<Feedback> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid feedback ID');
    }
    const updated = await this.feedbackModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException(`Feedback ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid feedback ID');
    }
    const result = await this.feedbackModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Feedback ${id} not found`);
  }
}
