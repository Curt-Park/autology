/**
 * Tests for SchemaRegistryStore using memfs
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { vol } from 'memfs';
import { SchemaRegistryStore } from './schema-registry.js';
import { StorageError } from '../utils/errors.js';

// Mock fs module with memfs
vi.mock('fs/promises', async () => {
  const memfs = await import('memfs');
  return memfs.fs.promises;
});

vi.mock('fs', async () => {
  const memfs = await import('memfs');
  return memfs.fs;
});

describe('SchemaRegistryStore', () => {
  let store: SchemaRegistryStore;
  const testRoot = '/test-autology';

  beforeEach(() => {
    vol.reset();
    vol.mkdirSync(testRoot, { recursive: true });
    store = new SchemaRegistryStore(testRoot);
  });

  afterEach(() => {
    vol.reset();
  });

  describe('load', () => {
    it('should create default schema when file does not exist', async () => {
      const schema = await store.load();

      expect(schema.version).toBe('1.0.0');
      expect(Object.keys(schema.types)).toHaveLength(7);
      expect(schema.types.decision).toBeDefined();
      expect(schema.types.component).toBeDefined();
      expect(schema.types.convention).toBeDefined();
      expect(schema.types.concept).toBeDefined();
      expect(schema.types.session).toBeDefined();
      expect(schema.types.pattern).toBeDefined();
      expect(schema.types.issue).toBeDefined();
    });

    it('should load existing schema from file', async () => {
      const existingSchema = {
        version: '1.0.0',
        types: {
          decision: {
            name: 'decision' as const,
            description: 'Custom description',
            examples: ['example1'],
            commonTags: ['tag1'],
          },
          component: {
            name: 'component' as const,
            description: 'Components',
            examples: [],
            commonTags: [],
          },
          convention: {
            name: 'convention' as const,
            description: 'Conventions',
            examples: [],
            commonTags: [],
          },
          concept: {
            name: 'concept' as const,
            description: 'Concepts',
            examples: [],
            commonTags: [],
          },
          session: {
            name: 'session' as const,
            description: 'Sessions',
            examples: [],
            commonTags: [],
          },
          pattern: {
            name: 'pattern' as const,
            description: 'Patterns',
            examples: [],
            commonTags: [],
          },
          issue: {
            name: 'issue' as const,
            description: 'Issues',
            examples: [],
            commonTags: [],
          },
        },
      };

      vol.writeFileSync('/test-autology/schema.json', JSON.stringify(existingSchema));

      const schema = await store.load();

      expect(schema.types.decision.description).toBe('Custom description');
      expect(schema.types.decision.examples).toEqual(['example1']);
    });

    it('should throw StorageError for invalid JSON', async () => {
      vol.writeFileSync('/test-autology/schema.json', 'invalid json');

      await expect(store.load()).rejects.toThrow(StorageError);
    });
  });

  describe('save', () => {
    it('should save schema to file', async () => {
      const schema = await store.load();

      await store.save(schema);

      const content = vol.readFileSync('/test-autology/schema.json', 'utf-8') as string;
      const saved = JSON.parse(content);

      expect(saved.version).toBe('1.0.0');
      expect(Object.keys(saved.types)).toHaveLength(7);
    });

    it('should persist custom schema', async () => {
      const customSchema = {
        version: '1.0.0',
        types: {
          decision: {
            name: 'decision' as const,
            description: 'Modified',
            examples: ['test'],
            commonTags: ['modified'],
          },
          component: {
            name: 'component' as const,
            description: 'Components',
            examples: [],
            commonTags: [],
          },
          convention: {
            name: 'convention' as const,
            description: 'Conventions',
            examples: [],
            commonTags: [],
          },
          concept: {
            name: 'concept' as const,
            description: 'Concepts',
            examples: [],
            commonTags: [],
          },
          session: {
            name: 'session' as const,
            description: 'Sessions',
            examples: [],
            commonTags: [],
          },
          pattern: {
            name: 'pattern' as const,
            description: 'Patterns',
            examples: [],
            commonTags: [],
          },
          issue: {
            name: 'issue' as const,
            description: 'Issues',
            examples: [],
            commonTags: [],
          },
        },
      };

      await store.save(customSchema);

      const content = vol.readFileSync('/test-autology/schema.json', 'utf-8') as string;
      const saved = JSON.parse(content);

      expect(saved.types.decision.description).toBe('Modified');
      expect(saved.types.decision.commonTags).toEqual(['modified']);
    });
  });

  describe('default schema', () => {
    it('should have all required fields for each type', async () => {
      const schema = await store.load();

      for (const typeSchema of Object.values(schema.types)) {
        expect(typeSchema.name).toBeDefined();
        expect(typeSchema.description).toBeDefined();
        expect(Array.isArray(typeSchema.examples)).toBe(true);
        expect(Array.isArray(typeSchema.commonTags)).toBe(true);
      }
    });

    it('should have meaningful descriptions', async () => {
      const schema = await store.load();

      expect(schema.types.decision.description).toContain('decision');
      expect(schema.types.component.description).toContain('component');
      expect(schema.types.convention.description).toContain('convention');
      expect(schema.types.concept.description).toContain('concept');
      expect(schema.types.pattern.description).toContain('pattern');
      expect(schema.types.issue.description).toContain('issue');
    });
  });
});
