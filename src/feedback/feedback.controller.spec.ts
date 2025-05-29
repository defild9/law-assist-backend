import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('FeedbackController', () => {
  let controller: FeedbackController;
  let service: FeedbackService;

  const mockFeedbackService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByMessage: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [{ provide: FeedbackService, useValue: mockFeedbackService }],
    }).compile();

    controller = module.get<FeedbackController>(FeedbackController);
    service = module.get<FeedbackService>(FeedbackService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should return success response on create', async () => {
      const dto: CreateFeedbackDto = {
        type: 'COMMENT',
        message: 'Test feedback',
        tag: 'GENERAL',
      } as any;
      const mockResult = { id: '1', ...dto };
      mockFeedbackService.create.mockResolvedValue(mockResult);

      const result = await controller.create('user123', dto);
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Feedback created successfully',
        data: mockResult,
      });
    });

    it('should throw exception if service fails', async () => {
      mockFeedbackService.create.mockRejectedValue(new Error('Error creating'));
      await expect(controller.create('user123', {} as any)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated feedback list', async () => {
      const mockData = {
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
      mockFeedbackService.findAll.mockResolvedValue(mockData);

      const result = await controller.findAll(1, 10);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Feedback list fetched',
        ...mockData,
      });
    });
  });

  describe('findOne', () => {
    it('should return feedback by id', async () => {
      const mockData = { id: '123', message: 'Feedback' };
      mockFeedbackService.findById.mockResolvedValue(mockData);

      const result = await controller.findOne('123');
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Feedback fetched successfully',
        data: mockData,
      });
    });

    it('should return 404 if not found', async () => {
      mockFeedbackService.findById.mockRejectedValue(new Error('Not found'));
      await expect(controller.findOne('bad-id')).rejects.toThrow(HttpException);
    });
  });

  describe('findByMessage', () => {
    it('should return feedback for message', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
      mockFeedbackService.findByMessage.mockResolvedValue(mockResult);

      const result = await controller.findByMessage('msg1', 1, 10);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: `Feedback for message msg1 fetched`,
        ...mockResult,
      });
    });
  });

  describe('update', () => {
    it('should return success response on update', async () => {
      const dto: UpdateFeedbackDto = { message: 'Updated' } as any;
      const mockResult = { id: '123', ...dto };
      mockFeedbackService.update.mockResolvedValue(mockResult);

      const result = await controller.update('123', dto);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Feedback updated successfully',
        data: mockResult,
      });
    });

    it('should return 404 on update failure', async () => {
      mockFeedbackService.update.mockRejectedValue(new Error('Not found'));
      await expect(controller.update('bad-id', {} as any)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('remove', () => {
    it('should return success on delete', async () => {
      mockFeedbackService.remove.mockResolvedValue(undefined);
      const result = await controller.remove('123');
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Feedback deleted successfully',
      });
    });

    it('should throw error if deletion fails', async () => {
      mockFeedbackService.remove.mockRejectedValue(new Error('Not found'));
      await expect(controller.remove('bad-id')).rejects.toThrow(HttpException);
    });
  });
});
