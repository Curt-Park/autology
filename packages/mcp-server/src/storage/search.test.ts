/**
 * Tests for SearchEngine using mocked NodeStore and GraphIndexStore
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchEngine } from './search.js';
import { createKnowledgeNode } from './types.js';
import type { NodeStore } from './node-store.js';
import type { GraphIndexStore } from './graph-index.js';
import type { KnowledgeNode, NodeFilter } from './types.js';

describe('SearchEngine', () => {
  let engine: SearchEngine;
  let mockNodeStore: NodeStore;
  let mockGraphIndex: GraphIndexStore;

  const createMockNodes = (): KnowledgeNode[] => [
    createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'decision',
      title: 'Use PostgreSQL',
      content: 'Decision to use PostgreSQL for database',
      tags: ['database', 'postgresql'],
      confidence: 0.9,
    }),
    createKnowledgeNode({
      id: 'node-2-12345678',
      type: 'component',
      title: 'Auth Service',
      content: 'Service handling authentication',
      tags: ['auth', 'service'],
      confidence: 0.8,
    }),
    createKnowledgeNode({
      id: 'node-3-12345678',
      type: 'pattern',
      title: 'Repository Pattern',
      content: 'Data access pattern',
      tags: ['pattern', 'database'],
      confidence: 0.85,
    }),
  ];

  beforeEach(() => {
    mockNodeStore = {
      listNodes: vi.fn(),
      findNode: vi.fn(),
    } as unknown as NodeStore;

    mockGraphIndex = {
      getRelatedNodes: vi.fn(),
    } as unknown as GraphIndexStore;

    engine = new SearchEngine(mockNodeStore, mockGraphIndex);
  });

  describe('search', () => {
    it('should return all nodes when no filter provided', async () => {
      const nodes = createMockNodes();
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const results = await engine.search();

      expect(results).toHaveLength(3);
      expect(vi.mocked(mockNodeStore.listNodes)).toHaveBeenCalledWith(undefined);
    });

    it('should sort results by relevance score descending', async () => {
      const nodes = createMockNodes();
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const results = await engine.search();

      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
      expect(results[1].score).toBeGreaterThanOrEqual(results[2].score);
    });

    it('should apply pagination with limit', async () => {
      const nodes = createMockNodes();
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const results = await engine.search(undefined, 2);

      expect(results).toHaveLength(2);
    });

    it('should apply pagination with offset', async () => {
      const nodes = createMockNodes();
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const results = await engine.search(undefined, 50, 1);

      expect(results).toHaveLength(2);
      // Offset of 1 means we skip the first result, so we get the 2nd and 3rd
      // Just verify we got 2 results after applying offset
    });

    it('should boost score for tag matches', async () => {
      const nodes = createMockNodes();
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const filter: NodeFilter = {
        tags: ['database'],
      };

      const results = await engine.search(filter);

      // Nodes with 'database' tag should score higher
      const dbNode = results.find((r) => r.node.tags.includes('database'));
      expect(dbNode).toBeDefined();
      expect(dbNode!.score).toBeGreaterThan(0.8);
    });

    it('should pass filter to nodeStore.listNodes', async () => {
      const nodes = createMockNodes();
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const filter: NodeFilter = {
        type: 'decision',
      };

      await engine.search(filter);

      expect(vi.mocked(mockNodeStore.listNodes)).toHaveBeenCalledWith(filter);
    });
  });

  describe('findRelated', () => {
    it('should traverse relations with BFS', async () => {
      const nodes = createMockNodes();

      vi.mocked(mockGraphIndex.getRelatedNodes).mockImplementation((nodeId) => {
        if (nodeId === 'node-1-12345678') return ['node-2-12345678'];
        if (nodeId === 'node-2-12345678') return ['node-3-12345678'];
        return [];
      });

      vi.mocked(mockNodeStore.findNode).mockImplementation(async (id) => {
        return nodes.find((n) => n.id === id) || null;
      });

      const results = await engine.findRelated('node-1-12345678', 2);

      expect(results).toHaveLength(2);
      expect(results.some((r) => r.node.id === 'node-2-12345678')).toBe(true);
      expect(results.some((r) => r.node.id === 'node-3-12345678')).toBe(true);
    });

    it('should apply depth decay to scores', async () => {
      const nodes = createMockNodes();

      vi.mocked(mockGraphIndex.getRelatedNodes).mockImplementation((nodeId) => {
        if (nodeId === 'node-1-12345678') return ['node-2-12345678'];
        if (nodeId === 'node-2-12345678') return ['node-3-12345678'];
        return [];
      });

      vi.mocked(mockNodeStore.findNode).mockImplementation(async (id) => {
        return nodes.find((n) => n.id === id) || null;
      });

      const results = await engine.findRelated('node-1-12345678', 2);

      const depth1 = results.find((r) => r.node.id === 'node-2-12345678')!;
      const depth2 = results.find((r) => r.node.id === 'node-3-12345678')!;

      expect(depth1.score).toBeGreaterThan(depth2.score);
    });

    it('should avoid cycles in graph traversal', async () => {
      const nodes = createMockNodes();

      vi.mocked(mockGraphIndex.getRelatedNodes).mockImplementation((nodeId) => {
        if (nodeId === 'node-1-12345678') return ['node-2-12345678'];
        if (nodeId === 'node-2-12345678') return ['node-1-12345678']; // Cycle
        return [];
      });

      vi.mocked(mockNodeStore.findNode).mockImplementation(async (id) => {
        return nodes.find((n) => n.id === id) || null;
      });

      const results = await engine.findRelated('node-1-12345678', 5);

      expect(results).toHaveLength(1); // Only node-2, not infinite loop
    });
  });

  describe('findByTags', () => {
    it('should find nodes with all tags (mode: all)', async () => {
      const nodes = createMockNodes();
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const results = await engine.findByTags(['database', 'postgresql'], 'all');

      expect(results).toHaveLength(1);
      expect(results[0].node.id).toBe('node-1-12345678');
    });

    it('should find nodes with any tags (mode: any)', async () => {
      const nodes = createMockNodes();
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const results = await engine.findByTags(['database', 'auth'], 'any');

      expect(results.length).toBeGreaterThan(1);
    });

    it('should sort by tag match score', async () => {
      const nodes = createMockNodes();
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const results = await engine.findByTags(['database', 'postgresql'], 'any');

      expect(results[0].score).toBeGreaterThanOrEqual(results[results.length - 1].score);
    });

    it('should return empty array when no tags match', async () => {
      const nodes = createMockNodes();
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const results = await engine.findByTags(['nonexistent'], 'all');

      expect(results).toHaveLength(0);
    });
  });

  describe('fullTextSearch', () => {
    it('should find nodes by title match', async () => {
      const nodes = createMockNodes();
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const results = await engine.fullTextSearch('PostgreSQL');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].node.title).toContain('PostgreSQL');
    });

    it('should find nodes by content match', async () => {
      const nodes = createMockNodes();
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const results = await engine.fullTextSearch('authentication');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].node.content).toContain('authentication');
    });

    it('should calculate term frequency scores', async () => {
      const nodes = [
        createKnowledgeNode({
          id: 'node-1-12345678',
          type: 'decision',
          title: 'Database Database',
          content: 'Database choice database',
          tags: [],
        }),
        createKnowledgeNode({
          id: 'node-2-12345678',
          type: 'decision',
          title: 'Something',
          content: 'Contains database once',
          tags: [],
        }),
      ];
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const results = await engine.fullTextSearch('database');

      expect(results[0].node.id).toBe('node-1-12345678'); // Higher frequency
      expect(results[0].score).toBeGreaterThan(results[1].score);
    });

    it('should respect limit', async () => {
      const nodes = createMockNodes();
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const results = await engine.fullTextSearch('service', 1);

      expect(results).toHaveLength(1);
    });

    it('should handle case-insensitive search', async () => {
      const nodes = createMockNodes();
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const results = await engine.fullTextSearch('POSTGRESQL');

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('findByFileReference', () => {
    it('should find nodes by exact file path', async () => {
      const nodes = [
        createKnowledgeNode({
          id: 'node-1-12345678',
          type: 'decision',
          title: 'Node 1',
          content: 'Content',
          references: ['src/auth/service.ts', 'src/config.ts'],
        }),
        createKnowledgeNode({
          id: 'node-2-12345678',
          type: 'decision',
          title: 'Node 2',
          content: 'Content',
          references: ['src/database/schema.ts'],
        }),
      ];
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const results = await engine.findByFileReference('src/auth/service.ts');

      expect(results).toHaveLength(1);
      expect(results[0].node.id).toBe('node-1-12345678');
    });

    it('should find nodes by partial path match', async () => {
      const nodes = [
        createKnowledgeNode({
          id: 'node-1-12345678',
          type: 'decision',
          title: 'Node 1',
          content: 'Content',
          references: ['src/auth/service.ts'],
        }),
      ];
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const results = await engine.findByFileReference('auth/service');

      expect(results).toHaveLength(1);
    });

    it('should assign score of 1.0 to file matches', async () => {
      const nodes = [
        createKnowledgeNode({
          id: 'node-1-12345678',
          type: 'decision',
          title: 'Node 1',
          content: 'Content',
          references: ['src/test.ts'],
        }),
      ];
      vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

      const results = await engine.findByFileReference('test.ts');

      expect(results[0].score).toBe(1.0);
    });
  });
});
