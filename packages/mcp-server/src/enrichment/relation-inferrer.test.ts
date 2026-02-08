import { describe, it, expect } from 'vitest';
import { inferRelations, filterByConfidence, groupByAction } from './relation-inferrer.js';
import { createKnowledgeNode } from '../storage/types.js';

describe('inferRelations', () => {
  it('should infer affects relation from decision to component', () => {
    const decision = createKnowledgeNode({
      id: 'decision-12345678',
      type: 'decision',
      title: 'Use PostgreSQL',
      content: 'Decision to use PostgreSQL for database',
      tags: ['database', 'postgresql'],
    });

    const component = createKnowledgeNode({
      id: 'component-12345678',
      type: 'component',
      title: 'Database Service',
      content: 'Service handling database operations',
      tags: ['database', 'service'],
    });

    const relations = inferRelations(decision, [component]);

    expect(relations).toHaveLength(1);
    expect(relations[0].type).toBe('affects');
    expect(relations[0].source).toBe(decision.id);
    expect(relations[0].target).toBe(component.id);
  });

  it('should infer implements relation from component to pattern', () => {
    const component = createKnowledgeNode({
      id: 'component-12345678',
      type: 'component',
      title: 'User Repository',
      content: 'Repository for user data access using Repository Pattern',
      tags: ['repository', 'data'],
    });

    const pattern = createKnowledgeNode({
      id: 'pattern-12345678',
      type: 'pattern',
      title: 'Repository Pattern',
      content: 'Pattern for abstracting data access',
      tags: ['repository', 'pattern'],
    });

    const relations = inferRelations(component, [pattern]);

    expect(relations).toHaveLength(1);
    expect(relations[0].type).toBe('implements');
  });

  it('should infer uses relation between components with shared files', () => {
    const component1 = createKnowledgeNode({
      id: 'component-1-12345678',
      type: 'component',
      title: 'Service A',
      content: 'Service A',
      references: ['src/utils/helper.ts', 'src/config.ts'],
    });

    const component2 = createKnowledgeNode({
      id: 'component-2-12345678',
      type: 'component',
      title: 'Service B',
      content: 'Service B',
      references: ['src/utils/helper.ts'],
    });

    const relations = inferRelations(component1, [component2]);

    expect(relations).toHaveLength(1);
    expect(relations[0].type).toBe('uses');
    expect(relations[0].reasoning).toContain('Shared file references');
  });

  it('should infer supersedes relation between decisions', () => {
    const newDecision = createKnowledgeNode({
      id: 'decision-new-12345678',
      type: 'decision',
      title: 'Use PostgreSQL',
      content: 'This decision supersedes Use MySQL decision',
    });

    const oldDecision = createKnowledgeNode({
      id: 'decision-old-12345678',
      type: 'decision',
      title: 'Use MySQL',
      content: 'Old decision to use MySQL',
    });

    const relations = inferRelations(newDecision, [oldDecision]);

    expect(relations).toHaveLength(1);
    expect(relations[0].type).toBe('supersedes');
  });

  it('should infer relates_to for convention to component', () => {
    const convention = createKnowledgeNode({
      id: 'convention-12345678',
      type: 'convention',
      title: 'Naming Convention',
      content: 'All services must use PascalCase',
      tags: ['naming', 'service'],
    });

    const component = createKnowledgeNode({
      id: 'component-12345678',
      type: 'component',
      title: 'User Service',
      content: 'Service for user management',
      tags: ['service', 'user'],
    });

    const relations = inferRelations(convention, [component]);

    expect(relations).toHaveLength(1);
    expect(relations[0].type).toBe('relates_to');
  });

  it('should infer relates_to for same session with shared tags', () => {
    const node1 = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'component',
      title: 'Node 1',
      content: 'Content 1',
      session: 'session-2024-01-15T10-00-00-000Z',
      tags: ['auth', 'oauth'],
    });

    const node2 = createKnowledgeNode({
      id: 'node-2-12345678',
      type: 'decision',
      title: 'Node 2',
      content: 'Content 2',
      session: 'session-2024-01-15T10-00-00-000Z',
      tags: ['auth', 'security'],
    });

    const relations = inferRelations(node1, [node2]);

    expect(relations).toHaveLength(1);
    expect(relations[0].type).toBe('relates_to');
    expect(relations[0].reasoning).toContain('same session');
  });

  it('should infer relates_to for high tag overlap', () => {
    const node1 = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'concept',
      title: 'Node 1',
      content: 'Content 1',
      tags: ['auth', 'oauth', 'security', 'jwt'],
    });

    const node2 = createKnowledgeNode({
      id: 'node-2-12345678',
      type: 'concept',
      title: 'Node 2',
      content: 'Content 2',
      tags: ['auth', 'oauth', 'security'],
    });

    const relations = inferRelations(node1, [node2]);

    expect(relations).toHaveLength(1);
    expect(relations[0].type).toBe('relates_to');
    expect(relations[0].reasoning).toContain('tag overlap');
  });

  it('should skip self-references', () => {
    const node = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'decision',
      title: 'Node',
      content: 'Content',
    });

    const relations = inferRelations(node, [node]);

    expect(relations).toHaveLength(0);
  });

  it('should sort relations by confidence descending', () => {
    const node = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'decision',
      title: 'Decision',
      content: 'Content',
      tags: ['test'],
    });

    const highConfidence = createKnowledgeNode({
      id: 'high-12345678',
      type: 'component',
      title: 'High',
      content: 'Content',
      tags: ['test'],
      references: ['src/test.ts'],
    });

    const lowConfidence = createKnowledgeNode({
      id: 'low-12345678',
      type: 'concept',
      title: 'Low',
      content: 'Content',
      tags: ['test'],
    });

    const relations = inferRelations(node, [lowConfidence, highConfidence]);

    expect(relations[0].confidence).toBeGreaterThan(relations[relations.length - 1].confidence);
  });

  it('should return empty array when no relations found', () => {
    const node1 = createKnowledgeNode({
      id: 'node-1-12345678',
      type: 'concept',
      title: 'Node 1',
      content: 'Content 1',
      tags: ['tag1'],
    });

    const node2 = createKnowledgeNode({
      id: 'node-2-12345678',
      type: 'concept',
      title: 'Node 2',
      content: 'Content 2',
      tags: ['tag2'],
    });

    const relations = inferRelations(node1, [node2]);

    expect(relations).toHaveLength(0);
  });
});

