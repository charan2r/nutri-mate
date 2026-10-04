import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

describe('FeedbackController', () => {
  let controller: FeedbackController;

  const mockService = {
    create: jest.fn().mockResolvedValue({ id: 'fb-1' }),
    findAllForUser: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ id: 'fb-1' }),
    update: jest.fn().mockResolvedValue({ id: 'fb-1' }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [
        {
          provide: FeedbackService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<FeedbackController>(FeedbackController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
