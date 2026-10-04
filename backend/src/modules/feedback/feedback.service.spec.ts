import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeedbackService } from './feedback.service';
import { Feedback } from './entities/feedback.entity';

describe('FeedbackService (TC-7: Feedback Submitted & Persisted)', () => {
  let service: FeedbackService;

  const mockFeedbackRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((entity) =>
      Promise.resolve({ id: 'mock-feedback-uuid', ...entity, createdAt: new Date() }),
    ),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: getRepositoryToken(Feedback),
          useValue: mockFeedbackRepo,
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and store feedback record with rating, reason tags, and comments', async () => {
      mockFeedbackRepo.findOne.mockResolvedValue(null);

      const dto = {
        mealItemId: 'meal-item-123',
        mealName: 'Chicken Curry & Rice',
        mealType: 'lunch',
        liked: true,
        rating: 5,
        reasonTags: ['delicious', 'optimal_portion'],
        comment: 'Great balance of spices and high protein!',
      };

      const result = await service.create('user-uuid-1', dto);

      expect(result.userId).toBe('user-uuid-1');
      expect(result.mealItemId).toBe('meal-item-123');
      expect(result.rating).toBe(5);
      expect(result.reasonTags).toContain('delicious');
      expect(result.comment).toBe('Great balance of spices and high protein!');
      expect(mockFeedbackRepo.save).toHaveBeenCalled();
    });

    it('should update existing feedback if submitted again for the same mealItem', async () => {
      const existingRecord = {
        id: 'existing-fb-id',
        userId: 'user-uuid-1',
        mealItemId: 'meal-item-123',
        rating: 3,
        liked: false,
        reasonTags: ['too_spicy'],
        comment: 'Too hot',
      };

      mockFeedbackRepo.findOne.mockResolvedValue(existingRecord);

      const updatedDto = {
        mealItemId: 'meal-item-123',
        rating: 4,
        liked: true,
        reasonTags: ['flavorful'],
        comment: 'Adjusted spices, now it is perfect.',
      };

      const result = await service.create('user-uuid-1', updatedDto);

      expect(result.rating).toBe(4);
      expect(result.liked).toBe(true);
      expect(result.comment).toBe('Adjusted spices, now it is perfect.');
      expect(mockFeedbackRepo.save).toHaveBeenCalled();
    });
  });
});
