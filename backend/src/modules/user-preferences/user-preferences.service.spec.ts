import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserPreferencesService } from './user-preferences.service';
import { UserPreference } from './entities/user-preference.entity';
import { UserProfile } from '../profile/entities/profile.entity';

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;

  const mockPrefRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((p) => Promise.resolve({ id: 'pref-1', ...p })),
  };

  const mockProfileRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPreferencesService,
        {
          provide: getRepositoryToken(UserPreference),
          useValue: mockPrefRepo,
        },
        {
          provide: getRepositoryToken(UserProfile),
          useValue: mockProfileRepo,
        },
      ],
    }).compile();

    service = module.get<UserPreferencesService>(UserPreferencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
