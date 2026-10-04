import { Test, TestingModule } from '@nestjs/testing';
import { AllergyController } from './allergy.controller';
import { AllergyService } from './allergy.service';

describe('AllergyController', () => {
  let controller: AllergyController;

  const mockService = {
    findForUser: jest.fn().mockResolvedValue([]),
    createForUser: jest.fn().mockResolvedValue({ id: 'allergy-1' }),
    removeForUser: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AllergyController],
      providers: [
        {
          provide: AllergyService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AllergyController>(AllergyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
