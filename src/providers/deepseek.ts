import { createDeepSeek } from '@ai-sdk/deepseek';
import { LanguageModel } from 'ai';
import { BaseProvider } from './base.js';
import type { ProviderConfig } from '../types/index.js';

const config: ProviderConfig = {
  name: 'deepseek',
  displayName: 'DeepSeek',
  envKey: 'DEEPSEEK_API_KEY',
  baseUrl: 'https://api.deepseek.com',
  defaultModel: 'deepseek-chat',
  models: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', maxTokens: 65536 },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', maxTokens: 65536 },
  ],
};

export class DeepseekProvider extends BaseProvider {
  private client?: ReturnType<typeof createDeepSeek>;
  
  constructor() {
    super(config);
  }
  
  private getClient() {
    if (!this.client) {
      this.assertAvailable();
      this.client = createDeepSeek({
        apiKey: this.apiKey,
        baseURL: this.baseUrl,
      });
    }
    return this.client;
  }
  
  createModel(modelId?: string): LanguageModel {
    const model = modelId || this.config.defaultModel;
    return this.getClient()(model) as any;
  }
}