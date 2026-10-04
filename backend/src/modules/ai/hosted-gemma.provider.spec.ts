import { ConfigService } from '@nestjs/config';
import { HostedGemmaProvider } from './hosted-gemma.provider';

describe('Hosted Gemma', () => {
  let fetchMock: jest.SpyInstance;
  const create = (values: Record<string, string>) =>
    new HostedGemmaProvider({
      get: (key, fallback) => values[key] ?? fallback,
    } as ConfigService);
  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
  });
  afterEach(() => jest.restoreAllMocks());
  it('uses a Gemma model, header authentication, and only final text', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [
                { text: 'internal', thought: true },
                { text: '{' },
                { text: '}' },
              ],
            },
          },
        ],
      }),
    });
    const result = await create({ GEMMA_API_KEY: 'secret' }).generate('plan');
    expect(result).toEqual({
      model: 'gemma-4-26b-a4b-it',
      provider: 'google-ai-studio',
      content: '{}',
    });
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).not.toContain('secret');
    expect(request.headers['x-goog-api-key']).toBe('secret');
  });
  it('rejects Gemini model configuration', async () => {
    await expect(
      create({ GEMMA_API_KEY: 'secret', GEMMA_MODEL: 'gemini-flash' }).generate(
        'plan',
      ),
    ).rejects.toThrow('Gemma model');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('requires an API key', async () => {
    await expect(create({}).generate('plan')).rejects.toThrow('GEMMA_API_KEY');
  });
  it('does not leak provider bodies', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'secret credentials',
    });
    await expect(
      create({ GEMMA_API_KEY: 'secret' }).generate('plan'),
    ).rejects.toThrow('HTTP 401');
  });
  it('rejects truncated output', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          { finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{}' }] } },
        ],
      }),
    });
    await expect(
      create({ GEMMA_API_KEY: 'secret' }).generate('plan'),
    ).rejects.toThrow('incomplete');
  });
});
