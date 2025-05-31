import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionPlanController } from './subscription-plan.controller';
import { SubscriptionPlanService } from './subscription-plan.service';
import { NotFoundException } from '@nestjs/common';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

const mockSubscriptionPlanService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockPlan = {
  _id: 'plan-123',
  name: 'Premium',
  price: 9.99,
  features: ['feature1', 'feature2'],
};

describe('SubscriptionPlanController', () => {
  let controller: SubscriptionPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionPlanController],
      providers: [
        {
          provide: SubscriptionPlanService,
          useValue: mockSubscriptionPlanService,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionPlanController>(
      SubscriptionPlanController,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('should create a new plan', async () => {
    const dto: CreateSubscriptionPlanDto = {
      name: 'Premium',
      price: 9.99,
      features: ['feature1'],
      description: 'Premium plan',
    };

    mockSubscriptionPlanService.create.mockResolvedValue(mockPlan);

    const result = await controller.createPlan(dto);

    expect(mockSubscriptionPlanService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ status: 'success', plan: mockPlan });
  });

  it('should return paginated list of plans', async () => {
    const paginatedResult = {
      data: [mockPlan],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    mockSubscriptionPlanService.findAll.mockResolvedValue(paginatedResult);

    const result = await controller.getPlans(1, 10, 'Premium');

    expect(mockSubscriptionPlanService.findAll).toHaveBeenCalledWith(
      1,
      10,
      'Premium',
    );
    expect(result).toEqual({
      status: 'success',
      ...paginatedResult,
    });
  });

  it('should return a plan by ID', async () => {
    mockSubscriptionPlanService.findOne.mockResolvedValue(mockPlan);

    const result = await controller.getPlan('plan-123');

    expect(mockSubscriptionPlanService.findOne).toHaveBeenCalledWith(
      'plan-123',
    );
    expect(result).toEqual({ status: 'success', plan: mockPlan });
  });

  it('should throw NotFoundException if plan is not found', async () => {
    mockSubscriptionPlanService.findOne.mockResolvedValue(null);

    await expect(controller.getPlan('invalid-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update a plan', async () => {
    const updateDto: UpdateSubscriptionPlanDto = {
      name: 'Updated Plan',
    };

    mockSubscriptionPlanService.update.mockResolvedValue({
      ...mockPlan,
      ...updateDto,
    });

    const result = await controller.updatePlan('plan-123', updateDto);

    expect(mockSubscriptionPlanService.update).toHaveBeenCalledWith(
      'plan-123',
      updateDto,
    );
    expect(result).toEqual({
      status: 'success',
      plan: {
        ...mockPlan,
        ...updateDto,
      },
    });
  });

  it('should throw NotFoundException if updated plan is null', async () => {
    mockSubscriptionPlanService.update.mockResolvedValue(null);

    await expect(
      controller.updatePlan('invalid-id', { name: 'Any' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should delete a plan', async () => {
    mockSubscriptionPlanService.remove.mockResolvedValue(mockPlan);

    const result = await controller.deletePlan('plan-123');

    expect(mockSubscriptionPlanService.remove).toHaveBeenCalledWith('plan-123');
    expect(result).toEqual({ status: 'success', plan: mockPlan });
  });

  it('should throw NotFoundException when deleting non-existent plan', async () => {
    mockSubscriptionPlanService.remove.mockResolvedValue(null);

    await expect(controller.deletePlan('invalid-id')).rejects.toThrow(
      NotFoundException,
    );
  });
});
