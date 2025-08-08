#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import ora from 'ora';
import { ProviderRegistry } from '../providers/registry.js';
import { ChatCommand, ListProvidersCommand } from './commands.js';
import { withErrorHandling } from '../utils/errors.js';
import { formatModelsTable } from '../utils/model-formatter.js';

// Load environment variables
dotenv.config();

const registry = new ProviderRegistry();
const chatCommand = new ChatCommand(registry);
const listCommand = new ListProvidersCommand(registry);

export async function createCLI(): Promise<Command> {
  const {default:{version}} = await import('../../package.json', { with: { type: 'json' } });
  const program = new Command();
  
  program
    .name('msg-ai')
    .description('Multi-provider AI chat CLI powered by Vercel AI SDK')
    .version(version as unknown as string);
  
  // Main chat command (default)
  program
    .argument('[provider]', 'AI provider (openai, gemini, grok, deepseek, kimi, anthropic)')
    .argument('[message...]', 'Your message to the AI')
    .option('-m, --model <model>', 'Specific model to use')
    .option('-t, --temperature <number>', 'Temperature (0-2)', '0.7')
    .option('-x, --max-tokens <number>', 'Maximum tokens in response')
    .option('-s, --stream', 'Stream the response', true)
    .option('--no-stream', 'Disable streaming')
    .option('--system <prompt>', 'System prompt')
    .option('-r, --reasoning <effort>', 'Reasoning effort for GPT-5 (minimal, low, medium, high)')
    .option('--timing', 'Show response timing', true)
    .option('--no-timing', 'Hide response timing')
    .action(async (provider, messageArray, options) => {
      if (!provider && (!messageArray || messageArray.length === 0)) {
        // No arguments provided, show help
        program.help();
        return;
      }
      
      let actualProvider: string | undefined;
      let message: string;
      
      // Check if first argument is a provider or part of the message
      if (provider && registry.listAllProviders().includes(provider)) {
        actualProvider = provider;
        message = messageArray?.join(' ') || '';
      } else {
        // First argument is part of the message
        actualProvider = undefined;
        message = [provider, ...(messageArray || [])].filter(Boolean).join(' ');
      }
      
      if (!message.trim()) {
        console.error(chalk.red('❌ Please provide a message'));
        process.exit(1);
      }
      
      try {
        await chatCommand.execute(actualProvider, message, {
          model: options.model,
          temperature: parseFloat(options.temperature),
          maxTokens: options.maxTokens ? parseInt(options.maxTokens) : undefined,
          stream: options.stream,
          systemPrompt: options.system,
          reasoningEffort: options.reasoning,
          showTiming: options.timing,
        });
      } catch (error) {
        // Import and use handleChatError
        const { handleChatError } = await import('../utils/errors.js');
        handleChatError(error, actualProvider);
      }
    });
  
  // List providers command
  program
    .command('list')
    .alias('ls')
    .description('List all available AI providers and their status')
    .option('--simple', 'Show simple list without detailed model tables')
    .action(async (options) => {
      await listCommand.execute({ detailed: !options.simple });
    });
  
  // List models for a specific provider
  program
    .command('models [provider]')
    .description('List all available models for a provider (fetches from API)')
    .action(async (providerName) => {
      if (!providerName) {
        // List models for all available providers
        await listCommand.execute();
        return;
      }
      
      const provider = registry.get(providerName);
      if (!provider) {
        console.error(chalk.red(`❌ Unknown provider: ${providerName}`));
        console.log(chalk.yellow('Available providers:'), registry.listAllProviders().join(', '));
        process.exit(1);
      }
      
      if (!provider.isAvailable()) {
        console.error(chalk.red(`❌ ${provider.displayName} is not configured`));
        console.error(chalk.yellow(`Set ${providerName.toUpperCase()}_API_KEY environment variable`));
        process.exit(1);
      }
      
      const spinner = ora({
        text: 'Fetching models from API...',
        spinner: 'dots',
      }).start();
      
      try {
        const models = await provider.fetchAvailableModels();
        spinner.succeed(chalk.green(`Found ${models.length} models`));
        
        // Display models in a nice table format
        console.log(formatModelsTable(provider.displayName, models, true));
        
        console.log(chalk.gray('\nUsage example:'));
        console.log(chalk.gray(`  msg-ai ${providerName} "Your message" -m ${models[0]}`));
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch models'));
        console.error(chalk.yellow('Using static model list as fallback:'));
        const staticModels = provider.getAvailableModels();
        console.log(formatModelsTable(provider.displayName, staticModels, true));
      }
    });
  
  // Slash command style
  program
    .command('chat <message>')
    .description('Send a chat message (alternative syntax)')
    .option('-p, --provider <provider>', 'AI provider')
    .option('-m, --model <model>', 'Specific model to use')
    .option('-t, --temperature <number>', 'Temperature (0-2)', '0.7')
    .option('-x, --max-tokens <number>', 'Maximum tokens')
    .option('-s, --stream', 'Stream the response', true)
    .option('-r, --reasoning <effort>', 'Reasoning effort for GPT-5 (minimal, low, medium, high)')
    .option('--timing', 'Show response timing', true)
    .option('--no-timing', 'Hide response timing')
    .action(async (message, options) => {
      await chatCommand.execute(options.provider, message, {
        model: options.model,
        temperature: parseFloat(options.temperature),
        maxTokens: options.maxTokens ? parseInt(options.maxTokens) : undefined,
        stream: options.stream,
        reasoningEffort: options.reasoning,
        showTiming: options.timing,
      });
    });
  
  return program;
}

export async function run(): Promise<void> {
  const program = await createCLI();
  
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    await withErrorHandling(async () => {
      throw error;
    }, 'CLI execution');
  }
}