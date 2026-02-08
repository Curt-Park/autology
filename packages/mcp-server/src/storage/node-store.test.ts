/**
 * Tests for NodeStore using memfs
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { vol } from 'memfs';
import { NodeStore } from './node-store.js';
import { createKnowledgeNode } from './types.js';
import { NodeNotFoundError, StorageError } from '../utils/errors.js';

// Mock fs module with memfs
vi.mock('fs/promises', async () => {
  const memfs = await import('memfs');
  return memfs.fs.promises;
});

vi.mock('fs', async () => {
  const memfs = await import('memfs');
  return memfs.fs;
});

describe('NodeStore', () => {
  let store: NodeStore;
  const testRoot = '/test-autology';

  beforeEach(async () => {
    vol.reset();
    store = new NodeStore(testRoot);
    await store.initialize();
  });

  afterEach(() => {
    vol.reset();
  });

  describe('initialize', () => {
    it('should create directory structure', () => {
      const dirs = [
        '/test-autology/nodes/decisions',
        '/test-autology/nodes/components',
        '/test-autology/nodes/conventions',
        '/test-autology/nodes/concepts',
        '/test-autology/nodes/sessions',
        '/test-autology/nodes/patterns',
        '/test-autology/nodes/issues',
      ];

      for (const dir of dirs) {
        expect(vol.existsSync(dir)).toBe(true);
      }
    });
  });

  describe('createNode', () => {
    it('should create a new node file', async () => {
      const node = createKnowledgeNode({
        id: 'test-node-12345678',
        type: 'decision',
        title: 'Test Decision',
        content: 'Test content',
      });

      await store.createNode(node);

      const filePath = '/test-autology/nodes/decisions/test-node-12345678.md';
      expect(vol.existsSync(filePath)).toBe(true);
    });

    it('should throw error if node already exists', async () => {
      const node = createKnowledgeNode({
        id: 'duplicate-node-12345678',
        type: 'decision',
        title: 'Duplicate',
        content: 'Content',
      });

      await store.createNode(node);

      await expect(store.createNode(node)).rejects.toThrow(StorageError);
    });
  });

  describe('readNode', () => {
    it('should read an existing node', async () => {
      const original = createKnowledgeNode({
        id: 'read-test-12345678',
        type: 'component',
        title: 'Read Test',
        content: 'Test content',
        tags: ['test'],
      });

      await store.createNode(original);
      const read = await store.readNode('read-test-12345678', 'component');

      expect(read.id).toBe(original.id);
      expect(read.title).toBe(original.title);
      expect(read.content).toBe(original.content);
      expect(read.tags).toEqual(original.tags);
    });

    it('should throw error for non-existent node', async () => {
      await expect(store.readNode('non-existent', 'decision')).rejects.toThrow(NodeNotFoundError);
    });
  });

  describe('findNode', () => {
    it('should find node across all types', async () => {
      const node = createKnowledgeNode({
        id: 'find-test-12345678',
        type: 'convention',
        title: 'Find Test',
        content: 'Content',
      });

      await store.createNode(node);
      const found = await store.findNode('find-test-12345678');

      expect(found).not.toBeNull();
      expect(found?.id).toBe('find-test-12345678');
    });

    it('should return null for non-existent node', async () => {
      const found = await store.findNode('does-not-exist');
      expect(found).toBeNull();
    });
  });

  describe('updateNode', () => {
    it('should update node immutably', async () => {
      const original = createKnowledgeNode({
        id: 'update-test-12345678',
        type: 'decision',
        title: 'Original Title',
        content: 'Original content',
      });

      await store.createNode(original);

      // Wait 10ms to ensure modified timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await store.updateNode('update-test-12345678', 'decision', {
        title: 'Updated Title',
        content: 'Updated content',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.content).toBe('Updated content');
      expect(updated.id).toBe(original.id);
      expect(updated.created).toBe(original.created);
      expect(updated.modified).not.toBe(original.modified);
      expect(new Date(updated.modified).getTime()).toBeGreaterThan(
        new Date(original.modified).getTime(),
      );
    });

    it('should throw error for non-existent node', async () => {
      await expect(
        store.updateNode('non-existent', 'decision', { title: 'New Title' }),
      ).rejects.toThrow(NodeNotFoundError);
    });
  });

  describe('deleteNode', () => {
    it('should delete an existing node', async () => {
      const node = createKnowledgeNode({
        id: 'delete-test-12345678',
        type: 'issue',
        title: 'Delete Test',
        content: 'To be deleted',
      });

      await store.createNode(node);
      await store.deleteNode('delete-test-12345678', 'issue');

      const filePath = '/test-autology/nodes/issues/delete-test-12345678.md';
      expect(vol.existsSync(filePath)).toBe(false);
    });

    it('should throw error for non-existent node', async () => {
      await expect(store.deleteNode('non-existent', 'decision')).rejects.toThrow(NodeNotFoundError);
    });
  });

  describe('listNodes', () => {
    beforeEach(async () => {
      // Create test nodes
      await store.createNode(
        createKnowledgeNode({
          id: 'list-1-12345678',
          type: 'decision',
          title: 'Decision 1',
          content: 'Content 1',
          tags: ['tag1'],
          confidence: 0.9,
        }),
      );

      await store.createNode(
        createKnowledgeNode({
          id: 'list-2-12345678',
          type: 'decision',
          title: 'Decision 2',
          content: 'Content 2',
          tags: ['tag2'],
          confidence: 0.7,
        }),
      );

      await store.createNode(
        createKnowledgeNode({
          id: 'list-3-12345678',
          type: 'component',
          title: 'Component 1',
          content: 'Content 3',
          tags: ['tag1'],
          confidence: 0.8,
        }),
      );
    });

    it('should list all nodes without filter', async () => {
      const nodes = await store.listNodes();
      expect(nodes).toHaveLength(3);
    });

    it('should filter by type', async () => {
      const nodes = await store.listNodes({ type: 'decision' });
      expect(nodes).toHaveLength(2);
      expect(nodes.every((n) => n.type === 'decision')).toBe(true);
    });

    it('should filter by tags', async () => {
      const nodes = await store.listNodes({ tags: ['tag1'] });
      expect(nodes).toHaveLength(2);
      expect(nodes.every((n) => n.tags.includes('tag1'))).toBe(true);
    });

    it('should filter by confidence', async () => {
      const nodes = await store.listNodes({ minConfidence: 0.8 });
      expect(nodes).toHaveLength(2);
      expect(nodes.every((n) => n.confidence >= 0.8)).toBe(true);
    });

    it('should filter by search query', async () => {
      const nodes = await store.listNodes({ searchQuery: 'Component' });
      expect(nodes).toHaveLength(1);
      expect(nodes[0]?.title).toBe('Component 1');
    });
  });
});
