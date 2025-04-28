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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Subscription } from 'rxjs';
import { Roles } from 'src/auth/decorators/role.decorator';
import { SubscriptionPlan } from 'src/auth/decorators/subscription.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { ChangePlanDto } from 'src/subscription/dto/change-plan.dto';
import { CreateSubscriptionDto } from 'src/subscription/dto/create-subscription.dto';
import { SubscriptionService } from 'src/subscription/subscription.service';

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
    type: Subscription,
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
    return this.subscriptionService.create({
      ...createSubscriptionDto,
      user: req.user.userId,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription found',
    type: Subscription,
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
    type: Subscription,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription not found',
  })
  async findOne(@Param('id') id: string) {
    return this.subscriptionService.findById(id);
  }

  @Patch(':id/plan')
  @SubscriptionPlan('basic')
  @ApiOperation({ summary: 'Change subscription plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan changed successfully',
    type: Subscription,
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
      if (subscription.user.toString() !== req.user.userId.toString()) {
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
    type: Subscription,
  })
  async cancel(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') {
      const subscription = await this.subscriptionService.findById(id);
      if (subscription.user.toString() !== req.user.userId.toString()) {
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
    type: Subscription,
  })
  async reactivate(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') {
      const subscription = await this.subscriptionService.findById(id);
      if (subscription.user.toString() !== req.user.userId.toString()) {
        throw new ForbiddenException(
          'You can only reactivate your own subscription',
        );
      }
    }

    return this.subscriptionService.updateSubscription(id, {
      status: 'active',
      autoRenew: true,
      cancellationDate: null,
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
}
