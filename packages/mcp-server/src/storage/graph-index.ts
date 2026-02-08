/**
 * Graph index for managing relationships between nodes
 * Stored as graph.json with atomic writes
 */
import { readFile, writeFile, rename, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { GraphIndex, RelationType } from './types.js';
import { StorageError } from '../utils/errors.js';
import { GraphIndexSchema } from '../utils/validation.js';

export class GraphIndexStore {
  private index: GraphIndex;
  private readonly indexPath: string;

  constructor(rootPath: string) {
    this.indexPath = join(rootPath, 'graph.json');
    this.index = this.createEmptyIndex();
  }

  /**
   * Load index from disk
   */
  async load(): Promise<void> {
    if (!existsSync(this.indexPath)) {
      // Create empty index
      await this.save();
      return;
    }

    try {
      const content = await readFile(this.indexPath, 'utf-8');
      const data = JSON.parse(content) as unknown;
      this.index = GraphIndexSchema.parse(data);
    } catch (error) {
      if (error instanceof Error) {
        throw new StorageError(`Failed to load graph index: ${error.message}`, error);
      }
      throw error;
    }
  }

  /**
   * Save index to disk atomically
   */
  async save(): Promise<void> {
    const tmpPath = `${this.indexPath}.tmp`;

    try {
      const content = JSON.stringify(this.index, null, 2);
      await writeFile(tmpPath, content, 'utf-8');
      await rename(tmpPath, this.indexPath);
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
        throw new StorageError(`Failed to save graph index: ${error.message}`, error);
      }
      throw error;
    }
  }

  /**
   * Add a relation to the index
   */
  async addRelation(
    source: string,
    target: string,
    type: RelationType,
    description: string | undefined,
    confidence: number = 0.8
  ): Promise<void> {
    // Check if relation already exists
    const exists = this.index.relations.some(
      r => r.source === source && r.target === target && r.type === type
    );

    if (exists) {
      // Update existing relation
      const updatedRelations = this.index.relations.map(r => {
        if (r.source === source && r.target === target && r.type === type) {
          const updated: typeof r = description !== undefined
            ? { source, target, type, description, confidence }
            : { source, target, type, confidence };
          return updated;
        }
        return r;
      });

      this.index = {
        ...this.index,
        relations: updatedRelations as ReadonlyArray<typeof updatedRelations[number]>,
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Add new relation
      const newRelation = description !== undefined
        ? { source, target, type, description, confidence } as const
        : { source, target, type, confidence } as const;

      this.index = {
        ...this.index,
        relations: [...this.index.relations, newRelation] as ReadonlyArray<typeof newRelation>,
        lastUpdated: new Date().toISOString()
      };
    }

    await this.save();
  }

  /**
   * Remove a relation from the index
   */
  async removeRelation(source: string, target: string, type: RelationType): Promise<void> {
    this.index = {
      ...this.index,
      relations: this.index.relations.filter(
        r => !(r.source === source && r.target === target && r.type === type)
      ),
      lastUpdated: new Date().toISOString()
    };

    await this.save();
  }

  /**
   * Remove all relations for a node
   */
  async removeNodeRelations(nodeId: string): Promise<void> {
    this.index = {
      ...this.index,
      relations: this.index.relations.filter(
        r => r.source !== nodeId && r.target !== nodeId
      ),
      lastUpdated: new Date().toISOString()
    };

    await this.save();
  }

  /**
   * Get all relations for a node (both outgoing and incoming)
   */
  getNodeRelations(nodeId: string): Array<{
    readonly source: string;
    readonly target: string;
    readonly type: RelationType;
    readonly description?: string | undefined;
    readonly confidence: number;
    readonly direction: 'outgoing' | 'incoming';
  }> {
    const relations: Array<{
      readonly source: string;
      readonly target: string;
      readonly type: RelationType;
      readonly description?: string | undefined;
      readonly confidence: number;
      readonly direction: 'outgoing' | 'incoming';
    }> = [];

    for (const relation of this.index.relations) {
      if (relation.source === nodeId) {
        relations.push({ ...relation, direction: 'outgoing' as const });
      } else if (relation.target === nodeId) {
        relations.push({ ...relation, direction: 'incoming' as const });
      }
    }

    return relations;
  }

  /**
   * Get all outgoing relations from a node
   */
  getOutgoingRelations(nodeId: string): ReadonlyArray<{
    readonly source: string;
    readonly target: string;
    readonly type: RelationType;
    readonly description?: string | undefined;
    readonly confidence: number;
  }> {
    return this.index.relations.filter(r => r.source === nodeId) as ReadonlyArray<{
      readonly source: string;
      readonly target: string;
      readonly type: RelationType;
      readonly description?: string | undefined;
      readonly confidence: number;
    }>;
  }

  /**
   * Get all incoming relations to a node
   */
  getIncomingRelations(nodeId: string): ReadonlyArray<{
    readonly source: string;
    readonly target: string;
    readonly type: RelationType;
    readonly description?: string | undefined;
    readonly confidence: number;
  }> {
    return this.index.relations.filter(r => r.target === nodeId) as ReadonlyArray<{
      readonly source: string;
      readonly target: string;
      readonly type: RelationType;
      readonly description?: string | undefined;
      readonly confidence: number;
    }>;
  }

  /**
   * Get all related nodes (both directions)
   */
  getRelatedNodes(nodeId: string): string[] {
    const related = new Set<string>();

    for (const relation of this.index.relations) {
      if (relation.source === nodeId) {
        related.add(relation.target);
      } else if (relation.target === nodeId) {
        related.add(relation.source);
      }
    }

    return Array.from(related);
  }

  /**
   * Get statistics about the graph
   */
  getStatistics(): {
    readonly totalRelations: number;
    readonly relationsByType: Record<RelationType, number>;
  } {
    const relationsByType = this.index.relations.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<RelationType, number>);

    return {
      totalRelations: this.index.relations.length,
      relationsByType
    };
  }

  /**
   * Get the current index (readonly)
   */
  getIndex(): GraphIndex {
    return this.index;
  }

  /**
   * Create an empty index
   */
  private createEmptyIndex(): GraphIndex {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      relations: []
    };
  }
}
