import { CoreMessage, generateText, streamText, LanguageModel } from 'ai';
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
  
  get defaultModel(): string {
    return this.config.defaultModel;
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
  
  abstract createModel(modelId?: string): LanguageModel;
  
  async chat(
    messages: CoreMessage[], 
    options?: ChatOptions
  ): Promise<ChatResponse> {
    this.assertAvailable();
    
    const modelId = options?.model || this.config.defaultModel;
    const model = this.createModel(modelId);
    
    const generateOptions: any = {
      model,
      messages,
      temperature: options?.temperature,
      maxRetries: 3,
    };
    
    // Add reasoning effort for OpenAI GPT-5 models
    if (options?.reasoningEffort && this.name === 'openai') {
      generateOptions.providerOptions = {
        openai: { reasoningEffort: options.reasoningEffort }
      };
    }
    
    const result = await generateText(generateOptions);
    
    return {
      content: result.text,
      provider: this.name,
      model: modelId,
      usage: result.usage ? {
        promptTokens: result.usage.inputTokens || 0,
        completionTokens: result.usage.outputTokens || 0,
        totalTokens: result.usage.totalTokens || ((result.usage.inputTokens || 0) + (result.usage.outputTokens || 0)),
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
    
    try {
      const streamOptions: any = {
        model,
        messages,
        temperature: options?.temperature,
        maxRetries: 3,
      };
      
      // Add reasoning effort for OpenAI GPT-5 models
      if (options?.reasoningEffort && this.name === 'openai') {
        streamOptions.providerOptions = {
          openai: { reasoningEffort: options.reasoningEffort }
        };
      }
      
      const result = await streamText(streamOptions);
      
      for await (const chunk of result.textStream) {
        yield chunk;
      }
    } catch (error: any) {
      // Re-throw with additional context if needed
      throw error;
    }
  }
}