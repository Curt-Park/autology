import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateNodeId, generateSessionId, isValidNodeId, isValidSessionId } from './id.js';

describe('generateNodeId', () => {
  it('should generate deterministic ID from title and type', () => {
    const id1 = generateNodeId('Test Title', 'decision');
    const id2 = generateNodeId('Test Title', 'decision');
    expect(id1).toBe(id2);
  });

  it('should include slugified title', () => {
    const id = generateNodeId('My Test Title', 'concept');
    expect(id).toContain('my-test-title');
  });

  it('should append 8-character hash', () => {
    const id = generateNodeId('Test', 'decision');
    expect(id).toMatch(/-[a-f0-9]{8}$/);
  });

  it('should truncate long titles to 50 chars', () => {
    const longTitle = 'a'.repeat(100);
    const id = generateNodeId(longTitle, 'concept');
    const slugPart = id.substring(0, id.lastIndexOf('-'));
    expect(slugPart.length).toBeLessThanOrEqual(50);
  });

  it('should handle special characters', () => {
    const id = generateNodeId('Test: With @Special #Chars!', 'decision');
    expect(id).toMatch(/^[a-z0-9-]+-[a-f0-9]{8}$/);
  });

  it('should produce different IDs for different types with same title', () => {
    const id1 = generateNodeId('Same Title', 'decision');
    const id2 = generateNodeId('Same Title', 'concept');
    expect(id1).not.toBe(id2);
  });

  it('should produce different IDs for different titles with same type', () => {
    const id1 = generateNodeId('Title One', 'decision');
    const id2 = generateNodeId('Title Two', 'decision');
    expect(id1).not.toBe(id2);
  });
});

describe('generateSessionId', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate session ID with timestamp', () => {
    vi.setSystemTime(new Date('2024-01-15T10:30:45.123Z'));
    const id = generateSessionId();
    expect(id).toBe('session-2024-01-15T10-30-45-123Z');
  });

  it('should match expected format', () => {
    vi.setSystemTime(new Date('2024-03-20T15:45:30.999Z'));
    const id = generateSessionId();
    expect(id).toMatch(/^session-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/);
  });

  it('should generate different IDs at different times', () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    const id1 = generateSessionId();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.001Z'));
    const id2 = generateSessionId();
    expect(id1).not.toBe(id2);
  });
});

describe('isValidNodeId', () => {
  it('should accept valid node ID', () => {
    expect(isValidNodeId('test-title-abcd1234')).toBe(true);
  });

  it('should accept ID with multiple hyphens in slug', () => {
    expect(isValidNodeId('my-test-node-title-12345678')).toBe(true);
  });

  it('should reject ID without hash', () => {
    expect(isValidNodeId('test-title')).toBe(false);
  });

  it('should reject ID with short hash', () => {
    expect(isValidNodeId('test-title-abc123')).toBe(false);
  });

  it('should reject ID with uppercase letters', () => {
    expect(isValidNodeId('Test-Title-abcd1234')).toBe(false);
  });

  it('should reject ID with invalid characters', () => {
    expect(isValidNodeId('test_title-abcd1234')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidNodeId('')).toBe(false);
  });
});

describe('isValidSessionId', () => {
  it('should accept valid session ID', () => {
    expect(isValidSessionId('session-2024-01-15T10-30-45-123Z')).toBe(true);
  });

  it('should reject ID without session prefix', () => {
    expect(isValidSessionId('2024-01-15T10-30-45-123Z')).toBe(false);
  });

  it('should reject ID with invalid date format', () => {
    expect(isValidSessionId('session-2024-1-15T10-30-45-123Z')).toBe(false);
  });

  it('should reject ID with invalid time format', () => {
    expect(isValidSessionId('session-2024-01-15T10:30:45.123Z')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidSessionId('')).toBe(false);
  });

  it('should reject node ID format', () => {
    expect(isValidSessionId('test-title-abcd1234')).toBe(false);
  });
});
