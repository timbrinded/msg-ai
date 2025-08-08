import chalk from 'chalk';

export function handleChatError(error: any, _providerName?: string): never {
  // For AI SDK errors, show only essential info
  if (error?.statusCode && error?.responseBody) {
    console.error(chalk.red(`\n❌ ${error.name || 'API Error'} (${error.statusCode})`));
    
    try {
      const responseData = JSON.parse(error.responseBody);
      if (responseData.error?.message) {
        console.error(chalk.yellow(`   ${responseData.error.message}`));
      } else if (responseData.error) {
        console.error(chalk.yellow(`   ${typeof responseData.error === 'string' ? responseData.error : JSON.stringify(responseData.error)}`));
      } else {
        console.error(chalk.yellow(`   ${error.responseBody}`));
      }
    } catch {
      console.error(chalk.yellow(`   ${error.responseBody}`));
    }
    
    process.exit(1);
  }
  
  // For other errors, show name and message
  if (error instanceof Error) {
    console.error(chalk.red(`\n❌ ${error.name || 'Error'}`));
    console.error(chalk.yellow(`   ${error.message}`));
  } else {
    console.error(chalk.red(`\n❌ Error`));
    console.error(chalk.yellow(`   ${String(error)}`));
  }
  
  process.exit(1);
}

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
      // Check for AI SDK specific errors
      const errorObj = error as any;
      const errorMessage = error.message.toLowerCase();
      
      // Handle AI SDK API errors with response body
      if (errorObj.responseBody) {
        try {
          const responseData = JSON.parse(errorObj.responseBody);
          if (responseData.error) {
            console.error(chalk.red(`\n🤖 Model Error${context ? ` in ${context}` : ''}`));
            console.error(chalk.yellow(`   ${responseData.error}`));
            if (responseData.error.includes('does not exist')) {
              console.error(chalk.gray(`   Try running: msg-ai models <provider> to see available models`));
            }
            process.exit(1);
          }
        } catch {
          // If parsing fails, continue with regular error handling
        }
      }
      
      // Pretty error formatting based on error type
      if (errorMessage.includes('rate limit')) {
        console.error(chalk.yellow(`\n⏱️  Rate limit exceeded${context ? ` for ${context}` : ''}`));
        console.error(chalk.gray(`   Please wait a moment before trying again.`));
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        console.error(chalk.red(`\n🔐 Authentication failed${context ? ` for ${context}` : ''}`));
        console.error(chalk.gray(`   Please check your API key.`));
      } else if (errorMessage.includes('model') && (errorMessage.includes('not found') || errorMessage.includes('does not exist') || errorMessage.includes('invalid'))) {
        console.error(chalk.red(`\n🤖 Model Error${context ? ` in ${context}` : ''}`));
        console.error(chalk.yellow(`   ${error.message}`));
        console.error(chalk.gray(`   Try running: msg-ai models <provider> to see available models`));
      } else if (errorMessage.includes('unsupported model version')) {
        console.error(chalk.yellow(`\n⚠️  Model Compatibility Issue`));
        console.error(chalk.gray(`   ${error.message}`));
        console.error(chalk.gray(`   This model may require a different SDK version or may not be available yet.`));
      } else if (errorMessage.includes('network') || errorMessage.includes('econnrefused') || errorMessage.includes('timeout')) {
        console.error(chalk.red(`\n🌐 Network Error${context ? ` in ${context}` : ''}`));
        console.error(chalk.gray(`   Unable to connect to the API. Please check your internet connection.`));
      } else if (errorMessage.includes('context length') || errorMessage.includes('token limit')) {
        console.error(chalk.yellow(`\n📏 Context Length Exceeded`));
        console.error(chalk.gray(`   Your message is too long for this model. Try a shorter message.`));
      } else if (errorMessage.includes('quota') || errorMessage.includes('insufficient')) {
        console.error(chalk.red(`\n💳 Quota Exceeded`));
        console.error(chalk.gray(`   You've exceeded your API quota. Please check your billing.`));
      } else if (errorObj.statusCode === 404) {
        console.error(chalk.red(`\n🤖 Model or Endpoint Not Found`));
        console.error(chalk.yellow(`   The requested model or API endpoint was not found.`));
        console.error(chalk.gray(`   Try running: msg-ai models <provider> to see available models`));
      } else {
        // Generic error with pretty formatting
        console.error(chalk.red(`\n❌ Error${context ? ` in ${context}` : ''}`));
        const lines = error.message.split('\n');
        lines.forEach((line, i) => {
          if (i === 0) {
            console.error(chalk.yellow(`   ${line}`));
          } else {
            console.error(chalk.gray(`   ${line}`));
          }
        });
      }
      
      if (process.env['DEBUG']) {
        console.error('\n📋 Debug Information:');
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