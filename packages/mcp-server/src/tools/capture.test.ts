/**
 * Tests for autology_capture tool
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleCapture } from './capture.js';
import type { NodeStore } from '../storage/node-store.js';
import type { GraphIndexStore } from '../storage/graph-index.js';
import type { SchemaRegistryStore } from '../storage/schema-registry.js';

// Mock the dynamic classifier import
vi.mock('../classification/classifier.js', () => ({
  classify: vi.fn(() => ({
    type: 'decision',
    confidence: 0.9,
    reasoning: 'Test classification',
    needsReview: false,
  })),
}));

describe('capture tool', () => {
  let mockNodeStore: NodeStore;
  let mockGraphIndex: GraphIndexStore;
  let mockSchemaRegistry: SchemaRegistryStore;

  beforeEach(() => {
    mockNodeStore = {
      createNode: vi.fn(),
    } as unknown as NodeStore;

    mockGraphIndex = {
      addRelation: vi.fn(),
    } as unknown as GraphIndexStore;

    mockSchemaRegistry = {} as SchemaRegistryStore;

    vi.clearAllMocks();
  });

  it('should create node with explicit type', async () => {
    const args = {
      title: 'Test Decision',
      content: 'Test content here',
      type: 'decision',
      tags: ['test', 'example'],
      confidence: 0.9,
      references: ['src/test.ts'],
    };

    const result = await handleCapture(args, mockNodeStore, mockGraphIndex, mockSchemaRegistry);

    expect(vi.mocked(mockNodeStore.createNode)).toHaveBeenCalledTimes(1);

    const createdNode = vi.mocked(mockNodeStore.createNode).mock.calls[0][0];
    expect(createdNode.type).toBe('decision');
    expect(createdNode.title).toBe('Test Decision');
    expect(createdNode.content).toBe('Test content here');
    expect(createdNode.tags).toEqual(['test', 'example']);
    expect(createdNode.confidence).toBe(0.9);
    expect(createdNode.references).toEqual(['src/test.ts']);

    expect(result.content[0].text).toContain('✅ Created decision node');
    expect(result.content[0].text).toContain('Test Decision');
  });

  it('should auto-classify type when not provided', async () => {
    const { classify } = await import('../classification/classifier.js');

    const args = {
      title: 'Test Title',
      content: 'Test content',
    };

    await handleCapture(args, mockNodeStore, mockGraphIndex, mockSchemaRegistry);

    expect(classify).toHaveBeenCalledWith({
      title: 'Test Title',
      content: 'Test content',
      sourceContext: 'manual',
    });

    const createdNode = vi.mocked(mockNodeStore.createNode).mock.calls[0][0];
    expect(createdNode.type).toBe('decision');
  });

  it('should include classification note when auto-classified', async () => {
    const args = {
      title: 'Test Title',
      content: 'Test content',
    };

    const result = await handleCapture(args, mockNodeStore, mockGraphIndex, mockSchemaRegistry);

    expect(result.content[0].text).toContain('Auto-classified');
    expect(result.content[0].text).toContain('confidence: 90%');
  });

  it('should show alternatives for low-confidence classification', async () => {
    const { classify } = await import('../classification/classifier.js');

    vi.mocked(classify).mockReturnValueOnce({
      type: 'concept',
      confidence: 0.5,
      reasoning: 'Low confidence',
      needsReview: true,
      alternatives: [
        { type: 'decision', confidence: 0.45 },
        { type: 'pattern', confidence: 0.4 },
      ],
    });

    const args = {
      title: 'Ambiguous Title',
      content: 'Ambiguous content',
    };

    const result = await handleCapture(args, mockNodeStore, mockGraphIndex, mockSchemaRegistry);

    expect(result.content[0].text).toContain('⚠️  Low confidence');
    expect(result.content[0].text).toContain('decision (45%)');
    expect(result.content[0].text).toContain('pattern (40%)');
  });

  it('should use AUTOLOGY_SESSION_ID env var if set', async () => {
    process.env['AUTOLOGY_SESSION_ID'] = 'test-session-123';

    const args = {
      title: 'Test',
      content: 'Content',
      type: 'decision',
    };

    await handleCapture(args, mockNodeStore, mockGraphIndex, mockSchemaRegistry);

    const createdNode = vi.mocked(mockNodeStore.createNode).mock.calls[0][0];
    expect(createdNode.session).toBe('test-session-123');

    delete process.env['AUTOLOGY_SESSION_ID'];
  });

  it('should generate session ID if env var not set', async () => {
    delete process.env['AUTOLOGY_SESSION_ID'];

    const args = {
      title: 'Test',
      content: 'Content',
      type: 'decision',
    };

    await handleCapture(args, mockNodeStore, mockGraphIndex, mockSchemaRegistry);

    const createdNode = vi.mocked(mockNodeStore.createNode).mock.calls[0][0];
    expect(createdNode.session).toMatch(/^session-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/);
  });

  it('should create relations when relatedTo provided', async () => {
    const args = {
      title: 'Test',
      content: 'Content',
      type: 'decision',
      relatedTo: ['node-1-12345678', 'node-2-12345678'],
      confidence: 0.9,
    };

    await handleCapture(args, mockNodeStore, mockGraphIndex, mockSchemaRegistry);

    expect(vi.mocked(mockGraphIndex.addRelation)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(mockGraphIndex.addRelation)).toHaveBeenCalledWith(
      expect.stringMatching(/^test-[a-f0-9]{8}$/),
      'node-1-12345678',
      'relates_to',
      undefined,
      0.9,
    );
    expect(vi.mocked(mockGraphIndex.addRelation)).toHaveBeenCalledWith(
      expect.stringMatching(/^test-[a-f0-9]{8}$/),
      'node-2-12345678',
      'relates_to',
      undefined,
      0.9,
    );
  });

  it('should use default values for tags, confidence, references', async () => {
    const args = {
      title: 'Test',
      content: 'Content',
      type: 'decision',
    };

    await handleCapture(args, mockNodeStore, mockGraphIndex, mockSchemaRegistry);

    const createdNode = vi.mocked(mockNodeStore.createNode).mock.calls[0][0];
    expect(createdNode.tags).toEqual([]);
    expect(createdNode.confidence).toBe(0.8);
    expect(createdNode.references).toEqual([]);
  });

  it('should reject invalid args (Zod validation)', async () => {
    const invalidArgs = {
      title: '', // Empty title
      content: 'Content',
    };

    await expect(
      handleCapture(invalidArgs, mockNodeStore, mockGraphIndex, mockSchemaRegistry),
    ).rejects.toThrow();
  });

  it('should include file path in output', async () => {
    const args = {
      title: 'Test',
      content: 'Content',
      type: 'component',
    };

    const result = await handleCapture(args, mockNodeStore, mockGraphIndex, mockSchemaRegistry);

    expect(result.content[0].text).toContain('.autology/nodes/components/');
    expect(result.content[0].text).toMatch(/test-[a-f0-9]{8}\.md/);
  });
});
