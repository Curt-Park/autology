/**
 * Tests for autology_context tool
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleContext } from './context.js';
import { createKnowledgeNode } from '../storage/types.js';
import type { NodeStore } from '../storage/node-store.js';
import type { GraphIndexStore } from '../storage/graph-index.js';
import type { SearchEngine } from '../storage/search.js';

describe('context tool', () => {
  let mockNodeStore: NodeStore;
  let mockGraphIndex: GraphIndexStore;
  let mockSearchEngine: SearchEngine;

  beforeEach(() => {
    mockNodeStore = {
      listNodes: vi.fn(),
    } as unknown as NodeStore;

    mockGraphIndex = {} as GraphIndexStore;

    mockSearchEngine = {
      findByFileReference: vi.fn(),
      fullTextSearch: vi.fn(),
    } as unknown as SearchEngine;
  });

  it('should find nodes by current file', async () => {
    const fileNode = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'decision',
      title: 'File Node',
      content: 'Content',
      references: ['src/auth/service.ts'],
    });

    vi.mocked(mockSearchEngine.findByFileReference).mockResolvedValue([
      { node: fileNode, score: 1.0 },
    ]);
    vi.mocked(mockNodeStore.listNodes).mockResolvedValue([]);

    const result = await handleContext(
      { currentFile: 'src/auth/service.ts' },
      mockNodeStore,
      mockGraphIndex,
      mockSearchEngine,
    );

    expect(vi.mocked(mockSearchEngine.findByFileReference)).toHaveBeenCalledWith(
      'src/auth/service.ts',
    );
    expect(result.content[0].text).toContain('File Node');
    expect(result.content[0].text).toContain('**Relevance**: 100%');
  });

  it('should find nodes by recent files', async () => {
    const recentNode = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'component',
      title: 'Recent Node',
      content: 'Content',
      references: ['src/utils/helper.ts'],
    });

    vi.mocked(mockSearchEngine.findByFileReference).mockImplementation(async (file) => {
      if (file === 'src/utils/helper.ts') {
        return [{ node: recentNode, score: 1.0 }];
      }
      return [];
    });
    vi.mocked(mockNodeStore.listNodes).mockResolvedValue([]);

    const result = await handleContext(
      { recentFiles: ['src/utils/helper.ts', 'src/config.ts'] },
      mockNodeStore,
      mockGraphIndex,
      mockSearchEngine,
    );

    expect(result.content[0].text).toContain('Recent Node');
    expect(result.content[0].text).toContain('**Relevance**: 70%');
  });

  it('should find nodes by task description', async () => {
    const taskNode = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'decision',
      title: 'Auth Decision',
      content: 'Authentication implementation details',
    });

    vi.mocked(mockSearchEngine.findByFileReference).mockResolvedValue([]);
    vi.mocked(mockSearchEngine.fullTextSearch).mockResolvedValue([{ node: taskNode, score: 0.9 }]);
    vi.mocked(mockNodeStore.listNodes).mockResolvedValue([]);

    const result = await handleContext(
      { currentTask: 'implement authentication' },
      mockNodeStore,
      mockGraphIndex,
      mockSearchEngine,
    );

    expect(vi.mocked(mockSearchEngine.fullTextSearch)).toHaveBeenCalledWith(
      'implement authentication',
      10,
    );
    expect(result.content[0].text).toContain('Auth Decision');
  });

  it('should use fallback to recent nodes when not enough context', async () => {
    const recentNode = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'decision',
      title: 'Recent Decision',
      content: 'Content',
      confidence: 0.9,
      status: 'active',
    });

    vi.mocked(mockSearchEngine.findByFileReference).mockResolvedValue([]);
    vi.mocked(mockSearchEngine.fullTextSearch).mockResolvedValue([]);
    vi.mocked(mockNodeStore.listNodes).mockResolvedValue([recentNode]);

    const result = await handleContext({}, mockNodeStore, mockGraphIndex, mockSearchEngine);

    expect(vi.mocked(mockNodeStore.listNodes)).toHaveBeenCalledWith({
      minConfidence: 0.7,
      status: 'active',
    });
    expect(result.content[0].text).toContain('Recent Decision');
  });

  it('should deduplicate nodes from multiple sources', async () => {
    const node = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'decision',
      title: 'Shared Node',
      content: 'Content',
    });

    vi.mocked(mockSearchEngine.findByFileReference).mockResolvedValue([{ node, score: 1.0 }]);
    vi.mocked(mockSearchEngine.fullTextSearch).mockResolvedValue([{ node, score: 0.8 }]);
    vi.mocked(mockNodeStore.listNodes).mockResolvedValue([]);

    const result = await handleContext(
      {
        currentFile: 'src/test.ts',
        currentTask: 'test task',
      },
      mockNodeStore,
      mockGraphIndex,
      mockSearchEngine,
    );

    // Should only appear once
    const matches = (result.content[0].text.match(/## Shared Node/g) || []).length;
    expect(matches).toBe(1);
  });

  it('should keep highest score when deduplicating', async () => {
    const node = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'decision',
      title: 'Test Node',
      content: 'Content',
    });

    vi.mocked(mockSearchEngine.findByFileReference).mockResolvedValue([{ node, score: 1.0 }]);
    vi.mocked(mockSearchEngine.fullTextSearch).mockResolvedValue([{ node, score: 0.5 }]);
    vi.mocked(mockNodeStore.listNodes).mockResolvedValue([]);

    const result = await handleContext(
      {
        currentFile: 'src/test.ts',
        currentTask: 'test',
      },
      mockNodeStore,
      mockGraphIndex,
      mockSearchEngine,
    );

    // Should keep the higher score from file reference
    expect(result.content[0].text).toContain('**Relevance**: 100%');
  });

  it('should respect maxNodes limit', async () => {
    const nodes = Array.from({ length: 15 }, (_, i) =>
      createKnowledgeNode({
        id: `node-${i}-12345678`,
        type: 'decision',
        title: `Node ${i}`,
        content: 'Content',
        confidence: 0.9,
        status: 'active',
      }),
    );

    vi.mocked(mockSearchEngine.findByFileReference).mockResolvedValue([]);
    vi.mocked(mockSearchEngine.fullTextSearch).mockResolvedValue([]);
    vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);

    const result = await handleContext(
      { maxNodes: 5 },
      mockNodeStore,
      mockGraphIndex,
      mockSearchEngine,
    );

    const nodeCount = (result.content[0].text.match(/^## Node /gm) || []).length;
    expect(nodeCount).toBe(5);
  });

  it('should return empty message when no nodes found', async () => {
    vi.mocked(mockSearchEngine.findByFileReference).mockResolvedValue([]);
    vi.mocked(mockSearchEngine.fullTextSearch).mockResolvedValue([]);
    vi.mocked(mockNodeStore.listNodes).mockResolvedValue([]);

    const result = await handleContext({}, mockNodeStore, mockGraphIndex, mockSearchEngine);

    expect(result.content[0].text).toContain('No relevant knowledge found');
  });

  it('should include context signals in output', async () => {
    const node = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'decision',
      title: 'Test',
      content: 'Content',
    });

    vi.mocked(mockSearchEngine.findByFileReference).mockResolvedValue([{ node, score: 1.0 }]);
    vi.mocked(mockSearchEngine.fullTextSearch).mockResolvedValue([]);
    vi.mocked(mockNodeStore.listNodes).mockResolvedValue([]);

    const result = await handleContext(
      {
        currentFile: 'src/test.ts',
        currentTask: 'implement feature',
      },
      mockNodeStore,
      mockGraphIndex,
      mockSearchEngine,
    );

    expect(result.content[0].text).toContain('**Current File**: src/test.ts');
    expect(result.content[0].text).toContain('**Current Task**: implement feature');
  });

  it('should show node details in output', async () => {
    const node = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'decision',
      title: 'Test Decision',
      content: 'This is the full content of the test decision',
      tags: ['test', 'example'],
      references: ['src/file1.ts', 'src/file2.ts'],
      relations: [{ type: 'affects', target: 'other-12345678', confidence: 0.9 }],
    });

    vi.mocked(mockSearchEngine.findByFileReference).mockResolvedValue([{ node, score: 1.0 }]);
    vi.mocked(mockNodeStore.listNodes).mockResolvedValue([]);

    const result = await handleContext(
      { currentFile: 'test' },
      mockNodeStore,
      mockGraphIndex,
      mockSearchEngine,
    );

    const text = result.content[0].text;

    expect(text).toContain('## Test Decision');
    expect(text).toContain('**Type**: decision');
    expect(text).toContain('**Tags**: test, example');
    expect(text).toContain('**References**: src/file1.ts, src/file2.ts');
    expect(text).toContain('**Related to**: other-12345678');
  });
});
