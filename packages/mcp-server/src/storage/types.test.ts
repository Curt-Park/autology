import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  NODE_TYPES,
  NODE_STATUSES,
  RELATION_TYPES,
  createKnowledgeNode,
  updateKnowledgeNode,
} from './types.js';

describe('Constants', () => {
  it('should have 7 node types', () => {
    expect(NODE_TYPES).toHaveLength(7);
    expect(NODE_TYPES).toContain('decision');
    expect(NODE_TYPES).toContain('component');
    expect(NODE_TYPES).toContain('convention');
    expect(NODE_TYPES).toContain('concept');
    expect(NODE_TYPES).toContain('pattern');
    expect(NODE_TYPES).toContain('issue');
    expect(NODE_TYPES).toContain('session');
  });

  it('should have 3 node statuses', () => {
    expect(NODE_STATUSES).toHaveLength(3);
    expect(NODE_STATUSES).toContain('active');
    expect(NODE_STATUSES).toContain('needs_review');
    expect(NODE_STATUSES).toContain('superseded');
  });

  it('should have 7 relation types', () => {
    expect(RELATION_TYPES).toHaveLength(7);
    expect(RELATION_TYPES).toContain('affects');
    expect(RELATION_TYPES).toContain('uses');
    expect(RELATION_TYPES).toContain('supersedes');
    expect(RELATION_TYPES).toContain('relates_to');
    expect(RELATION_TYPES).toContain('implements');
    expect(RELATION_TYPES).toContain('depends_on');
    expect(RELATION_TYPES).toContain('derived_from');
  });
});

describe('createKnowledgeNode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create node with required fields', () => {
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
    const node = createKnowledgeNode({
      id: 'test-node-12345678',
      type: 'decision',
      title: 'Test Decision',
      content: 'Test content',
    });

    expect(node.id).toBe('test-node-12345678');
    expect(node.type).toBe('decision');
    expect(node.title).toBe('Test Decision');
    expect(node.content).toBe('Test content');
  });

  it('should apply default values', () => {
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
    const node = createKnowledgeNode({
      id: 'test-node-12345678',
      type: 'decision',
      title: 'Test',
      content: 'Content',
    });

    expect(node.tags).toEqual([]);
    expect(node.relations).toEqual([]);
    expect(node.confidence).toBe(0.8);
    expect(node.source).toBe('manual');
    expect(node.references).toEqual([]);
    expect(node.status).toBe('active');
  });

  it('should set timestamps to current time', () => {
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
    const node = createKnowledgeNode({
      id: 'test-node-12345678',
      type: 'decision',
      title: 'Test',
      content: 'Content',
    });

    expect(node.created).toBe('2024-01-15T10:30:00.000Z');
    expect(node.modified).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should allow overriding defaults', () => {
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
    const node = createKnowledgeNode({
      id: 'test-node-12345678',
      type: 'decision',
      title: 'Test',
      content: 'Content',
      tags: ['custom', 'tags'],
      confidence: 0.95,
      source: 'hook_commit',
      status: 'needs_review',
    });

    expect(node.tags).toEqual(['custom', 'tags']);
    expect(node.confidence).toBe(0.95);
    expect(node.source).toBe('hook_commit');
    expect(node.status).toBe('needs_review');
  });
});

describe('updateKnowledgeNode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should preserve id and created timestamp', () => {
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
    const original = createKnowledgeNode({
      id: 'test-node-12345678',
      type: 'decision',
      title: 'Original',
      content: 'Original content',
    });

    vi.setSystemTime(new Date('2024-01-15T11:00:00.000Z'));
    const updated = updateKnowledgeNode(original, {
      title: 'Updated',
    });

    expect(updated.id).toBe(original.id);
    expect(updated.created).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should update modified timestamp', () => {
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
    const original = createKnowledgeNode({
      id: 'test-node-12345678',
      type: 'decision',
      title: 'Original',
      content: 'Original content',
    });

    vi.setSystemTime(new Date('2024-01-15T11:00:00.000Z'));
    const updated = updateKnowledgeNode(original, {
      title: 'Updated',
    });

    expect(updated.modified).toBe('2024-01-15T11:00:00.000Z');
    expect(updated.modified).not.toBe(original.modified);
  });

  it('should update specified fields', () => {
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
    const original = createKnowledgeNode({
      id: 'test-node-12345678',
      type: 'decision',
      title: 'Original',
      content: 'Original content',
    });

    const updated = updateKnowledgeNode(original, {
      title: 'Updated Title',
      content: 'Updated content',
      tags: ['new', 'tags'],
    });

    expect(updated.title).toBe('Updated Title');
    expect(updated.content).toBe('Updated content');
    expect(updated.tags).toEqual(['new', 'tags']);
  });

  it('should return new object (immutability)', () => {
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
    const original = createKnowledgeNode({
      id: 'test-node-12345678',
      type: 'decision',
      title: 'Original',
      content: 'Original content',
    });

    const updated = updateKnowledgeNode(original, {
      title: 'Updated',
    });

    expect(updated).not.toBe(original);
    expect(original.title).toBe('Original');
    expect(updated.title).toBe('Updated');
  });
});
