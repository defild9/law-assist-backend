import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  NotFoundException,
  UseGuards,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import { VideoConsultationService } from './video-consultation.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateVideoConsultationDto } from './dto/create-video-consultation.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@ApiTags('Video Consultation')
@ApiBearerAuth()
@Controller('video-consultations')
export class VideoConsultationController {
  constructor(
    private readonly videoConsultationService: VideoConsultationService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new video consultation' })
  @ApiResponse({
    status: 201,
    description: 'Video consultation created successfully',
  })
  @ApiBody({
    description: 'Video consultation data',
    type: CreateVideoConsultationDto,
  })
  async create(
    @User('userId') userId: string,
    @Body() createVideoConsultationDto: CreateVideoConsultationDto,
  ) {
    const videoConsultation = await this.videoConsultationService.create(
      userId,
      createVideoConsultationDto,
    );
    return { status: 'success', videoConsultation };
  }

  @Patch(':id/update-status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a status of a video consultation' })
  @ApiParam({ name: 'id', description: 'Video consultation ID' })
  @ApiBody({ description: 'Video consultation data', type: UpdateStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Video consultation updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Video consultation not found' })
  async update(
    @User('userId') userId: string,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    const videoConsultation = await this.videoConsultationService.updateStatus(
      id,
      userId,
      updateStatusDto,
    );
    return { status: 'success', videoConsultation };
  }

  @Patch(':id/update-schedule')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a schedule of a video consultation' })
  @ApiParam({ name: 'id', description: 'Video consultation ID' })
  @ApiBody({ description: 'Update schedule', type: UpdateScheduleDto })
  @ApiResponse({
    status: 200,
    description: 'Video consultation updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Video consultation not found' })
  async updateSchedule(
    @User('userId') userId: string,
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    const videoConsultation =
      await this.videoConsultationService.updateSchedule(
        id,
        userId,
        updateScheduleDto.scheduledAt,
      );
    return { status: 'success', videoConsultation };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get video consultations by user or lawyer' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of consultations',
    schema: {
      example: {
        status: 'success',
        data: [
          {
            _id: '6641f4c824758cabcde12345',
            user: { _id: '...', email: 'user@example.com' },
            lawyer: { _id: '...', email: 'lawyer@example.com' },
            scheduledAt: '2025-05-10T12:00:00.000Z',
            status: 'approved',
          },
        ],
        total: 15,
        page: 1,
        totalPages: 2,
      },
    },
  })
  async findAll(
    @User('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const consultations =
      await this.videoConsultationService.findAllByUserOrLawyer(
        userId,
        Number(page),
        Number(limit),
      );

    return { status: 'success', ...consultations };
  }
  @Get('code/:code')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Find consultation by room code' })
  @ApiParam({
    name: 'code',
    description: 'Room code of the consultation',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the consultation data if user is a participant',
  })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  @ApiResponse({ status: 404, description: 'Consultation not found' })
  async findByRoomCode(
    @Param('code') code: string,
    @User('userId') userId: string,
  ) {
    const consultation = await this.videoConsultationService.findByCode(
      code,
      userId,
    );
    return { status: 'success', consultation };
  }

  @Get('room-available/:roomId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if the room is available (for owner only)' })
  @ApiParam({
    name: 'roomId',
    description: 'Room ID of the video consultation',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns true if room is available and user is owner',
    schema: {
      example: {
        status: 'success',
        available: true,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Returns false if room is unavailable or user is not owner',
    schema: {
      example: {
        status: 'success',
        available: false,
      },
    },
  })
  async checkRoomAvailability(
    @Param('roomId') roomId: string,
    @User('userId') userId: string,
  ) {
    const available = await this.videoConsultationService.roomIsAvailable(
      roomId,
      userId,
    );
    return {
      status: 'success',
      available,
    };
  }

  @Get('lawyers/availability')
  @ApiOperation({
    summary:
      'Get all lawyers and their available time slots (Mon–Fri, 08:00–17:00)',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of { lawyer, availableSlots }',
    schema: {
      example: [
        {
          lawyer: { id: '…', email: 'lawyer@example.com' },
          availableSlots: [
            '2025-05-19T08:00:00.000Z',
            '2025-05-19T09:00:00.000Z',
          ],
        },
      ],
    },
  })
  async getLawyersAvailability() {
    const data = await this.videoConsultationService.getLawyersAvailability();
    return { status: 'success', data };
  }
}
