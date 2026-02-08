/**
 * MCP Server implementation for autology
 */
import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { join } from 'path';
import { NodeStore } from './storage/node-store.js';
import { GraphIndexStore } from './storage/graph-index.js';
import { SearchEngine } from './storage/search.js';
import { SchemaRegistryStore } from './storage/schema-registry.js';
import { registerCaptureTool } from './tools/capture.js';
import { registerQueryTool } from './tools/query.js';
import { registerRelateTool } from './tools/relate.js';
import { registerStatusTool } from './tools/status.js';
import { registerContextTool } from './tools/context.js';

export class Server {
  private mcpServer: McpServer;
  private nodeStore!: NodeStore;
  private graphIndex!: GraphIndexStore;
  private searchEngine!: SearchEngine;
  private schemaRegistry!: SchemaRegistryStore;
  private rootPath: string;

  constructor() {
    this.mcpServer = new McpServer(
      {
        name: 'autology',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Get root path from environment or use default
    this.rootPath = process.env['AUTOLOGY_ROOT'] || '.autology';
  }

  async run(): Promise<void> {
    // Initialize storage
    await this.initializeStorage();

    // Register tools
    this.registerTools();

    // Setup request handlers
    this.setupHandlers();

    // Connect transport
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);

    console.error('autology MCP server running on stdio');
  }

  async close(): Promise<void> {
    await this.mcpServer.close();
  }

  private async initializeStorage(): Promise<void> {
    // Get absolute path
    const absolutePath = join(process.cwd(), this.rootPath);

    // Initialize stores
    this.nodeStore = new NodeStore(absolutePath);
    await this.nodeStore.initialize();

    this.graphIndex = new GraphIndexStore(absolutePath);
    await this.graphIndex.load();

    this.searchEngine = new SearchEngine(this.nodeStore, this.graphIndex);

    this.schemaRegistry = new SchemaRegistryStore(absolutePath);
    await this.schemaRegistry.load();

    console.error(`Storage initialized at: ${absolutePath}`);
  }

  private registerTools(): void {
    const tools: Tool[] = [
      registerCaptureTool(this.nodeStore, this.graphIndex, this.schemaRegistry),
      registerQueryTool(this.searchEngine),
      registerRelateTool(this.nodeStore, this.graphIndex),
      registerStatusTool(this.nodeStore, this.graphIndex),
      registerContextTool(this.nodeStore, this.graphIndex, this.searchEngine),
    ];

    this.mcpServer.setRequestHandler(ListToolsRequestSchema, () => ({
      tools,
    }));
  }

  private setupHandlers(): void {
    this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      try {
        switch (name) {
          case 'autology_capture':
            return await this.handleCapture(args);
          case 'autology_query':
            return await this.handleQuery(args);
          case 'autology_relate':
            return await this.handleRelate(args);
          case 'autology_status':
            return await this.handleStatus(args);
          case 'autology_context':
            return await this.handleContext(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    });
  }

  private async handleCapture(args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }> }> {
    // Implementation in capture.ts
    const { handleCapture } = await import('./tools/capture.js');
    return handleCapture(args, this.nodeStore, this.graphIndex, this.schemaRegistry);
  }

  private async handleQuery(args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { handleQuery } = await import('./tools/query.js');
    return handleQuery(args, this.searchEngine);
  }

  private async handleRelate(args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { handleRelate } = await import('./tools/relate.js');
    return handleRelate(args, this.nodeStore, this.graphIndex);
  }

  private async handleStatus(args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { handleStatus } = await import('./tools/status.js');
    return handleStatus(args, this.nodeStore, this.graphIndex);
  }

  private async handleContext(args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { handleContext } = await import('./tools/context.js');
    return handleContext(args, this.nodeStore, this.graphIndex, this.searchEngine);
  }
}
