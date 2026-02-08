/**
 * Tests for GraphIndexStore using memfs
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { vol } from 'memfs';
import { GraphIndexStore } from './graph-index.js';
import { StorageError } from '../utils/errors.js';

// Mock fs module with memfs
vi.mock('fs/promises', async () => {
  const memfs = await import('memfs');
  return memfs.fs.promises;
});

vi.mock('fs', async () => {
  const memfs = await import('memfs');
  return memfs.fs;
});

describe('GraphIndexStore', () => {
  let store: GraphIndexStore;
  const testRoot = '/test-autology';

  beforeEach(async () => {
    vol.reset();
    vol.mkdirSync(testRoot, { recursive: true });
    store = new GraphIndexStore(testRoot);
    await store.load();
  });

  afterEach(() => {
    vol.reset();
  });

  describe('load', () => {
    it('should create empty index file if not exists', async () => {
      const index = store.getIndex();
      expect(index.version).toBe('1.0.0');
      expect(index.relations).toEqual([]);
      expect(vol.existsSync('/test-autology/graph.json')).toBe(true);
    });

    it('should load existing index from file', async () => {
      const existingData = {
        version: '1.0.0',
        lastUpdated: '2024-01-15T10:00:00.000Z',
        relations: [
          {
            source: 'node-a-12345678',
            target: 'node-b-12345678',
            type: 'affects',
            confidence: 0.9,
          },
        ],
      };

      vol.writeFileSync('/test-autology/graph.json', JSON.stringify(existingData));

      const newStore = new GraphIndexStore(testRoot);
      await newStore.load();

      const index = newStore.getIndex();
      expect(index.relations).toHaveLength(1);
      expect(index.relations[0].source).toBe('node-a-12345678');
    });

    it('should throw StorageError for invalid JSON', async () => {
      vol.writeFileSync('/test-autology/graph.json', 'invalid json');

      const newStore = new GraphIndexStore(testRoot);

      await expect(newStore.load()).rejects.toThrow(StorageError);
    });

    it('should throw StorageError for invalid schema', async () => {
      vol.writeFileSync('/test-autology/graph.json', JSON.stringify({ invalid: 'data' }));

      const newStore = new GraphIndexStore(testRoot);

      await expect(newStore.load()).rejects.toThrow(StorageError);
    });
  });

  describe('addRelation', () => {
    it('should add new relation to index', async () => {
      await store.addRelation('node-a-12345678', 'node-b-12345678', 'affects', 'Test relation', 0.9);

      const index = store.getIndex();
      expect(index.relations).toHaveLength(1);
      expect(index.relations[0].source).toBe('node-a-12345678');
      expect(index.relations[0].target).toBe('node-b-12345678');
      expect(index.relations[0].type).toBe('affects');
      expect(index.relations[0].description).toBe('Test relation');
      expect(index.relations[0].confidence).toBe(0.9);
    });

    it('should add relation without description', async () => {
      await store.addRelation('node-a-12345678', 'node-b-12345678', 'uses', undefined, 0.8);

      const index = store.getIndex();
      expect(index.relations).toHaveLength(1);
      expect(index.relations[0].description).toBeUndefined();
    });

    it('should use default confidence of 0.8', async () => {
      await store.addRelation('node-a-12345678', 'node-b-12345678', 'relates_to', undefined);

      const index = store.getIndex();
      expect(index.relations[0].confidence).toBe(0.8);
    });

    it('should update existing relation', async () => {
      await store.addRelation('node-a-12345678', 'node-b-12345678', 'affects', 'First', 0.7);
      await store.addRelation('node-a-12345678', 'node-b-12345678', 'affects', 'Updated', 0.9);

      const index = store.getIndex();
      expect(index.relations).toHaveLength(1);
      expect(index.relations[0].description).toBe('Updated');
      expect(index.relations[0].confidence).toBe(0.9);
    });

    it('should persist relation to disk', async () => {
      await store.addRelation('node-a-12345678', 'node-b-12345678', 'uses', undefined, 0.8);

      const content = vol.readFileSync('/test-autology/graph.json', 'utf-8') as string;
      const saved = JSON.parse(content);

      expect(saved.relations).toHaveLength(1);
      expect(saved.relations[0].source).toBe('node-a-12345678');
    });
  });

  describe('removeRelation', () => {
    beforeEach(async () => {
      await store.addRelation('node-a-12345678', 'node-b-12345678', 'affects', undefined, 0.9);
      await store.addRelation('node-a-12345678', 'node-c-12345678', 'uses', undefined, 0.8);
    });

    it('should remove specific relation', async () => {
      await store.removeRelation('node-a-12345678', 'node-b-12345678', 'affects');

      const index = store.getIndex();
      expect(index.relations).toHaveLength(1);
      expect(index.relations[0].target).toBe('node-c-12345678');
    });

    it('should only remove exact match', async () => {
      await store.removeRelation('node-a-12345678', 'node-b-12345678', 'uses');

      const index = store.getIndex();
      expect(index.relations).toHaveLength(2); // No change, type didn't match
    });

    it('should persist removal to disk', async () => {
      await store.removeRelation('node-a-12345678', 'node-b-12345678', 'affects');

      const content = vol.readFileSync('/test-autology/graph.json', 'utf-8') as string;
      const saved = JSON.parse(content);

      expect(saved.relations).toHaveLength(1);
    });
  });

  describe('removeNodeRelations', () => {
    beforeEach(async () => {
      await store.addRelation('node-a-12345678', 'node-b-12345678', 'affects', undefined, 0.9);
      await store.addRelation('node-b-12345678', 'node-c-12345678', 'uses', undefined, 0.8);
      await store.addRelation('node-c-12345678', 'node-a-12345678', 'relates_to', undefined, 0.7);
    });

    it('should remove all relations involving node (source)', async () => {
      await store.removeNodeRelations('node-a-12345678');

      const index = store.getIndex();
      expect(index.relations).toHaveLength(1);
      expect(index.relations[0].source).toBe('node-b-12345678');
    });

    it('should remove all relations involving node (target)', async () => {
      await store.removeNodeRelations('node-b-12345678');

      const index = store.getIndex();
      expect(index.relations).toHaveLength(1);
      expect(index.relations[0].source).toBe('node-c-12345678');
    });

    it('should persist removal to disk', async () => {
      await store.removeNodeRelations('node-a-12345678');

      const content = vol.readFileSync('/test-autology/graph.json', 'utf-8') as string;
      const saved = JSON.parse(content);

      expect(saved.relations).toHaveLength(1);
    });
  });

  describe('getNodeRelations', () => {
    beforeEach(async () => {
      await store.addRelation('node-a-12345678', 'node-b-12345678', 'affects', undefined, 0.9);
      await store.addRelation('node-c-12345678', 'node-a-12345678', 'uses', undefined, 0.8);
    });

    it('should return outgoing relations', () => {
      const relations = store.getNodeRelations('node-a-12345678');
      const outgoing = relations.filter((r) => r.direction === 'outgoing');

      expect(outgoing).toHaveLength(1);
      expect(outgoing[0].target).toBe('node-b-12345678');
      expect(outgoing[0].type).toBe('affects');
    });

    it('should return incoming relations', () => {
      const relations = store.getNodeRelations('node-a-12345678');
      const incoming = relations.filter((r) => r.direction === 'incoming');

      expect(incoming).toHaveLength(1);
      expect(incoming[0].source).toBe('node-c-12345678');
      expect(incoming[0].type).toBe('uses');
    });

    it('should return both directions', () => {
      const relations = store.getNodeRelations('node-a-12345678');

      expect(relations).toHaveLength(2);
    });

    it('should return empty array for unconnected node', () => {
      const relations = store.getNodeRelations('node-unconnected-12345678');

      expect(relations).toHaveLength(0);
    });
  });

  describe('getOutgoingRelations', () => {
    beforeEach(async () => {
      await store.addRelation('node-a-12345678', 'node-b-12345678', 'affects', undefined, 0.9);
      await store.addRelation('node-c-12345678', 'node-a-12345678', 'uses', undefined, 0.8);
    });

    it('should return only outgoing relations', () => {
      const outgoing = store.getOutgoingRelations('node-a-12345678');

      expect(outgoing).toHaveLength(1);
      expect(outgoing[0].target).toBe('node-b-12345678');
    });
  });

  describe('getIncomingRelations', () => {
    beforeEach(async () => {
      await store.addRelation('node-a-12345678', 'node-b-12345678', 'affects', undefined, 0.9);
      await store.addRelation('node-c-12345678', 'node-a-12345678', 'uses', undefined, 0.8);
    });

    it('should return only incoming relations', () => {
      const incoming = store.getIncomingRelations('node-a-12345678');

      expect(incoming).toHaveLength(1);
      expect(incoming[0].source).toBe('node-c-12345678');
    });
  });

  describe('getRelatedNodes', () => {
    beforeEach(async () => {
      await store.addRelation('node-a-12345678', 'node-b-12345678', 'affects', undefined, 0.9);
      await store.addRelation('node-c-12345678', 'node-a-12345678', 'uses', undefined, 0.8);
      await store.addRelation('node-a-12345678', 'node-d-12345678', 'relates_to', undefined, 0.7);
    });

    it('should return all related nodes (both directions)', () => {
      const related = store.getRelatedNodes('node-a-12345678');

      expect(related).toHaveLength(3);
      expect(related).toContain('node-b-12345678');
      expect(related).toContain('node-c-12345678');
      expect(related).toContain('node-d-12345678');
    });

    it('should return unique node IDs', async () => {
      await store.addRelation('node-a-12345678', 'node-b-12345678', 'uses', undefined, 0.8);

      const related = store.getRelatedNodes('node-a-12345678');

      expect(related.filter((id) => id === 'node-b-12345678')).toHaveLength(1);
    });

    it('should return empty array for unconnected node', () => {
      const related = store.getRelatedNodes('node-isolated-12345678');

      expect(related).toHaveLength(0);
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      await store.addRelation('node-a-12345678', 'node-b-12345678', 'affects', undefined, 0.9);
      await store.addRelation('node-b-12345678', 'node-c-12345678', 'affects', undefined, 0.8);
      await store.addRelation('node-c-12345678', 'node-d-12345678', 'uses', undefined, 0.7);
    });

    it('should return total relations count', () => {
      const stats = store.getStatistics();

      expect(stats.totalRelations).toBe(3);
    });

    it('should return relations grouped by type', () => {
      const stats = store.getStatistics();

      expect(stats.relationsByType.affects).toBe(2);
      expect(stats.relationsByType.uses).toBe(1);
    });

    it('should handle empty index', async () => {
      await store.removeNodeRelations('node-a-12345678');
      await store.removeNodeRelations('node-b-12345678');
      await store.removeNodeRelations('node-c-12345678');

      const stats = store.getStatistics();

      expect(stats.totalRelations).toBe(0);
      expect(stats.relationsByType).toEqual({});
    });
  });
});
