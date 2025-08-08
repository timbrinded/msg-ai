# MSG AI

A robust, type-safe CLI tool for interacting with multiple AI providers using the Vercel AI SDK. **Now optimized for Bun runtime** with 3-10x faster startup and native TypeScript execution!

## Features

- 🚀 **Bun Optimized**: Native TypeScript execution without compilation
- 🤖 **Multiple AI Providers**: OpenAI, Google Gemini, X.AI Grok, DeepSeek, Kimi/Moonshot
- 🔒 **Full TypeScript Type Safety**: Strict typing throughout
- 🔑 **Automatic API Key Detection**: From environment variables
- 📝 **Clear Error Messages**: Helpful guidance when API keys are missing
- 🔄 **Streaming Support**: Real-time responses
- 💻 **Slash Command Support**: Easy CLI interface
- 🔀 **Dual Runtime Support**: Works with both Bun and Node.js

## Installation

### With Bun (Recommended - Fastest)

```bash
# Global installation
bun add -g msg-ai

# Or run directly without installation
bunx msg-ai
```

### With npm/Node.js

```bash
# Global installation
npm install -g msg-ai

# Or run directly without installation
npx msg-ai
```

### From Source

```bash
# Clone the repository
git clone https://github.com/yourusername/msg-ai.git
cd msg-ai

# Install with Bun (fastest)
bun install
bun link

# Or install with npm
npm install
npm run build
npm link
```

## Configuration

Set your API keys as environment variables:

```bash
# OpenAI
export OPENAI_API_KEY="your-key"

# Google Gemini
export GEMINI_API_KEY="your-key"
# or
export GOOGLE_API_KEY="your-key"

# X.AI (Grok)
export XAI_API_KEY="your-key"

# DeepSeek
export DEEPSEEK_API_KEY="your-key"

# Kimi/Moonshot
export KIMI_API_KEY="your-key"
# or
export MOONSHOT_API_KEY="your-key"
```

Or create a `.env` file in the project root.

## Usage

### Basic Chat
```bash
# Auto-detect provider (uses first available)
msg-ai "What is the meaning of life?"

# Specify provider
msg-ai openai "Tell me a joke"
msg-ai gemini "Write a poem"
msg-ai grok "Explain quantum computing"
```

### With Options
```bash
# Specify model
msg-ai openai "Explain quantum computing" --model gpt-4o

# Adjust temperature
msg-ai --temperature 0.9 "Write a creative story"

# Disable streaming
msg-ai --no-stream "Quick calculation: 25 * 4"

# Custom system prompt
msg-ai --system "You are a pirate" "Tell me about the ocean"
```

### List Available Providers
```bash
msg-ai list
# or
msg-ai ls
```

### Alternative Syntax
```bash
msg-ai chat "Your message" --provider openai
```

## Available Models

### OpenAI
- gpt-4o (recommended)
- gpt-4o-mini
- gpt-4-turbo
- gpt-4
- gpt-3.5-turbo

### Google Gemini
- gemini-1.5-pro
- gemini-1.5-flash
- gemini-1.5-flash-8b
- gemini-2.0-flash-exp

### X.AI Grok
- grok-3
- grok-3-fast
- grok-3-mini
- grok-beta
- grok-2-beta
- grok-2-vision-beta

### DeepSeek
- deepseek-chat
- deepseek-reasoner

### Kimi/Moonshot
- moonshot-v1-8k
- moonshot-v1-32k
- moonshot-v1-128k

## Development

### With Bun (Optimized Build System)
```bash
# Install dependencies
bun install

# Run in development mode (no compilation needed!)
bun run dev

# Run tests
bun test

# Type check
bun run typecheck

# Build with Bun's native build system
bun run build
bun run build:binary

# Both builds are required for publishing
```

## Performance

Built with Bun's native build system for optimal performance:
- **Fast bundled output** optimized for production
- **Direct TypeScript execution** during development
- **Faster package installation** with `bun install`
- **Native performance optimizations** for file I/O

## Architecture

- **Provider Registry Pattern**: Easy to add new providers
- **Factory Pattern**: Dynamic provider instantiation
- **Strict TypeScript**: Maximum type safety
- **Error Hierarchy**: Clear, actionable error messages
- **Modular Design**: Clean separation of concerns
- **Runtime Detection**: Automatic Bun/Node.js compatibility

## Publishing to NPM

```bash
# Ensure tests pass
bun test

# Build for distribution using Bun build system
bun run build
bun run build:binary

# Update version
npm version patch|minor|major

# Publish to NPM
npm publish
```

The package is configured to work with both `bunx` and `npx` out of the box!

## Adding New Providers

1. Create a new provider file in `src/providers/`
2. Extend `BaseProvider` class
3. Register in `ProviderRegistry`
4. Add to supported providers list

## Troubleshooting

### Command not found
If `msg-ai` command is not found after installation:
- With Bun: Run `bun link` in the project directory
- With npm: Run `npm link` in the project directory

### API Key Issues
- Ensure environment variables are set correctly
- Check `.env` file is in the correct location
- Run `msg-ai list` to see which providers are configured

### Performance Issues
- Use Bun runtime for best performance: `bun add -g msg-ai`
- If using Node.js, ensure you have Node 18+ installed

## License

MIT