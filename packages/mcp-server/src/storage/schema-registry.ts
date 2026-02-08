/**
 * Schema registry for dynamically discovered node types
 * Stores schema.json with auto-discovered type definitions
 */
import { readFile, writeFile, rename, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { NodeType } from './types.js';
import { StorageError } from '../utils/errors.js';

export interface TypeSchema {
  readonly name: NodeType;
  readonly description: string;
  readonly examples: ReadonlyArray<string>;
  readonly commonTags: ReadonlyArray<string>;
}

export interface SchemaRegistry {
  readonly version: string;
  readonly types: Record<NodeType, TypeSchema>;
}

export class SchemaRegistryStore {
  private readonly schemaPath: string;

  constructor(rootPath: string) {
    this.schemaPath = join(rootPath, 'schema.json');
  }

  /**
   * Load or create schema registry
   */
  async load(): Promise<SchemaRegistry> {
    if (!existsSync(this.schemaPath)) {
      const defaultSchema = this.createDefaultSchema();
      await this.save(defaultSchema);
      return defaultSchema;
    }

    try {
      const content = await readFile(this.schemaPath, 'utf-8');
      return JSON.parse(content) as SchemaRegistry;
    } catch (error) {
      if (error instanceof Error) {
        throw new StorageError(`Failed to load schema registry: ${error.message}`, error);
      }
      throw error;
    }
  }

  /**
   * Save schema registry atomically
   */
  async save(schema: SchemaRegistry): Promise<void> {
    const tmpPath = `${this.schemaPath}.tmp`;

    try {
      const content = JSON.stringify(schema, null, 2);
      await writeFile(tmpPath, content, 'utf-8');
      await rename(tmpPath, this.schemaPath);
    } catch (error) {
      // Clean up tmp file
      try {
        if (existsSync(tmpPath)) {
          await unlink(tmpPath);
        }
      } catch {
        // Ignore cleanup errors
      }

      if (error instanceof Error) {
        throw new StorageError(`Failed to save schema registry: ${error.message}`, error);
      }
      throw error;
    }
  }

  /**
   * Create default schema with built-in types
   */
  private createDefaultSchema(): SchemaRegistry {
    return {
      version: '1.0.0',
      types: {
        decision: {
          name: 'decision',
          description: 'Architectural decisions and design choices',
          examples: ['use-jwt-auth', 'choose-database', 'api-design'],
          commonTags: ['architecture', 'design', 'infrastructure'],
        },
        component: {
          name: 'component',
          description: 'Code components, modules, and services',
          examples: ['auth-service', 'user-model', 'api-router'],
          commonTags: ['code', 'service', 'module'],
        },
        convention: {
          name: 'convention',
          description: 'Coding conventions and standards',
          examples: ['error-handling', 'naming-conventions', 'file-structure'],
          commonTags: ['standards', 'style', 'best-practices'],
        },
        concept: {
          name: 'concept',
          description: 'Domain concepts and business logic',
          examples: ['order-lifecycle', 'user-permissions', 'payment-flow'],
          commonTags: ['domain', 'business', 'concept'],
        },
        session: {
          name: 'session',
          description: 'Coding session summaries',
          examples: ['session-2024-01-01', 'feature-x-implementation'],
          commonTags: ['session', 'summary', 'work-log'],
        },
        pattern: {
          name: 'pattern',
          description: 'Design patterns and reusable solutions',
          examples: ['repository-pattern', 'factory-pattern', 'middleware-pattern'],
          commonTags: ['pattern', 'design', 'reusable'],
        },
        issue: {
          name: 'issue',
          description: 'Known issues and technical debt',
          examples: ['performance-bottleneck', 'security-concern', 'refactor-needed'],
          commonTags: ['issue', 'debt', 'problem'],
        },
      },
    };
  }
}
