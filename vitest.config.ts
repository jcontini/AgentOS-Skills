import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Look for tests in apps and connectors directories
    include: [
      'apps/**/tests/**/*.test.ts',
      'connectors/**/tests/**/*.test.ts',
    ],
    
    // Global setup (starts MCP connection)
    globalSetup: './tests/setup.ts',
    
    // Test environment
    environment: 'node',
    
    // Timeout for slow operations
    testTimeout: 30000,
    
    // Run tests sequentially (MCP connection is shared)
    sequence: {
      concurrent: false,
    },
    
    // Reporter
    reporter: ['verbose'],
  },
});