describe('filterByConfidence', () => {
  it('should filter relations by minimum confidence', () => {
    const relations = [
      {
        source: 'a',
        target: 'b',
        type: 'affects' as const,
        confidence: 0.9,
        reasoning: 'high',
      },
      {
        source: 'c',
        target: 'd',
        type: 'uses' as const,
        confidence: 0.6,
        reasoning: 'medium',
      },
      {
        source: 'e',
        target: 'f',
        type: 'relates_to' as const,
        confidence: 0.4,
        reasoning: 'low',
      },
    ];

    const filtered = filterByConfidence(relations, 0.7);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].confidence).toBe(0.9);
  });

  it('should return empty array when all below threshold', () => {
    const relations = [
      {
        source: 'a',
        target: 'b',
        type: 'affects' as const,
        confidence: 0.5,
        reasoning: 'low',
      },
    ];

    const filtered = filterByConfidence(relations, 0.7);

    expect(filtered).toHaveLength(0);
  });

  it('should include relations at exact threshold', () => {
    const relations = [
      {
        source: 'a',
        target: 'b',
        type: 'affects' as const,
        confidence: 0.7,
        reasoning: 'exact',
      },
    ];

    const filtered = filterByConfidence(relations, 0.7);

    expect(filtered).toHaveLength(1);
  });
});

describe('groupByAction', () => {
  it('should split relations by auto-create threshold', () => {
    const relations = [
      {
        source: 'a',
        target: 'b',
        type: 'affects' as const,
        confidence: 0.9,
        reasoning: 'high',
      },
      {
        source: 'c',
        target: 'd',
        type: 'uses' as const,
        confidence: 0.6,
        reasoning: 'low',
      },
    ];

    const grouped = groupByAction(relations, 0.7);

    expect(grouped.autoCreate).toHaveLength(1);
    expect(grouped.autoCreate[0].confidence).toBe(0.9);
    expect(grouped.suggest).toHaveLength(1);
    expect(grouped.suggest[0].confidence).toBe(0.6);
  });

  it('should use default threshold of 0.7', () => {
    const relations = [
      {
        source: 'a',
        target: 'b',
        type: 'affects' as const,
        confidence: 0.75,
        reasoning: 'above default',
      },
      {
        source: 'c',
        target: 'd',
        type: 'uses' as const,
        confidence: 0.65,
        reasoning: 'below default',
      },
    ];

    const grouped = groupByAction(relations);

    expect(grouped.autoCreate).toHaveLength(1);
    expect(grouped.suggest).toHaveLength(1);
  });

  it('should handle empty relations', () => {
    const grouped = groupByAction([]);

    expect(grouped.autoCreate).toHaveLength(0);
    expect(grouped.suggest).toHaveLength(0);
  });
});
