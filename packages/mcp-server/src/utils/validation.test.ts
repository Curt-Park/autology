import { describe, it, expect } from 'vitest';
import {
  NodeTypeSchema,
  NodeStatusSchema,
  RelationTypeSchema,
  RelationSchema,
  KnowledgeNodeSchema,
  NodeFilterSchema,
  GraphIndexSchema,
} from './validation.js';

describe('NodeTypeSchema', () => {
  it('should accept valid node types', () => {
    expect(NodeTypeSchema.parse('decision')).toBe('decision');
    expect(NodeTypeSchema.parse('component')).toBe('component');
    expect(NodeTypeSchema.parse('convention')).toBe('convention');
    expect(NodeTypeSchema.parse('concept')).toBe('concept');
    expect(NodeTypeSchema.parse('pattern')).toBe('pattern');
    expect(NodeTypeSchema.parse('issue')).toBe('issue');
    expect(NodeTypeSchema.parse('session')).toBe('session');
  });

  it('should reject invalid node type', () => {
    expect(() => NodeTypeSchema.parse('invalid')).toThrow();
  });
});

describe('NodeStatusSchema', () => {
  it('should accept valid statuses', () => {
    expect(NodeStatusSchema.parse('active')).toBe('active');
    expect(NodeStatusSchema.parse('needs_review')).toBe('needs_review');
    expect(NodeStatusSchema.parse('superseded')).toBe('superseded');
  });

  it('should reject invalid status', () => {
    expect(() => NodeStatusSchema.parse('invalid')).toThrow();
  });
});

describe('RelationTypeSchema', () => {
  it('should accept valid relation types', () => {
    expect(RelationTypeSchema.parse('affects')).toBe('affects');
    expect(RelationTypeSchema.parse('uses')).toBe('uses');
    expect(RelationTypeSchema.parse('supersedes')).toBe('supersedes');
    expect(RelationTypeSchema.parse('relates_to')).toBe('relates_to');
    expect(RelationTypeSchema.parse('implements')).toBe('implements');
    expect(RelationTypeSchema.parse('depends_on')).toBe('depends_on');
    expect(RelationTypeSchema.parse('derived_from')).toBe('derived_from');
  });

  it('should reject invalid relation type', () => {
    expect(() => RelationTypeSchema.parse('invalid')).toThrow();
  });
});

describe('RelationSchema', () => {
  it('should accept valid relation', () => {
    const relation = {
      type: 'affects',
      target: 'target-id-12345678',
      description: 'Test relation',
      confidence: 0.9,
    };
    expect(RelationSchema.parse(relation)).toEqual(relation);
  });

  it('should accept relation without description', () => {
    const relation = {
      type: 'uses',
      target: 'target-id-12345678',
      confidence: 0.8,
    };
    const parsed = RelationSchema.parse(relation);
    expect(parsed.description).toBeUndefined();
  });

  it('should reject relation with empty target', () => {
    expect(() =>
      RelationSchema.parse({
        type: 'affects',
        target: '',
        confidence: 0.9,
      }),
    ).toThrow();
  });

  it('should reject relation with confidence out of range', () => {
    expect(() =>
      RelationSchema.parse({
        type: 'affects',
        target: 'target-id',
        confidence: 1.5,
      }),
    ).toThrow();
  });
});

describe('KnowledgeNodeSchema', () => {
  const validNode = {
    id: 'test-node-12345678',
    type: 'decision',
    title: 'Test Decision',
    content: 'Test content',
    created: '2024-01-15T10:30:00.000Z',
    modified: '2024-01-15T10:30:00.000Z',
  };

  it('should accept valid node with all fields', () => {
    const fullNode = {
      ...validNode,
      tags: ['test', 'example'],
      relations: [
        {
          type: 'affects',
          target: 'other-node-12345678',
          confidence: 0.9,
        },
      ],
      confidence: 0.95,
      session: 'session-2024-01-15T10-30-00-000Z',
      source: 'manual',
      references: ['src/test.ts'],
      status: 'active',
    };
    expect(KnowledgeNodeSchema.parse(fullNode)).toEqual(fullNode);
  });

  it('should apply default values', () => {
    const parsed = KnowledgeNodeSchema.parse(validNode);
    expect(parsed.tags).toEqual([]);
    expect(parsed.relations).toEqual([]);
    expect(parsed.confidence).toBe(0.8);
    expect(parsed.source).toBe('manual');
    expect(parsed.references).toEqual([]);
    expect(parsed.status).toBe('active');
  });

  it('should reject node with empty title', () => {
    expect(() =>
      KnowledgeNodeSchema.parse({
        ...validNode,
        title: '',
      }),
    ).toThrow();
  });

  it('should reject node with title too long', () => {
    expect(() =>
      KnowledgeNodeSchema.parse({
        ...validNode,
        title: 'a'.repeat(201),
      }),
    ).toThrow();
  });

  it('should reject node with empty content', () => {
    expect(() =>
      KnowledgeNodeSchema.parse({
        ...validNode,
        content: '',
      }),
    ).toThrow();
  });

  it('should reject node with invalid source', () => {
    expect(() =>
      KnowledgeNodeSchema.parse({
        ...validNode,
        source: 'invalid',
      }),
    ).toThrow();
  });
});

describe('NodeFilterSchema', () => {
  it('should accept empty filter', () => {
    const parsed = NodeFilterSchema.parse({});
    expect(parsed).toEqual({});
  });

  it('should accept filter with all fields', () => {
    const filter = {
      type: 'decision',
      tags: ['test'],
      status: 'active',
      minConfidence: 0.8,
      relatedTo: 'node-id-12345678',
      searchQuery: 'test query',
    };
    expect(NodeFilterSchema.parse(filter)).toEqual(filter);
  });

  it('should accept partial filter', () => {
    const filter = {
      type: 'concept',
      tags: ['example'],
    };
    expect(NodeFilterSchema.parse(filter)).toEqual(filter);
  });

  it('should reject invalid type', () => {
    expect(() =>
      NodeFilterSchema.parse({
        type: 'invalid',
      }),
    ).toThrow();
  });

  it('should reject minConfidence out of range', () => {
    expect(() =>
      NodeFilterSchema.parse({
        minConfidence: 1.5,
      }),
    ).toThrow();
  });
});

describe('GraphIndexSchema', () => {
  it('should accept valid graph index', () => {
    const index = {
      version: '1.0.0',
      lastUpdated: '2024-01-15T10:30:00.000Z',
      relations: [
        {
          source: 'node-a-12345678',
          target: 'node-b-12345678',
          type: 'affects',
          confidence: 0.9,
        },
      ],
    };
    expect(GraphIndexSchema.parse(index)).toEqual(index);
  });

  it('should accept empty relations array', () => {
    const index = {
      version: '1.0.0',
      lastUpdated: '2024-01-15T10:30:00.000Z',
      relations: [],
    };
    expect(GraphIndexSchema.parse(index)).toEqual(index);
  });

  it('should reject missing version', () => {
    expect(() =>
      GraphIndexSchema.parse({
        lastUpdated: '2024-01-15T10:30:00.000Z',
        relations: [],
      }),
    ).toThrow();
  });
});
