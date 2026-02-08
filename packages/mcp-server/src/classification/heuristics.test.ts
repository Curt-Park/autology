import { describe, it, expect } from 'vitest';
import { classifyNodeType, isConfidentClassification, suggestAlternatives } from './heuristics.js';

describe('classifyNodeType', () => {
  it('should classify decision node', () => {
    const result = classifyNodeType(
      'Decision to use PostgreSQL',
      'We decided to use PostgreSQL instead of MySQL because of better JSON support',
    );
    expect(result.type).toBe('decision');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.reasoning).toContain('decision');
  });

  it('should classify component node', () => {
    const result = classifyNodeType(
      'User Service',
      'The UserService class handles user authentication and provides methods for user management',
    );
    expect(result.type).toBe('component');
  });

  it('should classify convention node', () => {
    const result = classifyNodeType(
      'Naming Convention',
      'All components must use PascalCase naming and should follow the standard pattern',
    );
    expect(result.type).toBe('convention');
  });

  it('should classify concept node', () => {
    const result = classifyNodeType(
      'User Lifecycle',
      'The user lifecycle represents the workflow from registration to account deletion',
    );
    expect(result.type).toBe('concept');
  });

  it('should classify pattern node', () => {
    const result = classifyNodeType(
      'Repository Pattern',
      'The repository pattern is a reusable approach for data access abstraction',
    );
    expect(result.type).toBe('pattern');
  });

  it('should classify issue node', () => {
    const result = classifyNodeType(
      'Performance Issue',
      'The database query is broken and causing slow performance. This is technical debt that needs fix',
    );
    expect(result.type).toBe('issue');
  });

  it('should classify session node', () => {
    const result = classifyNodeType(
      'Development Session',
      'Today I worked on the authentication system. This session accomplished implementing OAuth',
    );
    expect(result.type).toBe('session');
  });

  it('should apply context boost for hook_write', () => {
    const result = classifyNodeType(
      'New Component',
      'A new module for handling requests',
      'hook_write',
    );
    expect(result.type).toBe('component');
  });

  it('should apply context boost for hook_commit', () => {
    const result = classifyNodeType(
      'Choose better approach',
      'Selected new library over old one',
      'hook_commit',
    );
    expect(result.type).toBe('decision');
  });

  it('should apply context boost for hook_session', () => {
    const result = classifyNodeType(
      'Summary of work',
      'Completed the feature implementation',
      'hook_session',
    );
    expect(result.type).toBe('session');
  });

  it('should default to concept for ambiguous content', () => {
    const result = classifyNodeType('Random Title', 'Some random content here');
    expect(result.type).toBe('concept');
  });

  it('should cap confidence at 0.95', () => {
    const result = classifyNodeType(
      'Decision to choose selected option',
      'Decided to choose this selection because of the decision to select this choice instead of alternatives',
    );
    expect(result.confidence).toBeLessThanOrEqual(0.95);
  });

  it('should be case insensitive', () => {
    const result1 = classifyNodeType('DECISION', 'WE DECIDED TO USE THIS');
    const result2 = classifyNodeType('decision', 'we decided to use this');
    expect(result1.type).toBe(result2.type);
  });
});

describe('isConfidentClassification', () => {
  it('should return true for confidence >= 0.6', () => {
    const result = {
      type: 'decision' as const,
      confidence: 0.6,
      reasoning: 'test',
    };
    expect(isConfidentClassification(result)).toBe(true);
  });

  it('should return true for high confidence', () => {
    const result = {
      type: 'decision' as const,
      confidence: 0.9,
      reasoning: 'test',
    };
    expect(isConfidentClassification(result)).toBe(true);
  });

  it('should return false for confidence < 0.6', () => {
    const result = {
      type: 'concept' as const,
      confidence: 0.59,
      reasoning: 'test',
    };
    expect(isConfidentClassification(result)).toBe(false);
  });
});

describe('suggestAlternatives', () => {
  it('should return top 3 alternatives sorted by score', () => {
    const alternatives = suggestAlternatives(
      'Decision Pattern',
      'We decided to use this pattern approach',
    );
    expect(alternatives).toHaveLength(3);
    expect(alternatives[0].confidence).toBeGreaterThanOrEqual(alternatives[1].confidence);
    expect(alternatives[1].confidence).toBeGreaterThanOrEqual(alternatives[2].confidence);
  });

  it('should include decision as top alternative for decision keywords', () => {
    const alternatives = suggestAlternatives('Choose approach', 'Decided to select this option');
    expect(alternatives[0].type).toBe('decision');
  });

  it('should return fewer than 3 if not enough matches', () => {
    const alternatives = suggestAlternatives('Random', 'Something');
    expect(alternatives.length).toBeLessThanOrEqual(3);
  });

  it('should cap confidence at 0.95', () => {
    const alternatives = suggestAlternatives(
      'Decision to choose selected option',
      'Decided to choose this selection because of the decision to select this choice',
    );
    for (const alt of alternatives) {
      expect(alt.confidence).toBeLessThanOrEqual(0.95);
    }
  });

  it('should include reasoning with score', () => {
    const alternatives = suggestAlternatives('Decision', 'We decided');
    expect(alternatives[0].reasoning).toContain('Score:');
  });
});
