export class AiChatError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AiChatError';
  }
}

export class ApiKeyMissingError extends AiChatError {
  constructor(envKey: string, provider: string) {
    const message = `${envKey} not found. Please set the ${envKey} environment variable to use ${provider}.

To set it:
  • Linux/Mac: export ${envKey}="your-api-key"
  • Windows: set ${envKey}="your-api-key"
  • Or add it to a .env file: ${envKey}=your-api-key`;
    
    super(message, 'API_KEY_MISSING', { envKey, provider });
  }
}

export class ProviderNotFoundError extends AiChatError {
  constructor(requested: string, available: string[]) {
    const message = `Provider "${requested}" not found.
Available providers: ${available.join(', ')}

Usage:
  msg-ai <provider> "your message"
  msg-ai list-providers`;
    
    super(message, 'PROVIDER_NOT_FOUND', { requested, available });
  }
}

export class ModelNotFoundError extends AiChatError {
  constructor(model: string, provider: string, available: string[]) {
    const message = `Model "${model}" not found for provider ${provider}.
Available models: ${available.join(', ')}`;
    
    super(message, 'MODEL_NOT_FOUND', { model, provider, available });
  }
}

export class NetworkError extends AiChatError {
  constructor(message: string, originalError?: Error) {
    super(message, 'NETWORK_ERROR', { 
      originalError: originalError?.message 
    });
  }
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AiChatError) {
      console.error(`❌ ${error.message}`);
      if (error.details && process.env['DEBUG']) {
        console.error('Details:', error.details);
      }
      process.exit(1);
    }
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        console.error(`⏱️ Rate limit exceeded${context ? ` for ${context}` : ''}`);
      } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
        console.error(`🔐 Authentication failed${context ? ` for ${context}` : ''}`);
      } else {
        console.error(`❌ Error${context ? ` in ${context}` : ''}: ${error.message}`);
      }
      
      if (process.env['DEBUG']) {
        console.error('Stack:', error.stack);
      }
      process.exit(1);
    }
    
    console.error(`❌ Unknown error${context ? ` in ${context}` : ''}:`, error);
    process.exit(1);
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      const waitTime = delay * Math.pow(backoff, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('Retry failed');
}