#!/usr/bin/env bun

import { run } from './cli/index.js';

// Run the CLI
run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});