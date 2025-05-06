import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { SubscriptionPlanService } from './subscription-plan.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionPlan } from 'src/schemas/subscription-plan.schema';

@ApiTags('subscription-plans')
@Controller('subscription-plans')
export class SubscriptionPlanController {
  constructor(
    private readonly subscriptionPlanService: SubscriptionPlanService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription plan' })
  @ApiBody({ type: CreateSubscriptionPlanDto })
  @ApiResponse({
    status: 201,
    description: 'Plan has been successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createPlan(
    @Body() createDto: CreateSubscriptionPlanDto,
  ): Promise<{ status: string; plan: SubscriptionPlan }> {
    const plan = await this.subscriptionPlanService.create(createDto);
    return { status: 'success', plan };
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all subscription plans' })
  @ApiResponse({ status: 200, description: 'List of subscription plans' })
  async getPlans(): Promise<{ status: string; plans: SubscriptionPlan[] }> {
    const plans = await this.subscriptionPlanService.findAll();
    return { status: 'success', plans };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a subscription plan by ID' })
  @ApiParam({ name: 'id', description: 'Plan ID', type: String })
  @ApiResponse({ status: 200, description: 'Subscription plan details' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlan(
    @Param('id') id: string,
  ): Promise<{ status: string; plan: SubscriptionPlan }> {
    const plan = await this.subscriptionPlanService.findOne(id);
    if (!plan) {
      throw new NotFoundException(`Plan with ID "${id}" not found`);
    }
    return { status: 'success', plan };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing subscription plan' })
  @ApiParam({ name: 'id', description: 'Plan ID', type: String })
  @ApiBody({ type: UpdateSubscriptionPlanDto })
  @ApiResponse({ status: 200, description: 'Subscription plan updated' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async updatePlan(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubscriptionPlanDto,
  ): Promise<{ status: string; plan: SubscriptionPlan }> {
    const plan = await this.subscriptionPlanService.update(id, updateDto);
    if (!plan) {
      throw new NotFoundException(`Plan with ID "${id}" not found`);
    }
    return { status: 'success', plan };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subscription plan by ID' })
  @ApiParam({ name: 'id', description: 'Plan ID', type: String })
  @ApiResponse({ status: 200, description: 'Subscription plan deleted' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async deletePlan(
    @Param('id') id: string,
  ): Promise<{ status: string; plan: SubscriptionPlan }> {
    const plan = await this.subscriptionPlanService.remove(id);
    if (!plan) {
      throw new NotFoundException(`Plan with ID "${id}" not found`);
    }
    return { status: 'success', plan };
  }
}
