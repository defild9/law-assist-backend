import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  NotFoundException,
  DefaultValuePipe,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscriptionPlanService } from './subscription-plan.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionPlan } from 'src/schemas/subscription-plan.schema';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';

@ApiTags('subscription-plans')
@ApiBearerAuth()
@Controller('subscription-plans')
export class SubscriptionPlanController {
  constructor(
    private readonly subscriptionPlanService: SubscriptionPlanService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
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
  @ApiOperation({
    summary: 'Retrieve paginated and searchable subscription plans',
  })
  @ApiResponse({
    status: 200,
    description: 'List of subscription plans with pagination',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'premium',
  })
  async getPlans(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<{
    status: string;
    data: SubscriptionPlan[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.subscriptionPlanService.findAll(
      page,
      limit,
      search,
    );

    return {
      status: 'success',
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
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
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
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
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
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
