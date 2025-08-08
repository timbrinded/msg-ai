import { CoreMessage, generateText, streamText, LanguageModelV1 } from 'ai';
import { ApiKeyMissingError } from '../utils/errors.js';
import type { ChatOptions, ChatResponse, ProviderConfig } from '../types/index.js';

export abstract class BaseProvider {
  protected apiKey?: string;
  protected baseUrl?: string;
  
  constructor(protected config: ProviderConfig) {
    this.loadApiKey();
    this.loadBaseUrl();
  }
  
  private loadApiKey(): void {
    // Try primary env key
    this.apiKey = process.env[this.config.envKey];
    
    // Try alternative env keys
    if (!this.apiKey && this.config.alternativeEnvKeys) {
      for (const altKey of this.config.alternativeEnvKeys) {
        this.apiKey = process.env[altKey];
        if (this.apiKey) break;
      }
    }
  }
  
  private loadBaseUrl(): void {
    const baseUrlEnvKey = `${this.config.envKey.replace('_API_KEY', '')}_BASE_URL`;
    this.baseUrl = process.env[baseUrlEnvKey] || this.config.baseUrl;
  }
  
  get name(): string {
    return this.config.name;
  }
  
  get displayName(): string {
    return this.config.displayName;
  }
  
  isAvailable(): boolean {
    return !!this.apiKey;
  }
  
  assertAvailable(): void {
    if (!this.isAvailable()) {
      throw new ApiKeyMissingError(this.config.envKey, this.config.displayName);
    }
  }
  
  getAvailableModels(): string[] {
    return this.config.models.map(m => m.id);
  }
  
  async fetchAvailableModels(): Promise<string[]> {
    // Default implementation returns static models
    // Override in providers that support dynamic model fetching
    return this.getAvailableModels();
  }
  
  abstract createModel(modelId?: string): LanguageModelV1;
  
  async chat(
    messages: CoreMessage[], 
    options?: ChatOptions
  ): Promise<ChatResponse> {
    this.assertAvailable();
    
    const modelId = options?.model || this.config.defaultModel;
    const model = this.createModel(modelId);
    
    const result = await generateText({
      model,
      messages,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });
    
    return {
      content: result.text,
      provider: this.name,
      model: modelId,
      usage: result.usage ? {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      } : undefined,
    };
  }
  
  async *streamChat(
    messages: CoreMessage[],
    options?: ChatOptions
  ): AsyncGenerator<string> {
    this.assertAvailable();
    
    const modelId = options?.model || this.config.defaultModel;
    const model = this.createModel(modelId);
    
    const result = await streamText({
      model,
      messages,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });
    
    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }
}