/**
 * Tests for autology_status tool
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleStatus } from './status.js';
import { createKnowledgeNode } from '../storage/types.js';
import type { NodeStore } from '../storage/node-store.js';
import type { GraphIndexStore } from '../storage/graph-index.js';

describe('status tool', () => {
  let mockNodeStore: NodeStore;
  let mockGraphIndex: GraphIndexStore;

  beforeEach(() => {
    mockNodeStore = {
      listNodes: vi.fn(),
    } as unknown as NodeStore;

    mockGraphIndex = {
      getStatistics: vi.fn(),
    } as unknown as GraphIndexStore;
  });

  it('should return summary statistics', async () => {
    const nodes = [
      createKnowledgeNode({
        id: 'node-1-12345678',
        type: 'decision',
        title: 'Node 1',
        content: 'Content',
        confidence: 0.9,
        status: 'active',
      }),
      createKnowledgeNode({
        id: 'node-2-12345678',
        type: 'component',
        title: 'Node 2',
        content: 'Content',
        confidence: 0.7,
        status: 'active',
      }),
      createKnowledgeNode({
        id: 'node-3-12345678',
        type: 'decision',
        title: 'Node 3',
        content: 'Content',
        confidence: 0.4,
        status: 'needs_review',
      }),
    ];

    vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);
    vi.mocked(mockGraphIndex.getStatistics).mockReturnValue({
      totalRelations: 5,
      relationsByType: {
        affects: 3,
        uses: 2,
        supersedes: 0,
        relates_to: 0,
        implements: 0,
        depends_on: 0,
        derived_from: 0,
      },
    });

    const result = await handleStatus({ detail: 'summary' }, mockNodeStore, mockGraphIndex);

    const text = result.content[0].text;

    expect(text).toContain('**Total Nodes**: 3');
    expect(text).toContain('**Total Relations**: 5');
    expect(text).toContain('## Nodes by Type');
    expect(text).toContain('**decision**: 2');
    expect(text).toContain('**component**: 1');
    expect(text).toContain('## Nodes by Status');
    expect(text).toContain('**active**: 2');
    expect(text).toContain('**needs_review**: 1');
    expect(text).toContain('## Confidence Distribution');
    expect(text).toContain('**High (≥0.8)**: 1');
    expect(text).toContain('**Medium (0.5-0.8)**: 1');
    expect(text).toContain('**Low (<0.5)**: 1');
  });

  it('should include relations by type in full mode', async () => {
    vi.mocked(mockNodeStore.listNodes).mockResolvedValue([]);
    vi.mocked(mockGraphIndex.getStatistics).mockReturnValue({
      totalRelations: 10,
      relationsByType: {
        affects: 5,
        uses: 3,
        supersedes: 2,
        relates_to: 0,
        implements: 0,
        depends_on: 0,
        derived_from: 0,
      },
    });

    const result = await handleStatus({ detail: 'full' }, mockNodeStore, mockGraphIndex);

    const text = result.content[0].text;

    expect(text).toContain('## Relations by Type');
    expect(text).toContain('**affects**: 5');
    expect(text).toContain('**uses**: 3');
    expect(text).toContain('**supersedes**: 2');
  });

  it('should show recent activity in full mode', async () => {
    const nodes = [
      createKnowledgeNode({
        id: 'node-1-12345678',
        type: 'decision',
        title: 'Recent Node',
        content: 'Content',
      }),
    ];

    vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);
    vi.mocked(mockGraphIndex.getStatistics).mockReturnValue({
      totalRelations: 0,
      relationsByType: {
        affects: 0,
        uses: 0,
        supersedes: 0,
        relates_to: 0,
        implements: 0,
        depends_on: 0,
        derived_from: 0,
      },
    });

    const result = await handleStatus({ detail: 'full' }, mockNodeStore, mockGraphIndex);

    const text = result.content[0].text;

    expect(text).toContain('## Recent Activity');
    expect(text).toContain('Recent Node');
  });

  it('should show nodes needing review in full mode', async () => {
    const nodes = [
      createKnowledgeNode({
        id: 'node-1-12345678',
        type: 'decision',
        title: 'Needs Review 1',
        content: 'Content',
        status: 'needs_review',
      }),
      createKnowledgeNode({
        id: 'node-2-12345678',
        type: 'decision',
        title: 'Needs Review 2',
        content: 'Content',
        status: 'needs_review',
      }),
      createKnowledgeNode({
        id: 'node-3-12345678',
        type: 'decision',
        title: 'Active',
        content: 'Content',
        status: 'active',
      }),
    ];

    vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);
    vi.mocked(mockGraphIndex.getStatistics).mockReturnValue({
      totalRelations: 0,
      relationsByType: {
        affects: 0,
        uses: 0,
        supersedes: 0,
        relates_to: 0,
        implements: 0,
        depends_on: 0,
        derived_from: 0,
      },
    });

    const result = await handleStatus({ detail: 'full' }, mockNodeStore, mockGraphIndex);

    const text = result.content[0].text;

    expect(text).toContain('⚠️  Nodes Needing Review: 2');
    expect(text).toContain('Needs Review 1');
    expect(text).toContain('Needs Review 2');
  });

  it('should limit review list to 5 nodes with overflow message', async () => {
    const nodes = Array.from({ length: 7 }, (_, i) =>
      createKnowledgeNode({
        id: `node-${i}-12345678`,
        type: 'decision',
        title: `Review ${i}`,
        content: 'Content',
        status: 'needs_review',
      }),
    );

    vi.mocked(mockNodeStore.listNodes).mockResolvedValue(nodes);
    vi.mocked(mockGraphIndex.getStatistics).mockReturnValue({
      totalRelations: 0,
      relationsByType: {
        affects: 0,
        uses: 0,
        supersedes: 0,
        relates_to: 0,
        implements: 0,
        depends_on: 0,
        derived_from: 0,
      },
    });

    const result = await handleStatus({ detail: 'full' }, mockNodeStore, mockGraphIndex);

    const text = result.content[0].text;

    expect(text).toContain('⚠️  Nodes Needing Review: 7');
    expect(text).toContain('... and 2 more');
  });

  it('should use summary mode by default', async () => {
    vi.mocked(mockNodeStore.listNodes).mockResolvedValue([]);
    vi.mocked(mockGraphIndex.getStatistics).mockReturnValue({
      totalRelations: 0,
      relationsByType: {
        affects: 0,
        uses: 0,
        supersedes: 0,
        relates_to: 0,
        implements: 0,
        depends_on: 0,
        derived_from: 0,
      },
    });

    const result = await handleStatus({}, mockNodeStore, mockGraphIndex);

    const text = result.content[0].text;

    expect(text).not.toContain('## Relations by Type');
    expect(text).not.toContain('## Recent Activity');
  });

  it('should handle empty ontology', async () => {
    vi.mocked(mockNodeStore.listNodes).mockResolvedValue([]);
    vi.mocked(mockGraphIndex.getStatistics).mockReturnValue({
      totalRelations: 0,
      relationsByType: {
        affects: 0,
        uses: 0,
        supersedes: 0,
        relates_to: 0,
        implements: 0,
        depends_on: 0,
        derived_from: 0,
      },
    });

    const result = await handleStatus({}, mockNodeStore, mockGraphIndex);

    const text = result.content[0].text;

    expect(text).toContain('**Total Nodes**: 0');
    expect(text).toContain('**Total Relations**: 0');
  });
});
