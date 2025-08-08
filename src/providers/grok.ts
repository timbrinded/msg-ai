import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModelV1 } from 'ai';
import { BaseProvider } from './base.js';
import type { ProviderConfig } from '../types/index.js';

const config: ProviderConfig = {
  name: 'grok',
  displayName: 'X.AI Grok',
  envKey: 'XAI_API_KEY',
  baseUrl: 'https://api.x.ai/v1',
  defaultModel: 'grok-3',
  models: [
    { id: 'grok-3', name: 'Grok 3', maxTokens: 131072 },
    { id: 'grok-3-fast', name: 'Grok 3 Fast', maxTokens: 131072 },
    { id: 'grok-3-mini', name: 'Grok 3 Mini', maxTokens: 131072 },
    { id: 'grok-3-mini-fast', name: 'Grok 3 Mini Fast', maxTokens: 131072 },
    { id: 'grok-4-0709', name: 'Grok 4', maxTokens: 131072 },
    { id: 'grok-2-1212', name: 'Grok 2', maxTokens: 131072 },
    { id: 'grok-2-vision-1212', name: 'Grok 2 Vision', maxTokens: 32768 },
  ],
};

export class GrokProvider extends BaseProvider {
  private client?: ReturnType<typeof createOpenAI>;
  
  constructor() {
    super(config);
  }
  
  private getClient() {
    if (!this.client) {
      this.assertAvailable();
      this.client = createOpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseUrl || config.baseUrl,
      });
    }
    return this.client;
  }
  
  createModel(modelId?: string): LanguageModelV1 {
    const model = modelId || this.config.defaultModel;
    return this.getClient()(model);
  }
}