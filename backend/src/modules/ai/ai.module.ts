import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import {
  HostedGemmaProvider,
  MealModelProvider,
} from './hosted-gemma.provider';

@Module({
  providers: [
    AiService,
    { provide: MealModelProvider, useClass: HostedGemmaProvider },
  ],
  exports: [AiService],
})
export class AiModule {}
