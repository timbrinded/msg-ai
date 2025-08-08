import { createXai } from '@ai-sdk/xai';
import { LanguageModel } from 'ai';
import { BaseProvider } from './base.js';
import type { ProviderConfig } from '../types/index.js';

const config: ProviderConfig = {
  name: 'grok',
  displayName: 'X.AI Grok',
  envKey: 'XAI_API_KEY',
  baseUrl: 'https://api.x.ai/v1',
  defaultModel: 'grok-4',
  models: [
    { id: 'grok-4', name: 'Grok 3', maxTokens: 131072 },
    { id: 'grok-3-mini', name: 'Grok 3 Mini', maxTokens: 131072 },
    { id: 'grok-3', name: 'Grok 3', maxTokens: 131072 },
  ],
};

export class GrokProvider extends BaseProvider {
  private client?: ReturnType<typeof createXai>;
  
  constructor() {
    super(config);
  }
  
  private getClient() {
    if (!this.client) {
      this.assertAvailable();
      this.client = createXai({
        apiKey: this.apiKey,
        baseURL: this.baseUrl || config.baseUrl,
      });
    }
    return this.client;
  }
  
  createModel(modelId?: string): LanguageModel {
    const model = modelId || this.config.defaultModel;
    return this.getClient()(model) as any;
  }
}