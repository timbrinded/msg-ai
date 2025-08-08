import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { LanguageModel } from 'ai';
import { BaseProvider } from './base.js';
import type { ProviderConfig } from '../types/index.js';

const config: ProviderConfig = {
  name: 'gemini',
  displayName: 'Google Gemini',
  envKey: 'GEMINI_API_KEY',
  alternativeEnvKeys: ['GOOGLE_API_KEY'],
  defaultModel: 'gemini-2.5-pro',
  models: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', maxTokens: 1048576 },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', maxTokens: 1048576 },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', maxTokens: 1048576 },
  ],
};

export class GeminiProvider extends BaseProvider {
  private client?: ReturnType<typeof createGoogleGenerativeAI>;
  private cachedModels?: string[];
  private modelsCacheTime?: number;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

  constructor() {
    super(config);
  }

  private getClient() {
    if (!this.client) {
      this.assertAvailable();
      this.client = createGoogleGenerativeAI({
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

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);

      if (!response.ok) {
        console.error('Failed to fetch Gemini models, using static list');
        return this.getAvailableModels();
      }

      const data = await response.json() as {
        models: Array<{
          name: string;
          supportedGenerationMethods: string[];
        }>
      };

      // Filter for models that support generateContent (chat models)
      const chatModels = data.models
        .filter(model =>
          model.supportedGenerationMethods?.includes('generateContent')
        )
        .map(model => model.name.replace('models/', ''))
        .filter(name => name.includes('gemini')); // Only include Gemini models

      // Cache the results
      this.cachedModels = chatModels.length > 0 ? chatModels : this.getAvailableModels();
      this.modelsCacheTime = Date.now();

      return this.cachedModels;
    } catch (error) {
      console.error('Error fetching Gemini models:', error);
      return this.getAvailableModels(); // Fallback to static list
    }
  }

  createModel(modelId?: string): LanguageModel {
    const model = modelId || this.config.defaultModel;
    return this.getClient()(model) as any;
  }
}