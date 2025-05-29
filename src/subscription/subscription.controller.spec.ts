import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { ForbiddenException } from '@nestjs/common';

const mockSubscriptionService = {
  create: jest.fn(),
  findActiveSubscription: jest.fn(),
  findById: jest.fn(),
  updateSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  deleteSubscription: jest.fn(),
  findAll: jest.fn(),
};

const mockRequest = (overrides = {}) => ({
  user: {
    userId: 'user-123',
    role: 'user',
    ...overrides,
  },
});

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let service: SubscriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        { provide: SubscriptionService, useValue: mockSubscriptionService },
      ],
    }).compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
    service = module.get<SubscriptionService>(SubscriptionService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should create a subscription', async () => {
    const dto = { plan: 'basic' };
    const req = mockRequest();
    mockSubscriptionService.create.mockResolvedValue('mock-subscription');

    const result = await controller.create(req, dto);

    expect(service.create).toHaveBeenCalledWith('user-123', dto);
    expect(result).toBe('mock-subscription');
  });

  it('should return current user subscription', async () => {
    mockSubscriptionService.findActiveSubscription.mockResolvedValue(
      'mock-sub',
    );
    const req = mockRequest();

    const result = await controller.getMySubscription(req);

    expect(service.findActiveSubscription).toHaveBeenCalledWith('user-123');
    expect(result).toBe('mock-sub');
  });

  it('should allow admin to get subscription by ID', async () => {
    mockSubscriptionService.findById.mockResolvedValue('mock-sub');
    const result = await controller.findOne('sub-id');

    expect(result).toBe('mock-sub');
  });

  it('should allow user to change their own subscription plan', async () => {
    const dto = { plan: 'premium' };
    const req = mockRequest();
    const subscription = { user: 'user-123' };
    mockSubscriptionService.findById.mockResolvedValue(subscription);
    mockSubscriptionService.updateSubscription.mockResolvedValue('updated-sub');

    const result = await controller.changePlan('sub-id', dto, req);

    expect(service.updateSubscription).toHaveBeenCalledWith('sub-id', {
      plan: 'premium',
    });
    expect(result).toBe('updated-sub');
  });

  it('should throw ForbiddenException if non-owner user tries to change plan', async () => {
    const dto = { plan: 'premium' };
    const req = mockRequest({ userId: 'user-999' });
    const subscription = { user: 'user-123' };
    mockSubscriptionService.findById.mockResolvedValue(subscription);

    await expect(controller.changePlan('sub-id', dto, req)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should allow admin to change any subscription', async () => {
    const dto = { plan: 'pro' };
    const req = mockRequest({ role: 'admin' });
    mockSubscriptionService.updateSubscription.mockResolvedValue('updated');

    const result = await controller.changePlan('sub-id', dto, req);

    expect(result).toBe('updated');
  });

  it('should cancel subscription for owner', async () => {
    const req = mockRequest();
    const subscription = { user: 'user-123' };
    mockSubscriptionService.findById.mockResolvedValue(subscription);
    mockSubscriptionService.cancelSubscription.mockResolvedValue('canceled');

    const result = await controller.cancel('sub-id', req);

    expect(result).toBe('canceled');
  });

  it('should reactivate subscription', async () => {
    const req = mockRequest({ userId: 'user-123' });
    const subscription = { user: 'user-123' };
    mockSubscriptionService.findById.mockResolvedValue(subscription);
    mockSubscriptionService.updateSubscription.mockResolvedValue('active-sub');

    const result = await controller.reactivate('sub-id', req);

    expect(result).toBe('active-sub');
  });

  it('should allow admin to delete subscription', async () => {
    mockSubscriptionService.deleteSubscription.mockResolvedValue(undefined);

    const result = await controller.remove('sub-id');

    expect(result).toBeUndefined();
  });

  it('should return all subscriptions', async () => {
    mockSubscriptionService.findAll.mockResolvedValue(['sub1', 'sub2']);

    const result = await controller.findAll(1, 10, 'active', 'searchTerm');

    expect(service.findAll).toHaveBeenCalledWith(1, 10, 'active', 'searchTerm');
    expect(result).toEqual(['sub1', 'sub2']);
  });
});
