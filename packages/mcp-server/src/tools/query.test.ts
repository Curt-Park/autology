/**
 * Tests for autology_query tool
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleQuery } from './query.js';
import { createKnowledgeNode } from '../storage/types.js';
import type { SearchEngine } from '../storage/search.js';

describe('query tool', () => {
  let mockSearchEngine: SearchEngine;

  beforeEach(() => {
    mockSearchEngine = {
      search: vi.fn(),
    } as unknown as SearchEngine;
  });

  it('should validate and execute search with all parameters', async () => {
    const mockResults = [
      {
        node: createKnowledgeNode({
          id: 'node-1-12345678',
          type: 'decision',
          title: 'Test Decision',
          content: 'Test content',
          tags: ['test', 'example'],
          confidence: 0.9,
          status: 'active',
        }),
        score: 0.95,
      },
    ];

    vi.mocked(mockSearchEngine.search).mockResolvedValue(mockResults);

    const args = {
      query: 'test',
      type: 'decision',
      tags: ['test'],
      status: 'active',
      minConfidence: 0.8,
      relatedTo: 'other-node-12345678',
      limit: 10,
      offset: 0,
    };

    const result = await handleQuery(args, mockSearchEngine);

    expect(vi.mocked(mockSearchEngine.search)).toHaveBeenCalledWith(
      {
        type: 'decision',
        tags: ['test'],
        status: 'active',
        minConfidence: 0.8,
        relatedTo: 'other-node-12345678',
        searchQuery: 'test',
      },
      10,
      0,
    );

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Test Decision');
  });

  it('should use default values for limit and offset', async () => {
    vi.mocked(mockSearchEngine.search).mockResolvedValue([]);

    const args = {};

    await handleQuery(args, mockSearchEngine);

    expect(vi.mocked(mockSearchEngine.search)).toHaveBeenCalledWith(
      expect.objectContaining({}),
      50,
      0,
    );
  });

  it('should format results with all node details', async () => {
    const mockResults = [
      {
        node: createKnowledgeNode({
          id: 'node-1-12345678',
          type: 'decision',
          title: 'Test Decision',
          content: 'This is the full content of the test decision',
          tags: ['architecture', 'database'],
          confidence: 0.9,
          status: 'active',
          relations: [
            { type: 'affects', target: 'node-2-12345678', confidence: 0.8 },
          ],
        }),
        score: 0.95,
      },
    ];

    vi.mocked(mockSearchEngine.search).mockResolvedValue(mockResults);

    const result = await handleQuery({}, mockSearchEngine);

    const text = result.content[0].text;

    expect(text).toContain('## Test Decision');
    expect(text).toContain('**ID**: node-1-12345678');
    expect(text).toContain('**Type**: decision');
    expect(text).toContain('**Tags**: architecture, database');
    expect(text).toContain('**Confidence**: 0.90');
    expect(text).toContain('**Score**: 0.95');
    expect(text).toContain('**Status**: active');
    expect(text).toContain('**Relations**: 1 related node(s)');
    expect(text).toContain('**Preview**:');
  });

  it('should truncate long content in preview', async () => {
    const longContent = 'a'.repeat(300);
    const mockResults = [
      {
        node: createKnowledgeNode({
          id: 'node-1-12345678',
          type: 'decision',
          title: 'Test',
          content: longContent,
        }),
        score: 0.9,
      },
    ];

    vi.mocked(mockSearchEngine.search).mockResolvedValue(mockResults);

    const result = await handleQuery({}, mockSearchEngine);

    const text = result.content[0].text;

    expect(text).toContain('...');
    expect(text).not.toContain(longContent);
  });

  it('should return empty message when no results found', async () => {
    vi.mocked(mockSearchEngine.search).mockResolvedValue([]);

    const result = await handleQuery({}, mockSearchEngine);

    expect(result.content[0].text).toBe('No nodes found matching the query criteria.');
  });

  it('should reject invalid args (Zod validation)', async () => {
    const invalidArgs = {
      minConfidence: 1.5, // Out of range
    };

    await expect(handleQuery(invalidArgs, mockSearchEngine)).rejects.toThrow();
  });

  it('should format date for display', async () => {
    const mockResults = [
      {
        node: createKnowledgeNode({
          id: 'node-1-12345678',
          type: 'decision',
          title: 'Test',
          content: 'Content',
        }),
        score: 0.9,
      },
    ];

    vi.mocked(mockSearchEngine.search).mockResolvedValue(mockResults);

    const result = await handleQuery({}, mockSearchEngine);

    expect(result.content[0].text).toContain('**Modified**:');
  });
});
