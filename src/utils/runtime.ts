// Runtime detection and compatibility layer
export const runtime = {
  isBun: typeof Bun !== 'undefined',
  isNode: typeof process !== 'undefined' && typeof Bun === 'undefined',
  
  // Get runtime name and version
  get name(): string {
    if (this.isBun) return 'Bun';
    return 'Node.js';
  },
  
  get version(): string {
    if (this.isBun) return Bun.version;
    return process.version;
  },
  
  // Environment variables with Bun optimization
  env(key: string): string | undefined {
    if (this.isBun) {
      return Bun.env[key];
    }
    return process.env[key];
  },
  
  // File operations optimized for Bun
  async readFile(path: string): Promise<string> {
    if (this.isBun) {
      const file = Bun.file(path);
      return await file.text();
    }
    const fs = await import('node:fs/promises');
    return await fs.readFile(path, 'utf-8');
  },
  
  async writeFile(path: string, content: string): Promise<void> {
    if (this.isBun) {
      await Bun.write(path, content);
    } else {
      const fs = await import('node:fs/promises');
      await fs.writeFile(path, content, 'utf-8');
    }
  },
  
  async fileExists(path: string): Promise<boolean> {
    if (this.isBun) {
      const file = Bun.file(path);
      return await file.exists();
    }
    const fs = await import('node:fs/promises');
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  },
  
  // Performance timing
  now(): number {
    if (this.isBun) {
      return Bun.nanoseconds() / 1_000_000; // Convert to milliseconds
    }
    return performance.now();
  }
};

// Export runtime info for debugging
export function getRuntimeInfo(): string {
  return `${runtime.name} ${runtime.version}`;
}