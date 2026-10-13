import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  Logger,
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
  private readonly logger = new Logger(HostedGemmaProvider.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async generate(prompt: string) {
    const key = this.config.get<string>('GEMMA_API_KEY');

    if (!key) {
      throw new ServiceUnavailableException('GEMMA_API_KEY is not configured');
    }

    const model = this.config.get<string>('GEMMA_MODEL', 'gemma-4-26b-a4b-it');

    if (!/^gemma-[a-z0-9-]+$/.test(model)) {
      throw new ServiceUnavailableException('Invalid GEMMA_MODEL');
    }

    const timeout = Number(this.config.get('GEMMA_TIMEOUT_MS', 120000));

    if (!Number.isFinite(timeout) || timeout < 1000 || timeout > 300000) {
      throw new ServiceUnavailableException('Invalid GEMMA_TIMEOUT_MS');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    this.logger.log(
      `Starting Gemma generation: model=${model}, promptLength=${prompt.length}`,
    );

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
        },
        signal: AbortSignal.timeout(timeout),
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            thinkingConfig: {
              thinkingLevel: 'minimal',
            },
          },
        }),
      });
    } catch (error: unknown) {
      const err = error as Error & {
        cause?: { code?: string; message?: string };
      };

      this.logger.error({
        event: 'gemma_fetch_failed',
        model,
        errorName: err.name,
        errorMessage: err.message,
        causeCode: err.cause?.code,
        causeMessage: err.cause?.message,
      });

      if (err.name === 'TimeoutError') {
        throw new GatewayTimeoutException('Gemma request timed out');
      }

      throw new BadGatewayException('Unable to connect to hosted Gemma');
    }

    if (!response.ok) {
      this.logger.error({
        event: 'gemma_http_error',
        model,
        status: response.status,
      });

      throw new BadGatewayException(
        `Gemma provider returned HTTP ${response.status}`,
      );
    }

    let payload: any;

    try {
      payload = await response.json();
    } catch (error) {
      this.logger.error(
        'Gemma returned invalid JSON or the response failed',
        error instanceof Error ? error.stack : undefined,
      );

      throw new BadGatewayException('Gemma returned an invalid response');
    }

    const candidate = payload.candidates?.[0];

    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
      this.logger.warn(`Gemma finish reason: ${candidate.finishReason}`);

      throw new BadGatewayException('Gemma generation did not complete');
    }

    const content = candidate?.content?.parts
      ?.filter((p: any) => !p.thought && typeof p.text === 'string')
      .map((p: any) => p.text)
      .join('');

    if (!content?.trim()) {
      throw new BadGatewayException('Gemma returned empty meal plan data');
    }

    this.logger.log(`Gemma generation succeeded: ${content.length} characters`);

    return {
      content,
      model,
      provider: 'google-ai-studio',
    };
  }
}
