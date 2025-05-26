import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ForbiddenException,
  DefaultValuePipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { ChangePlanDto } from 'src/subscription/dto/change-plan.dto';
import { CreateSubscriptionDto } from 'src/subscription/dto/create-subscription.dto';
import { SubscriptionService } from 'src/subscription/subscription.service';
import {
  Subscription as SubscriptionEntity,
  SubscriptionStatus,
} from 'src/schemas/subscription.schema';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RoleGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subscription created successfully',
    type: SubscriptionEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiBody({ type: CreateSubscriptionDto })
  async create(
    @Request() req,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionService.create(
      req.user.userId,
      createSubscriptionDto,
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription found',
    type: SubscriptionEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription not found',
  })
  async getMySubscription(@Request() req) {
    return this.subscriptionService.findActiveSubscription(req.user.userId);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get subscription by ID (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription found',
    type: SubscriptionEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription not found',
  })
  async findOne(@Param('id') id: string) {
    return this.subscriptionService.findById(id);
  }

  @Patch(':id/plan')
  @ApiOperation({ summary: 'Change subscription plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan changed successfully',
    type: SubscriptionEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input',
  })
  @ApiBody({ type: ChangePlanDto })
  async changePlan(
    @Param('id') id: string,
    @Body() changePlanDto: ChangePlanDto,
    @Request() req,
  ) {
    if (req.user.role !== 'admin') {
      const subscription = await this.subscriptionService.findById(id);
      if (subscription.user.toString() !== req.user.userId) {
        throw new ForbiddenException(
          'You can only change your own subscription',
        );
      }
    }

    return this.subscriptionService.updateSubscription(id, {
      plan: changePlanDto.plan,
    });
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription canceled',
    type: SubscriptionEntity,
  })
  async cancel(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') {
      const subscription = await this.subscriptionService.findById(id);
      if (subscription.user.toString() !== req.user.userId) {
        throw new ForbiddenException(
          'You can only cancel your own subscription',
        );
      }
    }

    return this.subscriptionService.cancelSubscription(id);
  }

  @Patch(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate canceled subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription reactivated',
    type: SubscriptionEntity,
  })
  async reactivate(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') {
      const subscription = await this.subscriptionService.findById(id);
      if (subscription.user.toString() !== req.user.userId) {
        throw new ForbiddenException(
          'You can only reactivate your own subscription',
        );
      }
    }

    return this.subscriptionService.updateSubscription(id, {
      status: 'active',
      autoRenew: true,
    });
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete subscription (Admin only)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Subscription deleted',
  })
  async remove(@Param('id') id: string) {
    return this.subscriptionService.deleteSubscription(id);
  }

  @Get()
  // @Roles('admin')
  @ApiOperation({
    summary: 'Get all subscriptions with pagination (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscriptions retrieved successfully',
    type: [SubscriptionEntity],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'canceled', 'paused', 'expired'],
    description: 'Filter by subscription status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search text for user email/name or plan name/description',
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: SubscriptionStatus,
    @Query('search') search?: string,
  ) {
    return this.subscriptionService.findAll(page, limit, status, search);
  }
}
