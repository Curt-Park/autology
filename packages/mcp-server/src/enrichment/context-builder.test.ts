import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  scoreNodesForContext,
  groupByRelevance,
  formatContextResults,
} from './context-builder.js';
import { createKnowledgeNode } from '../storage/types.js';
import type { ContextSignals } from './context-builder.js';

describe('scoreNodesForContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should score higher for current file exact match', () => {
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));

    const node1 = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'decision',
      title: 'Test 1',
      content: 'Content',
      references: ['src/test.ts'],
    });

    const node2 = createKnowledgeNode({
      id: 'node-2-12345678',
      type: 'decision',
      title: 'Test 2',
      content: 'Content',
      references: ['src/other.ts'],
    });

    const signals: ContextSignals = {
      currentFile: 'src/test.ts',
    };

    const scored = scoreNodesForContext([node1, node2], signals);

    expect(scored[0].node.id).toBe('node-1-12345678');
    expect(scored[0].score).toBeGreaterThan(scored[1].score);
    expect(scored[0].reasons).toContain('References current file');
  });

  it('should score for similar files', () => {
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));

    const node = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'decision',
      title: 'Test',
      content: 'Content',
      references: ['src/utils/helper.ts'],
    });

    const signals: ContextSignals = {
      currentFile: 'src/utils/main.ts',
    };

    const scored = scoreNodesForContext([node], signals);

    expect(scored[0].score).toBeGreaterThan(0);
    expect(scored[0].reasons.some((r) => r.includes('similar'))).toBe(true);
  });

  it('should score for recent files match', () => {
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));

    const node = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'decision',
      title: 'Test',
      content: 'Content',
      references: ['src/file1.ts', 'src/file2.ts'],
    });

    const signals: ContextSignals = {
      recentFiles: ['src/file1.ts', 'src/file2.ts', 'src/file3.ts'],
    };

    const scored = scoreNodesForContext([node], signals);

    expect(scored[0].score).toBeGreaterThan(0);
    expect(scored[0].reasons.some((r) => r.includes('recent file'))).toBe(true);
  });

  it('should score for task keyword match', () => {
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));

    const node = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'decision',
      title: 'Authentication System',
      content: 'Implement user authentication with OAuth',
      tags: ['auth', 'oauth'],
    });

    const signals: ContextSignals = {
      currentTask: 'Working on authentication and oauth integration',
    };

    const scored = scoreNodesForContext([node], signals);

    expect(scored[0].score).toBeGreaterThan(0);
    expect(scored[0].reasons.some((r) => r.includes('task keywords'))).toBe(true);
  });

  it('should apply type weighting', () => {
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));

    const decision = createKnowledgeNode({
      id: 'decision-12345678',
      type: 'decision',
      title: 'Decision',
      content: 'Content',
    });

    const session = createKnowledgeNode({
      id: 'session-12345678',
      type: 'session',
      title: 'Session',
      content: 'Content',
    });

    const scored = scoreNodesForContext([decision, session], {});

    const decisionScore = scored.find((s) => s.node.type === 'decision')!.score;
    const sessionScore = scored.find((s) => s.node.type === 'session')!.score;

    expect(decisionScore).toBeGreaterThan(sessionScore);
  });

  it('should boost recently modified nodes', () => {
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));

    const recent = createKnowledgeNode({
      id: 'recent-12345678',
      type: 'decision',
      title: 'Recent',
      content: 'Content',
    });

    vi.setSystemTime(new Date('2024-01-01T10:00:00.000Z'));
    const old = createKnowledgeNode({
      id: 'old-12345678',
      type: 'decision',
      title: 'Old',
      content: 'Content',
    });

    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));

    const scored = scoreNodesForContext([recent, old], {});

    expect(scored[0].node.id).toBe('recent-12345678');
    expect(scored[0].reasons.some((r) => r.includes('Recently modified'))).toBe(true);
  });

  it('should penalize superseded nodes', () => {
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));

    const active = createKnowledgeNode({
      id: 'active-12345678',
      type: 'decision',
      title: 'Active',
      content: 'Content',
      status: 'active',
    });

    const superseded = createKnowledgeNode({
      id: 'superseded-12345678',
      type: 'decision',
      title: 'Superseded',
      content: 'Content',
      status: 'superseded',
    });

    const scored = scoreNodesForContext([active, superseded], {});

    const activeScore = scored.find((s) => s.node.id === 'active-12345678')!.score;
    const supersededScore = scored.find((s) => s.node.id === 'superseded-12345678')!.score;

    expect(activeScore).toBeGreaterThan(supersededScore);
    expect(
      scored.find((s) => s.node.status === 'superseded')!.reasons,
    ).toContain('Superseded (low priority)');
  });

  it('should boost well-connected nodes', () => {
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));

    const connected = createKnowledgeNode({
      id: 'connected-12345678',
      type: 'decision',
      title: 'Connected',
      content: 'Content',
      relations: [
        { type: 'affects', target: 'node-1-12345678', confidence: 0.9 },
        { type: 'uses', target: 'node-2-12345678', confidence: 0.8 },
        { type: 'relates_to', target: 'node-3-12345678', confidence: 0.7 },
        { type: 'implements', target: 'node-4-12345678', confidence: 0.6 },
      ],
    });

    const isolated = createKnowledgeNode({
      id: 'isolated-12345678',
      type: 'decision',
      title: 'Isolated',
      content: 'Content',
    });

    const scored = scoreNodesForContext([connected, isolated], {});

    const connectedScore = scored.find((s) => s.node.id === 'connected-12345678')!.score;
    const isolatedScore = scored.find((s) => s.node.id === 'isolated-12345678')!.score;

    expect(connectedScore).toBeGreaterThan(isolatedScore);
    expect(
      scored.find((s) => s.node.id === 'connected-12345678')!.reasons.some((r) =>
        r.includes('Well-connected'),
      ),
    ).toBe(true);
  });

  it('should filter out nodes with zero score', () => {
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));

    const node = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'session',
      title: 'Test',
      content: 'Content',
      status: 'superseded',
      confidence: 0,
    });

    const scored = scoreNodesForContext([node], {});

    // Even with penalties, base scores should keep it above 0
    expect(scored.length).toBeGreaterThan(0);
  });
});

