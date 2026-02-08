/**
 * Zod schemas for validation
 */
import { z } from 'zod';
import { NODE_TYPES, NODE_STATUSES, RELATION_TYPES } from '../storage/types.js';

export const NodeTypeSchema = z.enum(NODE_TYPES);
export const NodeStatusSchema = z.enum(NODE_STATUSES);
export const RelationTypeSchema = z.enum(RELATION_TYPES);

export const RelationSchema = z.object({
  type: RelationTypeSchema,
  target: z.string().min(1),
  description: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export const KnowledgeNodeSchema = z.object({
  id: z.string().min(1),
  type: NodeTypeSchema,
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
  relations: z.array(RelationSchema).default([]),
  confidence: z.number().min(0).max(1).default(0.8),
  created: z.string().datetime(),
  modified: z.string().datetime(),
  session: z.string().optional(),
  source: z.enum(['manual', 'hook_write', 'hook_commit', 'hook_session']).default('manual'),
  references: z.array(z.string()).default([]),
  status: NodeStatusSchema.default('active'),
});

export const NodeFilterSchema = z.object({
  type: NodeTypeSchema.optional(),
  tags: z.array(z.string()).optional(),
  status: NodeStatusSchema.optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  relatedTo: z.string().optional(),
  searchQuery: z.string().optional(),
});

export const GraphIndexSchema = z.object({
  version: z.string(),
  lastUpdated: z.string().datetime(),
  relations: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      type: RelationTypeSchema,
      description: z.string().optional(),
      confidence: z.number().min(0).max(1),
    }),
  ),
});
