import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpException,
  UseGuards,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { User } from 'src/common/decorators/user.decorator';
import {
  Feedback,
  FeedbackTag,
  FeedbackType,
} from 'src/schemas/feedback.schema';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';

class PaginatedFeedback {
  data: Feedback[];
  total: number;
  page: number;
  totalPages: number;
}

@ApiTags('Feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Create a new feedback entry' })
  @ApiCreatedResponse({
    description: 'Feedback created successfully',
    type: Feedback,
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiBody({ type: CreateFeedbackDto })
  async create(@User('userId') userId: string, @Body() dto: CreateFeedbackDto) {
    try {
      const data = await this.feedbackService.create({ ...dto, user: userId });
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Feedback created successfully',
        data,
      };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  @Roles('admin', 'lawyer')
  @ApiOperation({ summary: 'Get all feedback (paginated, filter by tag/type)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'tag',
    required: false,
    enum: FeedbackTag,
    description: 'Filter by tag',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: FeedbackType,
    description: 'Filter by type',
  })
  @ApiOkResponse({
    description: 'Feedback list fetched',
    type: PaginatedFeedback,
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('tag') tag?: FeedbackTag,
    @Query('type') type?: FeedbackType,
  ) {
    const result = await this.feedbackService.findAll(page, limit, tag, type);
    return {
      statusCode: HttpStatus.OK,
      message: 'Feedback list fetched',
      ...result,
    };
  }

  @Get(':id')
  @Roles('admin', 'lawyer')
  @ApiOperation({ summary: 'Get a single feedback by ID' })
  @ApiParam({ name: 'id', description: 'Feedback ID' })
  @ApiOkResponse({ description: 'Feedback fetched', type: Feedback })
  @ApiNotFoundResponse({ description: 'Feedback not found' })
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.feedbackService.findById(id);
      return {
        statusCode: HttpStatus.OK,
        message: 'Feedback fetched successfully',
        data,
      };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new HttpException(err.message, HttpStatus.NOT_FOUND);
    }
  }

  @Get('message/:messageId')
  @Roles('admin', 'lawyer')
  @ApiOperation({ summary: 'Get feedback for a specific message (paginated)' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    description: 'Feedback for message fetched',
    type: PaginatedFeedback,
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  async findByMessage(
    @Param('messageId') messageId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.feedbackService.findByMessage(
      messageId,
      page,
      limit,
    );
    return {
      statusCode: HttpStatus.OK,
      message: `Feedback for message ${messageId} fetched`,
      ...result,
    };
  }

  @Patch(':id')
  @Roles('admin', 'lawyer')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Update a feedback entry' })
  @ApiParam({ name: 'id', description: 'Feedback ID' })
  @ApiBody({ type: UpdateFeedbackDto })
  @ApiOkResponse({
    description: 'Feedback updated successfully',
    type: Feedback,
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async update(@Param('id') id: string, @Body() dto: UpdateFeedbackDto) {
    try {
      const data = await this.feedbackService.update(id, dto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Feedback updated successfully',
        data,
      };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new HttpException(err.message, HttpStatus.NOT_FOUND);
    }
  }

  @Delete(':id')
  @Roles('admin', 'lawyer')
  @ApiOperation({ summary: 'Delete a feedback entry' })
  @ApiParam({ name: 'id', description: 'Feedback ID' })
  @ApiOkResponse({ description: 'Feedback deleted successfully' })
  @ApiNotFoundResponse({ description: 'Feedback not found' })
  async remove(@Param('id') id: string) {
    try {
      await this.feedbackService.remove(id);
      return {
        statusCode: HttpStatus.OK,
        message: 'Feedback deleted successfully',
      };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new HttpException(err.message, HttpStatus.NOT_FOUND);
    }
  }
}
