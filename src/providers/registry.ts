import { BaseProvider } from './base.js';
import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';
import { GrokProvider } from './grok.js';
import { DeepseekProvider } from './deepseek.js';
import { KimiProvider } from './kimi.js';
import { AnthropicProvider } from './anthropic.js';
import { ProviderNotFoundError } from '../utils/errors.js';

export class ProviderRegistry {
  private providers = new Map<string, BaseProvider>();
  
  constructor() {
    this.registerProviders();
  }
  
  private registerProviders(): void {
    const providerClasses = [
      OpenAIProvider,
      GeminiProvider,
      GrokProvider,
      DeepseekProvider,
      KimiProvider,
      AnthropicProvider,
    ];
    
    for (const ProviderClass of providerClasses) {
      const provider = new ProviderClass();
      this.providers.set(provider.name, provider);
    }
  }
  
  get(name: string): BaseProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new ProviderNotFoundError(name, this.listAllProviders());
    }
    return provider;
  }
  
  listAllProviders(): string[] {
    return Array.from(this.providers.keys());
  }
  
  listAvailableProviders(): Array<{
    name: string;
    displayName: string;
    available: boolean;
    models: string[];
  }> {
    return Array.from(this.providers.values()).map(provider => ({
      name: provider.name,
      displayName: provider.displayName,
      available: provider.isAvailable(),
      models: provider.getAvailableModels(),
    }));
  }
  
  getFirstAvailable(): BaseProvider | null {
    const providers = Array.from(this.providers.values());
    for (const provider of providers) {
      if (provider.isAvailable()) {
        return provider;
      }
    }
    return null;
  }
}