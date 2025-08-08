#!/usr/bin/env node

import { run } from './cli/index.js';
import { handleChatError } from './utils/errors.js';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  handleChatError(error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  handleChatError(error);
});

// Run the CLI
run().catch(error => {
  handleChatError(error);
});