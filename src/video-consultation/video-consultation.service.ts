import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ConsultationStatus,
  VideoConsultation,
} from 'src/schemas/video-consultation.schema';
import { CreateVideoConsultationDto } from './dto/create-video-consultation.dto';
import { UserService } from 'src/user/user.service';
import { UpdateVideoConsultationDto } from './dto/update-video-consultation.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { add, startOfWeek } from 'date-fns';

@Injectable()
export class VideoConsultationService {
  constructor(
    @InjectModel(VideoConsultation.name)
    private readonly videoConsultationModel: Model<VideoConsultation>,
    private readonly userService: UserService,
  ) {}

  private generateCode(): string {
    return crypto.randomUUID();
  }

  private generateWeeklySlots(): Date[] {
    const today = new Date();
    const dow = today.getDay();
    const weekOffset = dow === 6 || dow === 0 ? 1 : 0;

    const baseDate = add(today, { weeks: weekOffset });
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });

    const slots: Date[] = [];
    for (let d = 0; d < 5; d++) {
      for (let hour = 8; hour < 17; hour++) {
        slots.push(add(weekStart, { days: d, hours: hour }));
      }
    }
    return slots;
  }

  async create(
    userId: string,
    createVideoConsultationDto: CreateVideoConsultationDto,
  ) {
    const { lawyerId } = createVideoConsultationDto;
    const user = await this.userService.findById(userId);
    const lawyer = await this.userService.findById(lawyerId);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!lawyer) {
      throw new NotFoundException('Lawyer not found');
    }
    if (lawyer.role !== 'lawyer') {
      throw new ForbiddenException(
        'Only lawyers can be assigned to consultations',
      );
    }

    const consultation = new this.videoConsultationModel({
      user: user.id,
      lawyer: lawyer.id,
      scheduledAt: createVideoConsultationDto.scheduledAt,
      status: ConsultationStatus.PENDING,
      roomCode: this.generateCode(),
      notes: createVideoConsultationDto.notes,
    });

    return consultation.save();
  }

  async findAllByUserOrLawyer(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const objectId = new Types.ObjectId(userId);

    const filter = {
      $or: [{ user: objectId }, { lawyer: objectId }],
    };

    const [data, total] = await Promise.all([
      this.videoConsultationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate([
          {
            path: 'user',
            select: 'email role isEmailVerified',
          },
          {
            path: 'lawyer',
            select: 'email role isEmailVerified lawyerProfile',
            populate: {
              path: 'lawyerProfile',
              model: 'LawyerProfile',
              select: '-__v -user',
            },
          },
        ])
        .exec(),
      this.videoConsultationModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(
    id: string,
    lawyerId: string,
    updateVideoConsultationDto: UpdateVideoConsultationDto,
  ) {
    const lawyer = await this.userService.findById(lawyerId);

    if (!lawyer) {
      throw new NotFoundException('Lawyer not found');
    }
    if (lawyer.role !== 'lawyer') {
      throw new ForbiddenException(
        'Only lawyers can be assigned to consultations',
      );
    }
    return this.videoConsultationModel
      .findByIdAndUpdate(id, updateVideoConsultationDto, { new: true })
      .populate('user lawyer')
      .exec();
  }

  async remove(id: string) {
    if (!id) {
      throw new BadRequestException('Consultation Is must be provided');
    }

    const consultation = await this.videoConsultationModel.findById(id).exec();
    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    await this.videoConsultationModel.deleteOne({ _id: id }).exec();
  }

  async updateStatus(
    id: string,
    userId: string,
    updateStatusDto: UpdateStatusDto,
  ) {
    const { status } = updateStatusDto;

    const consultation = await this.videoConsultationModel.findById(id).exec();
    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    const isLawyer = consultation.lawyer.toString() === userId;
    const isUser = consultation.user.toString() === userId;

    if (!isLawyer && !isUser) {
      throw new ForbiddenException(
        'You are not authorized to change the status of this consultation',
      );
    }

    if (
      isUser &&
      (status === ConsultationStatus.COMPLETED ||
        status === ConsultationStatus.APPROVED)
    ) {
      throw new ForbiddenException(
        'You are not authorized to complete this consultation',
      );
    }

    consultation.status = status;
    return consultation.save();
  }

  async findByCode(code: string, participantId: string) {
    const consultation = await this.videoConsultationModel
      .findOne({ roomCode: code })
      .populate([
        {
          path: 'user',
          select: 'email role isEmailVerified',
        },
        {
          path: 'lawyer',
          select: 'email role lawyerProfile isEmailVerified',
          populate: {
            path: 'lawyerProfile',
            model: 'LawyerProfile',
            select: '-__v -user',
          },
        },
      ])
      .exec();

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    const userId = String(
      consultation.user?._id || consultation.user?.id || consultation.user,
    );
    const lawyerId = String(
      consultation.lawyer?._id ||
        consultation.lawyer?.id ||
        consultation.lawyer,
    );

    const isParticipant =
      userId === participantId || lawyerId === participantId;

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant of this consultation',
      );
    }

    return consultation;
  }

  async updateSchedule(id: string, userId: string, schedule: Date) {
    const consultation = await this.videoConsultationModel.findById(id).exec();
    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    const isLawyer = consultation.lawyer.toString() === userId;
    if (!isLawyer) {
      throw new ForbiddenException(
        'You are not authorized to change the schedule of this consultation',
      );
    }

    if (schedule < new Date()) {
      throw new BadRequestException('Schedule cannot be in the past');
    }

    if (
      consultation.status !== ConsultationStatus.COMPLETED &&
      consultation.status !== ConsultationStatus.CANCELED
    ) {
      consultation.scheduledAt = schedule;
      consultation.status = ConsultationStatus.APPROVED;
    }

    // TODO: send email notification to user and lawyer
    return consultation.save();
  }

  async roomIsAvailable(roomId: string, userId: string): Promise<boolean> {
    const consultation = await this.videoConsultationModel
      .findOne({ roomId })
      .exec();

    if (!consultation) {
      return false;
    }

    const isOwner = consultation.user.toString() === userId;
    if (!isOwner) {
      return false;
    }

    const unavailableStatuses = [
      ConsultationStatus.COMPLETED,
      ConsultationStatus.CANCELED,
      ConsultationStatus.PENDING,
    ];

    if (unavailableStatuses.includes(consultation.status)) {
      return false;
    }

    return true;
  }

  async getLawyersAvailability() {
    const slots = this.generateWeeklySlots();
    const lawyers = await this.userService.findByRole('lawyer');
    if (!lawyers.length) {
      throw new NotFoundException('No lawyers found');
    }

    const from = slots[0];
    const to = slots[slots.length - 1];

    const result = await Promise.all(
      lawyers.map(async (lawyer) => {
        const booked = await this.videoConsultationModel
          .find({
            lawyer: new Types.ObjectId(lawyer.id),
            status: {
              $in: [ConsultationStatus.PENDING, ConsultationStatus.APPROVED],
            },
            scheduledAt: { $gte: from, $lte: to },
          })
          .select('scheduledAt')
          .exec();

        const bookedSet = new Set(
          booked.map((b) => b.scheduledAt.toISOString()),
        );
        const freeSlots = slots.filter(
          (slot) => !bookedSet.has(slot.toISOString()),
        );

        return {
          lawyer: {
            id: lawyer.id,
            email: lawyer.email,
            profile: lawyer.lawyerProfile,
          },
          availableSlots: freeSlots,
        };
      }),
    );

    return result;
  }
}
