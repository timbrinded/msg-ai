import chalk from 'chalk';
import ora from 'ora';
import { ProviderRegistry } from '../providers/registry.js';
import { withErrorHandling } from '../utils/errors.js';
import { formatModelsTable } from '../utils/model-formatter.js';
import type { ChatOptions } from '../types/index.js';

export class ChatCommand {
  constructor(private registry: ProviderRegistry) {}
  
  async execute(
    providerName: string | undefined,
    message: string,
    options: ChatOptions
  ): Promise<void> {
    await withErrorHandling(async () => {
      // Auto-detect provider if not specified
      const provider = providerName 
        ? this.registry.get(providerName)
        : this.registry.getFirstAvailable();
      
      if (!provider) {
        console.error(chalk.red('❌ No available providers found.'));
        console.error(chalk.yellow('Please set at least one API key:'));
        this.registry.listAvailableProviders().forEach(p => {
          console.error(chalk.gray(`  • ${p.displayName}: Set ${p.name.toUpperCase()}_API_KEY`));
        });
        process.exit(1);
      }
      
      provider.assertAvailable();
      
      const spinner = ora({
        text: `Chatting with ${chalk.cyan(provider.displayName)}...`,
        spinner: 'dots',
      }).start();
      
      try {
        if (options.stream) {
          spinner.stop();
          console.log(chalk.cyan(`${provider.displayName}:`));
          
          const stream = provider.streamChat(
            [{ role: 'user', content: message }],
            options
          );
          
          for await (const chunk of stream) {
            process.stdout.write(chunk);
          }
          console.log();
        } else {
          const response = await provider.chat(
            [{ role: 'user', content: message }],
            options
          );
          
          spinner.succeed(chalk.green(`Response from ${provider.displayName}`));
          console.log();
          console.log(response.content);
          
          if (response.usage && process.env['DEBUG']) {
            console.log();
            console.log(chalk.gray('Usage:'));
            console.log(chalk.gray(`  Prompt tokens: ${response.usage.promptTokens}`));
            console.log(chalk.gray(`  Completion tokens: ${response.usage.completionTokens}`));
            console.log(chalk.gray(`  Total tokens: ${response.usage.totalTokens}`));
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to get response'));
        throw error;
      }
    }, 'chat command');
  }
}

export class ListProvidersCommand {
  constructor(private registry: ProviderRegistry) {}
  
  async execute(options?: { detailed?: boolean }): Promise<void> {
    const providers = this.registry.listAvailableProviders();
    
    console.log(chalk.bold('\n📋 Available AI Providers:\n'));
    
    const maxNameLength = Math.max(...providers.map(p => p.displayName.length));
    
    // Show loading spinner
    const spinner = ora({
      text: 'Fetching available models from APIs...',
      spinner: 'dots',
    }).start();
    
    // Fetch models for all available providers in parallel
    const modelPromises = providers.map(async (providerInfo) => {
      if (providerInfo.available) {
        const provider = this.registry.get(providerInfo.name);
        if (provider) {
          try {
            const models = await provider.fetchAvailableModels();
            return { name: providerInfo.name, displayName: providerInfo.displayName, models };
          } catch (error) {
            return { name: providerInfo.name, displayName: providerInfo.displayName, models: providerInfo.models };
          }
        }
      }
      return { name: providerInfo.name, displayName: providerInfo.displayName, models: providerInfo.models };
    });
    
    const modelResults = await Promise.all(modelPromises);
    const modelMap = new Map(modelResults.map(r => [r.name, { displayName: r.displayName, models: r.models }]));
    
    spinner.stop();
    
    // Show summary first
    for (const provider of providers) {
      const status = provider.available 
        ? chalk.green('✅ Available')
        : chalk.red('❌ Missing API Key');
      
      const name = provider.displayName.padEnd(maxNameLength);
      console.log(`  ${chalk.cyan(name)}  ${status}`);
      
      if (provider.available) {
        const modelData = modelMap.get(provider.name);
        if (modelData && modelData.models.length > 0) {
          console.log(chalk.gray(`     ${modelData.models.length} models available`));
        }
      } else {
        const envKey = `${provider.name.toUpperCase().replace('-', '_')}_API_KEY`;
        console.log(chalk.gray(`     Set ${envKey} to enable`));
      }
    }
    
    const availableCount = providers.filter(p => p.available).length;
    console.log(chalk.dim(`\n${availableCount} of ${providers.length} providers configured`));
    
    // Show detailed model tables for available providers
    if (options?.detailed !== false) {
      console.log(chalk.bold.yellow('\n\n📊 Model Details:\n'));
      
      for (const provider of providers) {
        if (provider.available) {
          const modelData = modelMap.get(provider.name);
          if (modelData && modelData.models.length > 0) {
            console.log(formatModelsTable(modelData.displayName, modelData.models, true));
          }
        }
      }
    }
    
    console.log(chalk.gray('\nTip: Use "msg-ai models <provider>" to see models for a specific provider'));
  }
}