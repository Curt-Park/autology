import { describe, it, expect } from 'vitest';
import { classify, classifyBatch, reclassify } from './classifier.js';

describe('classify', () => {
  it('should use user hint with high confidence', () => {
    const result = classify({
      title: 'Random Title',
      content: 'Random content',
      userHint: 'decision',
    });

    expect(result.type).toBe('decision');
    expect(result.confidence).toBe(0.95);
    expect(result.reasoning).toBe('User-specified type');
    expect(result.needsReview).toBe(false);
  });

  it('should return confident classification from heuristics', () => {
    const result = classify({
      title: 'Decision to use PostgreSQL',
      content:
        'We decided to choose PostgreSQL instead of MySQL because we selected this option over the alternatives',
    });

    expect(result.type).toBe('decision');
    expect(result.needsReview).toBe(false);
    expect(result.alternatives).toBeUndefined();
  });

  it('should mark low-confidence classification for review', () => {
    const result = classify({
      title: 'Something',
      content: 'Some vague content',
    });

    expect(result.needsReview).toBe(true);
    expect(result.alternatives).toBeDefined();
    // Alternatives might be empty if no keywords match, so just check it's defined
  });

  it('should provide alternatives for low-confidence results', () => {
    const result = classify({
      title: 'Test',
      content: 'Test content',
    });

    if (result.needsReview) {
      expect(result.alternatives).toBeDefined();
      expect(result.alternatives!.length).toBeLessThanOrEqual(3);
      for (const alt of result.alternatives!) {
        expect(alt.type).toBeDefined();
        expect(alt.confidence).toBeGreaterThanOrEqual(0);
        expect(alt.confidence).toBeLessThanOrEqual(1);
      }
    }
  });

  it('should use source context for classification', () => {
    const result = classify({
      title: 'New Handler',
      content: 'Created a new request handler',
      sourceContext: 'hook_write',
    });

    expect(result.type).toBe('component');
  });

  it('should prefer userHint over context', () => {
    const result = classify({
      title: 'Handler',
      content: 'New handler',
      sourceContext: 'hook_write',
      userHint: 'pattern',
    });

    expect(result.type).toBe('pattern');
    expect(result.confidence).toBe(0.95);
  });
});

describe('classifyBatch', () => {
  it('should classify multiple items', () => {
    const items = [
      { title: 'Decision', content: 'We decided to use this' },
      { title: 'Service', content: 'The UserService handles authentication' },
      { title: 'Bug', content: 'This is broken and needs fix' },
    ];

    const results = classifyBatch(items);

    expect(results).toHaveLength(3);
    expect(results[0].type).toBe('decision');
    expect(results[1].type).toBe('component');
    expect(results[2].type).toBe('issue');
  });

  it('should handle empty batch', () => {
    const results = classifyBatch([]);
    expect(results).toHaveLength(0);
  });

  it('should preserve order', () => {
    const items = [
      { title: 'First', content: 'decision content decided' },
      { title: 'Second', content: 'pattern approach' },
      { title: 'Third', content: 'bug issue problem' },
    ];

    const results = classifyBatch(items);

    expect(results).toHaveLength(3);
    expect(results[0].type).toBe('decision');
    expect(results[1].type).toBe('pattern');
    expect(results[2].type).toBe('issue');
  });
});

describe('reclassify', () => {
  it('should return null when new type matches current type', () => {
    const result = reclassify(
      'decision',
      'Decision to use PostgreSQL',
      'We decided to use PostgreSQL',
    );

    expect(result).toBeNull();
  });

  it('should return null when confidence is low', () => {
    const result = reclassify('decision', 'Something', 'Vague content');

    expect(result).toBeNull();
  });

  it('should suggest reclassification when type differs with high confidence', () => {
    const result = reclassify(
      'concept',
      'Decision to Switch and Choose',
      'We decided to switch to PostgreSQL instead of MySQL because we chose this option after selecting from alternatives',
    );

    expect(result).not.toBeNull();
    expect(result!.type).toBe('decision');
    expect(result!.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('should not suggest reclassification with same type even if confident', () => {
    const result = reclassify('decision', 'Decision Choice', 'We decided to select this option');

    expect(result).toBeNull();
  });
});
