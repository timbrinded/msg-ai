import type { CoreMessage } from 'ai';

export const SUPPORTED_PROVIDERS = [
  'openai',
  'gemini',
  'grok',
  'deepseek',
  'kimi'
] as const;

export type SupportedProvider = typeof SUPPORTED_PROVIDERS[number];

export interface ProviderConfig {
  name: string;
  displayName: string;
  envKey: string;
  alternativeEnvKeys?: string[];
  baseUrl?: string;
  models: ModelConfig[];
  defaultModel: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  contextWindow?: number;
  maxTokens?: number;
}

export interface ChatOptions {
  provider?: SupportedProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream?: boolean;
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high';
  showTiming?: boolean;
}

export interface ChatRequest {
  messages: CoreMessage[];
  options?: ChatOptions;
}

export interface ChatResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}