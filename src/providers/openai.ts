import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModel } from 'ai';
import { BaseProvider } from './base.js';
import type { ProviderConfig } from '../types/index.js';

const config: ProviderConfig = {
  name: 'openai',
  displayName: 'OpenAI',
  envKey: 'OPENAI_API_KEY',
  defaultModel: 'gpt-4o-mini',
  models: [
    { id: 'gpt-4o', name: 'GPT-4 Optimized', maxTokens: 16384 },
    { id: 'gpt-4o-mini', name: 'GPT-4 Optimized Mini', maxTokens: 16384 },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 128000 },
    { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 16384 },
  ],
};

export class OpenAIProvider extends BaseProvider {
  private client?: ReturnType<typeof createOpenAI>;
  private cachedModels?: string[];
  private modelsCacheTime?: number;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache
  
  constructor() {
    super(config);
  }
  
  private getClient() {
    if (!this.client) {
      this.assertAvailable();
      this.client = createOpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseUrl,
      });
    }
    return this.client;
  }
  
  override async fetchAvailableModels(): Promise<string[]> {
    // Return cached models if still valid
    if (this.cachedModels && this.modelsCacheTime && 
        Date.now() - this.modelsCacheTime < this.CACHE_DURATION) {
      return this.cachedModels;
    }
    
    try {
      if (!this.isAvailable()) {
        return this.getAvailableModels(); // Return static list if no API key
      }
      
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch OpenAI models, using static list');
        return this.getAvailableModels();
      }
      
      const data = await response.json() as { data: Array<{ id: string; created: number }> };
      
      // Filter for chat models and sort by creation date (newest first)
      const chatModels = data.data
        .filter(model => 
          model.id.includes('gpt') || 
          model.id.includes('o1') ||
          model.id.includes('chatgpt')
        )
        .sort((a, b) => b.created - a.created)
        .map(model => model.id);
      
      // Cache the results
      this.cachedModels = chatModels.length > 0 ? chatModels : this.getAvailableModels();
      this.modelsCacheTime = Date.now();
      
      return this.cachedModels;
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      return this.getAvailableModels(); // Fallback to static list
    }
  }
  
  createModel(modelId?: string): LanguageModel {
    const model = modelId || this.config.defaultModel;
    return this.getClient()(model) as any;
  }
}