import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { UserProfile } from './entities/profile.entity';
import { UserPreference } from '../user-preferences/entities/user-preference.entity';

describe('ProfileService', () => {
  let service: ProfileService;

  const mockProfileRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((p) => Promise.resolve({ id: 'profile-1', ...p })),
  };

  const mockPrefRepo = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((pr) => Promise.resolve({ id: 'pref-1', ...pr })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(UserProfile),
          useValue: mockProfileRepo,
        },
        {
          provide: getRepositoryToken(UserPreference),
          useValue: mockPrefRepo,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
