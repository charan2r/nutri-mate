import { AiService } from './ai.service';
import { testContext, testPlan } from './meal-test.fixture';

describe('Gemma meal generation', () => {
  const provider = { generate: jest.fn() };
  let service: AiService;
  beforeEach(() => {
    jest.resetAllMocks();
    service = new AiService(provider);
  });
  it('returns structured meals and Gemma provenance', async () => {
    provider.generate.mockResolvedValue({
      content: JSON.stringify(testPlan()),
      model: 'gemma-4-26b-a4b-it',
      provider: 'google-ai-studio',
    });
    const result = await service.generateMealPlan(testContext);
    expect(result.plan.days[0].meals).toHaveLength(3);
    expect(result.model).toContain('gemma');
  });
  it('retries malformed output with a concrete repair instruction', async () => {
    provider.generate
      .mockResolvedValueOnce({
        content: '{bad',
        model: 'gemma',
        provider: 'test',
      })
      .mockResolvedValueOnce({
        content: JSON.stringify(testPlan()),
        model: 'gemma',
        provider: 'test',
      });
    expect((await service.generateMealPlan(testContext)).attempts).toBe(2);
    expect(provider.generate.mock.calls[1][0]).toContain(
      'Correct these validation failures',
    );
  });
  it('never pads partial output', async () => {
    provider.generate.mockResolvedValue({
      content: JSON.stringify({ days: [{ day: 1, meals: [] }] }),
      model: 'gemma',
      provider: 'test',
    });
    await expect(service.generateMealPlan(testContext)).rejects.toThrow(
      'complete, valid',
    );
    expect(provider.generate).toHaveBeenCalledTimes(2);
  });
});
