/**
 * Node storage with atomic file operations
 * Implements immutable update pattern
 */
import { readFile, writeFile, mkdir, readdir, rename, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import type { KnowledgeNode, NodeType, NodeFilter } from './types.js';
import { parseNode, serializeNode } from './markdown.js';
import { NodeNotFoundError, StorageError } from '../utils/errors.js';

export class NodeStore {
  constructor(private readonly rootPath: string) {}

  /**
   * Initialize storage directory structure
   */
  async initialize(): Promise<void> {
    const dirs = [
      'nodes/decisions',
      'nodes/components',
      'nodes/conventions',
      'nodes/concepts',
      'nodes/sessions',
      'nodes/patterns',
      'nodes/issues'
    ];

    for (const dir of dirs) {
      await mkdir(join(this.rootPath, dir), { recursive: true });
    }
  }

  /**
   * Create a new node
   */
  async createNode(node: KnowledgeNode): Promise<void> {
    const filePath = this.getNodePath(node.id, node.type);
    await this.ensureDir(filePath);

    // Check if file already exists
    if (existsSync(filePath)) {
      throw new StorageError(`Node already exists: ${node.id}`);
    }

    await this.atomicWrite(filePath, serializeNode(node));
  }

  /**
   * Read a node by ID
   * Must specify type for efficiency
   */
  async readNode(id: string, type: NodeType): Promise<KnowledgeNode> {
    const filePath = this.getNodePath(id, type);

    if (!existsSync(filePath)) {
      throw new NodeNotFoundError(id);
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      return parseNode(content);
    } catch (error) {
      if (error instanceof Error) {
        throw new StorageError(`Failed to read node ${id}: ${error.message}`, error);
      }
      throw error;
    }
  }

  /**
   * Find a node by ID across all types
   */
  async findNode(id: string): Promise<KnowledgeNode | null> {
    const types: NodeType[] = ['decision', 'component', 'convention', 'concept', 'session', 'pattern', 'issue'];

    for (const type of types) {
      try {
        return await this.readNode(id, type);
      } catch (error) {
        if (!(error instanceof NodeNotFoundError)) {
          throw error;
        }
        // Continue searching in next type
      }
    }

    return null;
  }

  /**
   * Update a node (creates new version, immutable pattern)
   */
  async updateNode(id: string, type: NodeType, updates: Partial<KnowledgeNode>): Promise<KnowledgeNode> {
    const existing = await this.readNode(id, type);

    const updated: KnowledgeNode = {
      ...existing,
      ...updates,
      id: existing.id, // ID cannot change
      created: existing.created, // Created timestamp cannot change
      modified: new Date().toISOString()
    };

    const filePath = this.getNodePath(id, type);
    await this.atomicWrite(filePath, serializeNode(updated));

    return updated;
  }

  /**
   * Delete a node
   */
  async deleteNode(id: string, type: NodeType): Promise<void> {
    const filePath = this.getNodePath(id, type);

    if (!existsSync(filePath)) {
      throw new NodeNotFoundError(id);
    }

    try {
      await unlink(filePath);
    } catch (error) {
      if (error instanceof Error) {
        throw new StorageError(`Failed to delete node ${id}: ${error.message}`, error);
      }
      throw error;
    }
  }

  /**
   * List all nodes with optional filtering
   */
  async listNodes(filter?: NodeFilter): Promise<KnowledgeNode[]> {
    const nodes: KnowledgeNode[] = [];
    const types: NodeType[] = filter?.type ? [filter.type] : ['decision', 'component', 'convention', 'concept', 'session', 'pattern', 'issue'];

    for (const type of types) {
      const typeDir = join(this.rootPath, 'nodes', `${type}s`);

      if (!existsSync(typeDir)) {
        continue;
      }

      const files = await readdir(typeDir);

      for (const file of files) {
        if (!file.endsWith('.md')) {
          continue;
        }

        const filePath = join(typeDir, file);
        try {
          const content = await readFile(filePath, 'utf-8');
          const node = parseNode(content);

          if (this.matchesFilter(node, filter)) {
            nodes.push(node);
          }
        } catch (error) {
          // Skip invalid nodes
          console.warn(`Failed to parse node: ${filePath}`, error);
        }
      }
    }

    return nodes;
  }

  /**
   * Check if node matches filter criteria
   */
  private matchesFilter(node: KnowledgeNode, filter?: NodeFilter): boolean {
    if (!filter) {
      return true;
    }

    if (filter.type && node.type !== filter.type) {
      return false;
    }

    if (filter.status && node.status !== filter.status) {
      return false;
    }

    if (filter.minConfidence !== undefined && node.confidence < filter.minConfidence) {
      return false;
    }

    if (filter.tags && filter.tags.length > 0) {
      const hasAllTags = filter.tags.every(tag => node.tags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }

    if (filter.relatedTo) {
      const isRelated = node.relations.some(r => r.target === filter.relatedTo);
      if (!isRelated) {
        return false;
      }
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const searchableText = `${node.title} ${node.content} ${node.tags.join(' ')}`.toLowerCase();
      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get file path for a node
   */
  private getNodePath(id: string, type: NodeType): string {
    return join(this.rootPath, 'nodes', `${type}s`, `${id}.md`);
  }

  /**
   * Ensure directory exists
   */
  private async ensureDir(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });
  }

  /**
   * Atomic write using tmp file + rename
   */
  private async atomicWrite(filePath: string, content: string): Promise<void> {
    const tmpPath = `${filePath}.tmp`;

    try {
      await writeFile(tmpPath, content, 'utf-8');
      await rename(tmpPath, filePath);
    } catch (error) {
      // Clean up tmp file if it exists
      try {
        if (existsSync(tmpPath)) {
          await unlink(tmpPath);
        }
      } catch {
        // Ignore cleanup errors
      }

      if (error instanceof Error) {
        throw new StorageError(`Failed to write file: ${error.message}`, error);
      }
      throw error;
    }
  }
}
