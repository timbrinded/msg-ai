import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModelV1 } from 'ai';
import { BaseProvider } from './base.js';
import type { ProviderConfig } from '../types/index.js';

const config: ProviderConfig = {
  name: 'deepseek',
  displayName: 'DeepSeek',
  envKey: 'DEEPSEEK_API_KEY',
  baseUrl: 'https://api.deepseek.com/v1',
  defaultModel: 'deepseek-chat',
  models: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', maxTokens: 65536 },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', maxTokens: 65536 },
  ],
};

export class DeepseekProvider extends BaseProvider {
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