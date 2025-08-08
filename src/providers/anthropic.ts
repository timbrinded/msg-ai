import { createAnthropic } from '@ai-sdk/anthropic';
import { LanguageModelV1 } from 'ai';
import { BaseProvider } from './base.js';
import type { ProviderConfig } from '../types/index.js';

const config: ProviderConfig = {
  name: 'anthropic',
  displayName: 'Anthropic (Claude)',
  envKey: 'ANTHROPIC_API_KEY',
  alternativeEnvKeys: ['CLAUDE_API_KEY'],
  defaultModel: 'claude-3-5-sonnet-20241022',
  models: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Oct 2024)', maxTokens: 8192 },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Oct 2024)', maxTokens: 8192 },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', maxTokens: 4096 },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', maxTokens: 4096 },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', maxTokens: 4096 },
  ],
};

export class AnthropicProvider extends BaseProvider {
  private client?: ReturnType<typeof createAnthropic>;
  private cachedModels?: string[];
  private modelsCacheTime?: number;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache
  
  constructor() {
    super(config);
  }
  
  private getClient() {
    if (!this.client) {
      this.assertAvailable();
      this.client = createAnthropic({
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
      
      // Anthropic doesn't have a public models endpoint yet
      // So we'll use an enhanced static list of all current Claude models
      const anthropicModels = [
        // Claude 3.5 models (newest)
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        
        // Claude 3 Opus (most capable)
        'claude-3-opus-20240229',
        'claude-3-opus-latest',
        
        // Claude 3 Sonnet (balanced)
        'claude-3-sonnet-20240229',
        
        // Claude 3 Haiku (fastest)
        'claude-3-haiku-20240307',
        
        // Legacy models (still available)
        'claude-2.1',
        'claude-2.0',
        'claude-instant-1.2',
      ];
      
      // Cache the results
      this.cachedModels = anthropicModels;
      this.modelsCacheTime = Date.now();
      
      return this.cachedModels;
    } catch (error) {
      console.error('Error with Anthropic models:', error);
      return this.getAvailableModels(); // Fallback to static list
    }
  }
  
  createModel(modelId?: string): LanguageModelV1 {
    const model = modelId || this.config.defaultModel;
    return this.getClient()(model) as any;
  }
}