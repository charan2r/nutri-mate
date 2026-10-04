import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AllergyService } from './allergy.service';
import { Allergy } from './entities/allergy.entity';

describe('AllergyService', () => {
  let service: AllergyService;

  const mockRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'allergy-1', ...entity })),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllergyService,
        {
          provide: getRepositoryToken(Allergy),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<AllergyService>(AllergyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