describe('groupByRelevance', () => {
  it('should group nodes into high/medium/low tiers', () => {
    const nodes = [
      { node: createKnowledgeNode({ id: '1', type: 'decision', title: 'A', content: 'C' }), score: 1.5, reasons: [] },
      { node: createKnowledgeNode({ id: '2', type: 'decision', title: 'B', content: 'C' }), score: 0.8, reasons: [] },
      { node: createKnowledgeNode({ id: '3', type: 'decision', title: 'C', content: 'C' }), score: 0.3, reasons: [] },
    ];

    const grouped = groupByRelevance(nodes);

    expect(grouped.high).toHaveLength(1);
    expect(grouped.high[0].score).toBeGreaterThanOrEqual(1.0);

    expect(grouped.medium).toHaveLength(1);
    expect(grouped.medium[0].score).toBeGreaterThanOrEqual(0.5);
    expect(grouped.medium[0].score).toBeLessThan(1.0);

    expect(grouped.low).toHaveLength(1);
    expect(grouped.low[0].score).toBeLessThan(0.5);
  });

  it('should handle empty input', () => {
    const grouped = groupByRelevance([]);
    expect(grouped.high).toHaveLength(0);
    expect(grouped.medium).toHaveLength(0);
    expect(grouped.low).toHaveLength(0);
  });

  it('should handle all nodes in same tier', () => {
    const nodes = [
      { node: createKnowledgeNode({ id: '1', type: 'decision', title: 'A', content: 'C' }), score: 1.2, reasons: [] },
      { node: createKnowledgeNode({ id: '2', type: 'decision', title: 'B', content: 'C' }), score: 1.5, reasons: [] },
    ];

    const grouped = groupByRelevance(nodes);

    expect(grouped.high).toHaveLength(2);
    expect(grouped.medium).toHaveLength(0);
    expect(grouped.low).toHaveLength(0);
  });
});

describe('formatContextResults', () => {
  it('should format scored nodes with all details', () => {
    const nodes = [
      {
        node: createKnowledgeNode({
          id: 'node-1-12345678',
          type: 'decision',
          title: 'Test Decision',
          content: 'This is the content of the decision node explaining why we chose this approach',
          tags: ['important', 'architecture'],
        }),
        score: 1.2,
        reasons: ['References current file', 'Recently modified'],
      },
    ];

    const formatted = formatContextResults(nodes, 10);

    expect(formatted).toContain('## Test Decision');
    expect(formatted).toContain('**Type**: decision');
    expect(formatted).toContain('**Relevance**: 120%');
    expect(formatted).toContain('**Why**: References current file, Recently modified');
    expect(formatted).toContain('**Tags**: important, architecture');
    expect(formatted).toContain('This is the content');
  });

  it('should respect limit', () => {
    const nodes = [
      {
        node: createKnowledgeNode({ id: '1', type: 'decision', title: 'A', content: 'Content A' }),
        score: 1.0,
        reasons: [],
      },
      {
        node: createKnowledgeNode({ id: '2', type: 'decision', title: 'B', content: 'Content B' }),
        score: 0.8,
        reasons: [],
      },
      {
        node: createKnowledgeNode({ id: '3', type: 'decision', title: 'C', content: 'Content C' }),
        score: 0.6,
        reasons: [],
      },
    ];

    const formatted = formatContextResults(nodes, 2);

    expect(formatted).toContain('## A');
    expect(formatted).toContain('## B');
    expect(formatted).not.toContain('## C');
  });

  it('should truncate long content', () => {
    const longContent = 'a'.repeat(300);
    const nodes = [
      {
        node: createKnowledgeNode({
          id: 'node-1-12345678',
          type: 'decision',
          title: 'Test',
          content: longContent,
        }),
        score: 1.0,
        reasons: [],
      },
    ];

    const formatted = formatContextResults(nodes, 10);

    expect(formatted).toContain('...');
    expect(formatted.length).toBeLessThan(longContent.length + 200);
  });

  it('should handle empty results', () => {
    const formatted = formatContextResults([], 10);
    expect(formatted).toBe('No relevant context found for current task.');
  });
});
