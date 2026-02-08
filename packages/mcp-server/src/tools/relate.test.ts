/**
 * Tests for autology_relate tool
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleRelate } from './relate.js';
import { createKnowledgeNode } from '../storage/types.js';
import type { NodeStore } from '../storage/node-store.js';
import type { GraphIndexStore } from '../storage/graph-index.js';

describe('relate tool', () => {
  let mockNodeStore: NodeStore;
  let mockGraphIndex: GraphIndexStore;

  const sourceNode = createKnowledgeNode({
    id: 'source-12345678',
    type: 'decision',
    title: 'Source Decision',
    content: 'Source content',
  });

  const targetNode = createKnowledgeNode({
    id: 'target-12345678',
    type: 'component',
    title: 'Target Component',
    content: 'Target content',
  });

  beforeEach(() => {
    mockNodeStore = {
      findNode: vi.fn(),
    } as unknown as NodeStore;

    mockGraphIndex = {
      addRelation: vi.fn(),
    } as unknown as GraphIndexStore;

    vi.mocked(mockNodeStore.findNode).mockImplementation(async (id) => {
      if (id === 'source-12345678') return sourceNode;
      if (id === 'target-12345678') return targetNode;
      return null;
    });
  });

  it('should create unidirectional relation', async () => {
    const args = {
      source: 'source-12345678',
      target: 'target-12345678',
      type: 'affects',
      description: 'Test relation',
      confidence: 0.9,
    };

    const result = await handleRelate(args, mockNodeStore, mockGraphIndex);

    expect(vi.mocked(mockGraphIndex.addRelation)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(mockGraphIndex.addRelation)).toHaveBeenCalledWith(
      'source-12345678',
      'target-12345678',
      'affects',
      'Test relation',
      0.9,
    );

    expect(result.content[0].text).toContain('✅ Created relationship');
    expect(result.content[0].text).toContain('Source Decision');
    expect(result.content[0].text).toContain('Target Component');
    expect(result.content[0].text).toContain('AFFECTS');
  });

  it('should create bidirectional relation', async () => {
    const args = {
      source: 'source-12345678',
      target: 'target-12345678',
      type: 'relates_to',
      bidirectional: true,
      confidence: 0.8,
    };

    await handleRelate(args, mockNodeStore, mockGraphIndex);

    expect(vi.mocked(mockGraphIndex.addRelation)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(mockGraphIndex.addRelation)).toHaveBeenNthCalledWith(
      1,
      'source-12345678',
      'target-12345678',
      'relates_to',
      undefined,
      0.8,
    );
    expect(vi.mocked(mockGraphIndex.addRelation)).toHaveBeenNthCalledWith(
      2,
      'target-12345678',
      'source-12345678',
      'relates_to',
      undefined,
      0.8,
    );
  });

  it('should prefix reverse relation description', async () => {
    const args = {
      source: 'source-12345678',
      target: 'target-12345678',
      type: 'uses',
      description: 'Original description',
      bidirectional: true,
    };

    await handleRelate(args, mockNodeStore, mockGraphIndex);

    expect(vi.mocked(mockGraphIndex.addRelation)).toHaveBeenNthCalledWith(
      2,
      'target-12345678',
      'source-12345678',
      'uses',
      'Reverse: Original description',
      0.8,
    );
  });

  it('should use default confidence of 0.8', async () => {
    const args = {
      source: 'source-12345678',
      target: 'target-12345678',
      type: 'affects',
    };

    await handleRelate(args, mockNodeStore, mockGraphIndex);

    expect(vi.mocked(mockGraphIndex.addRelation)).toHaveBeenCalledWith(
      'source-12345678',
      'target-12345678',
      'affects',
      undefined,
      0.8,
    );
  });

  it('should throw error when source node not found', async () => {
    const args = {
      source: 'nonexistent-12345678',
      target: 'target-12345678',
      type: 'affects',
    };

    await expect(handleRelate(args, mockNodeStore, mockGraphIndex)).rejects.toThrow(
      'Source node not found',
    );
  });

  it('should throw error when target node not found', async () => {
    const args = {
      source: 'source-12345678',
      target: 'nonexistent-12345678',
      type: 'affects',
    };

    await expect(handleRelate(args, mockNodeStore, mockGraphIndex)).rejects.toThrow(
      'Target node not found',
    );
  });

  it('should include description in output', async () => {
    const args = {
      source: 'source-12345678',
      target: 'target-12345678',
      type: 'affects',
      description: 'Custom description here',
    };

    const result = await handleRelate(args, mockNodeStore, mockGraphIndex);

    expect(result.content[0].text).toContain('Description: Custom description here');
  });

  it('should indicate bidirectional in output', async () => {
    const args = {
      source: 'source-12345678',
      target: 'target-12345678',
      type: 'relates_to',
      bidirectional: true,
    };

    const result = await handleRelate(args, mockNodeStore, mockGraphIndex);

    expect(result.content[0].text).toContain('(bidirectional relationship created)');
  });
});
