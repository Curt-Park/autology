/**
 * Deterministic ID generation for knowledge nodes
 */
import slugify from 'slugify';
import { createHash } from 'crypto';

/**
 * Generate a deterministic ID from a title
 * Uses slugify for URL-safe IDs with collision handling
 */
export function generateNodeId(title: string, type: string): string {
  const slug = slugify(title, {
    lower: true,
    strict: true,
    trim: true
  });

  // Truncate to reasonable length
  const truncated = slug.substring(0, 50);

  // Add short hash for collision resistance
  const hash = createHash('sha256')
    .update(`${type}:${title}`)
    .digest('hex')
    .substring(0, 8);

  return `${truncated}-${hash}`;
}

/**
 * Generate a session ID based on timestamp
 */
export function generateSessionId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `session-${timestamp}`;
}

/**
 * Validate that an ID follows the expected format
 */
export function isValidNodeId(id: string): boolean {
  // ID should be lowercase alphanumeric with hyphens, ending with 8-char hash
  return /^[a-z0-9-]+-[a-f0-9]{8}$/.test(id);
}

/**
 * Validate session ID format
 */
export function isValidSessionId(id: string): boolean {
  return /^session-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/.test(id);
}
