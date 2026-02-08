#!/usr/bin/env node
/**
 * autology MCP server entry point
 */
import { Server } from './server.js';

const server = new Server();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  void server.close().then(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  void server.close().then(() => process.exit(0));
});

// Start server
server.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
