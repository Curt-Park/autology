/**
 * Tests for markdown serialization
 */
import { describe, it, expect } from 'vitest';
import { parseNode, serializeNode, extractWikiLinks, createWikiLink } from './markdown.js';
import { createKnowledgeNode } from './types.js';

describe('markdown serialization', () => {
  describe('parseNode', () => {
    it('should parse valid markdown with frontmatter', () => {
      const markdown = `---
id: test-node-12345678
type: decision
title: Test Decision
created: 2024-01-01T00:00:00.000Z
modified: 2024-01-01T00:00:00.000Z
source: manual
tags: [test, decision]
confidence: 0.9
status: active
relations:
  - type: affects
    target: other-node
    confidence: 0.8
---

# Test Decision

This is the content of the test decision.
`;

      const node = parseNode(markdown);

      expect(node.id).toBe('test-node-12345678');
      expect(node.type).toBe('decision');
      expect(node.title).toBe('Test Decision');
      expect(node.content).toBe('# Test Decision\n\nThis is the content of the test decision.');
      expect(node.tags).toEqual(['test', 'decision']);
      expect(node.confidence).toBe(0.9);
      expect(node.status).toBe('active');
      expect(node.relations).toHaveLength(1);
      expect(node.relations[0]?.type).toBe('affects');
      expect(node.relations[0]?.target).toBe('other-node');
    });

    it('should throw error for invalid frontmatter', () => {
      const markdown = `---
id: test
type: invalid_type
---

Content`;

      expect(() => parseNode(markdown)).toThrow();
    });
  });

  describe('serializeNode', () => {
    it('should serialize node to markdown with frontmatter', () => {
      const node = createKnowledgeNode({
        id: 'test-node-12345678',
        type: 'decision',
        title: 'Test Decision',
        content: '# Test Decision\n\nThis is the content.',
        tags: ['test', 'decision'],
        confidence: 0.9,
        relations: [
          {
            type: 'affects',
            target: 'other-node',
            confidence: 0.8,
          },
        ],
      });

      const markdown = serializeNode(node);

      expect(markdown).toContain('id: test-node-12345678');
      expect(markdown).toContain('type: decision');
      expect(markdown).toContain('title: Test Decision');
      expect(markdown).toContain('# Test Decision');
      expect(markdown).toContain('This is the content.');
      expect(markdown).toContain('## Related');
      expect(markdown).toContain('[[other-node]]');
    });

    it('should handle nodes without relations', () => {
      const node = createKnowledgeNode({
        id: 'simple-node-12345678',
        type: 'concept',
        title: 'Simple Concept',
        content: 'Simple content.',
        tags: ['simple'],
      });

      const markdown = serializeNode(node);

      expect(markdown).toContain('id: simple-node-12345678');
      expect(markdown).toContain('Simple content.');
      expect(markdown).not.toContain('## Related');
    });
  });

  describe('round-trip serialization', () => {
    it('should preserve node data through parse and serialize', () => {
      const original = createKnowledgeNode({
        id: 'roundtrip-node-12345678',
        type: 'component',
        title: 'Roundtrip Test',
        content: 'Test content with\nmultiple lines.',
        tags: ['test', 'roundtrip'],
        confidence: 0.95,
        relations: [
          { type: 'uses', target: 'dep-1', confidence: 0.9 },
          { type: 'affects', target: 'dep-2', description: 'Test relation', confidence: 0.8 },
        ],
        references: ['src/test.ts', 'src/test2.ts'],
      });

      const serialized = serializeNode(original);
      const parsed = parseNode(serialized);

      expect(parsed.id).toBe(original.id);
      expect(parsed.type).toBe(original.type);
      expect(parsed.title).toBe(original.title);
      expect(parsed.tags).toEqual(original.tags);
      expect(parsed.confidence).toBe(original.confidence);
      expect(parsed.relations).toHaveLength(original.relations.length);
      expect(parsed.references).toEqual(original.references);
    });
  });

  describe('extractWikiLinks', () => {
    it('should extract wiki-style links from content', () => {
      const content = 'See [[node-1]] and [[node-2|Custom Label]] for more info.';
      const links = extractWikiLinks(content);

      expect(links).toEqual(['node-1', 'node-2|Custom Label']);
    });

    it('should return empty array for no links', () => {
      const content = 'No links here.';
      const links = extractWikiLinks(content);

      expect(links).toEqual([]);
    });
  });

  describe('createWikiLink', () => {
    it('should create simple wiki link', () => {
      expect(createWikiLink('node-id')).toBe('[[node-id]]');
    });

    it('should create wiki link with label', () => {
      expect(createWikiLink('node-id', 'Custom Label')).toBe('[[node-id|Custom Label]]');
    });
  });
});
