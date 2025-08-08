#!/usr/bin/env node

import { run } from './cli/index.js';
import { handleChatError } from './utils/errors.js';

process.on('uncaughtException', (error) => {
  handleChatError(error);
});

process.on('unhandledRejection', (error) => {
  handleChatError(error);
});

run().catch(error => {
  handleChatError(error);
});