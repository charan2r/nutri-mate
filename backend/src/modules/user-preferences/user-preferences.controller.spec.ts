import { Test, TestingModule } from '@nestjs/testing';
import { UserPreferencesController } from './user-preferences.controller';
import { UserPreferencesService } from './user-preferences.service';

describe('UserPreferencesController', () => {
  let controller: UserPreferencesController;

  const mockPrefService = {
    findForUser: jest.fn().mockResolvedValue({ id: 'pref-1' }),
    upsertForUser: jest.fn().mockResolvedValue({ id: 'pref-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPreferencesController],
      providers: [
        {
          provide: UserPreferencesService,
          useValue: mockPrefService,
        },
      ],
    }).compile();

    controller = module.get<UserPreferencesController>(UserPreferencesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
