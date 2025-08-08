import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { LanguageModel } from 'ai';
import { BaseProvider } from './base.js';
import type { ProviderConfig } from '../types/index.js';

const config: ProviderConfig = {
  name: 'kimi',
  displayName: 'Kimi (Moonshot)',
  envKey: 'KIMI_API_KEY',
  alternativeEnvKeys: ['MOONSHOT_API_KEY'],
  baseUrl: 'https://api.moonshot.ai/v1',
  defaultModel: 'moonshot-v1-8k',
  models: [
    { id: 'moonshot-v1-8k', name: 'Moonshot v1 8K', maxTokens: 8192 },
    { id: 'moonshot-v1-32k', name: 'Moonshot v1 32K', maxTokens: 32768 },
    { id: 'moonshot-v1-128k', name: 'Moonshot v1 128K', maxTokens: 131072 },
  ],
};

export class KimiProvider extends BaseProvider {
  private client?: ReturnType<typeof createOpenAICompatible>;
  
  constructor() {
    super(config);
  }
  
  private getClient() {
    if (!this.client) {
      this.assertAvailable();
      this.client = createOpenAICompatible({
        baseURL: this.baseUrl || config.baseUrl,
        apiKey: this.apiKey,
        name: 'kimi',
      });
    }
    return this.client;
  }
  
  createModel(modelId?: string): LanguageModel {
    const model = modelId || this.config.defaultModel;
    return this.getClient().chatModel(model) as any;
  }
}