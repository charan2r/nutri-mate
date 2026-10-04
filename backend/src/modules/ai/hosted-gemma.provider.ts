import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export abstract class MealModelProvider {
  abstract generate(
    prompt: string,
  ): Promise<{ content: string; model: string; provider: string }>;
}

@Injectable()
export class HostedGemmaProvider extends MealModelProvider {
  constructor(private readonly config: ConfigService) {
    super();
  }

  async generate(prompt: string) {
    const key =
      this.config.get<string>('GEMMA_API_KEY') ||
      this.config.get<string>('GOOGLE_API_KEY') ||
      this.config.get<string>('GEMINI_API_KEY');
    if (!key)
      throw new ServiceUnavailableException(
        'Configure GEMMA_API_KEY with a Google AI Studio key',
      );
    const model = this.config.get<string>('GEMMA_MODEL', 'gemma-4-26b-a4b-it');
    if (!/^gemma-[a-z0-9-]+$/.test(model))
      throw new ServiceUnavailableException(
        'GEMMA_MODEL must name a Gemma model',
      );
    const timeout = Number(this.config.get('GEMMA_TIMEOUT_MS', 120000));
    if (!Number.isFinite(timeout) || timeout < 1000 || timeout > 300000)
      throw new ServiceUnavailableException(
        'GEMMA_TIMEOUT_MS must be between 1000 and 300000',
      );
    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': key,
          },
          signal: AbortSignal.timeout(timeout),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 30000 },
          }),
        },
      );
    } catch {
      throw new BadGatewayException(
        'Hosted Gemma could not be reached or timed out',
      );
    }
    // Do not expose provider bodies or credentials in client errors or logs.
    if (!response.ok)
      throw new BadGatewayException(
        `Hosted Gemma request failed (HTTP ${response.status})`,
      );
    const payload = await response.json();
    const candidate = payload.candidates?.[0];
    if (candidate?.finishReason && candidate.finishReason !== 'STOP')
      throw new BadGatewayException(
        'Hosted Gemma returned an incomplete or blocked response',
      );
    const content = candidate?.content?.parts
      ?.filter((p: any) => !p.thought && typeof p.text === 'string')
      .map((p: any) => p.text)
      .join('');
    if (!content)
      throw new BadGatewayException('Hosted Gemma returned no meal data');
    return { content, model, provider: 'google-ai-studio' };
  }
}
