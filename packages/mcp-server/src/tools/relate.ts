/**
 * autology_relate tool - Create relationships between nodes
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { NodeStore } from '../storage/node-store.js';
import type { GraphIndexStore } from '../storage/graph-index.js';
import { RelationTypeSchema } from '../utils/validation.js';

const RelateArgsSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  type: RelationTypeSchema,
  description: z.string().optional(),
  bidirectional: z.boolean().default(false),
  confidence: z.number().min(0).max(1).default(0.8)
});

export function registerRelateTool(
  _nodeStore: NodeStore,
  _graphIndex: GraphIndexStore
): Tool {
  return {
    name: 'autology_relate',
    description: 'Create a relationship between two knowledge nodes',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          description: 'Source node ID'
        },
        target: {
          type: 'string',
          description: 'Target node ID'
        },
        type: {
          type: 'string',
          enum: ['affects', 'uses', 'supersedes', 'relates_to', 'implements', 'depends_on', 'derived_from'],
          description: 'Type of relationship'
        },
        description: {
          type: 'string',
          description: 'Optional description of the relationship'
        },
        bidirectional: {
          type: 'boolean',
          description: 'Create reverse relationship as well (default false)'
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Confidence level (0.0-1.0, default 0.8)'
        }
      },
      required: ['source', 'target', 'type']
    }
  };
}

export async function handleRelate(
  args: Record<string, unknown>,
  nodeStore: NodeStore,
  graphIndex: GraphIndexStore
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const validated = RelateArgsSchema.parse(args);

  // Verify both nodes exist
  const sourceNode = await nodeStore.findNode(validated.source);
  if (!sourceNode) {
    throw new Error(`Source node not found: ${validated.source}`);
  }

  const targetNode = await nodeStore.findNode(validated.target);
  if (!targetNode) {
    throw new Error(`Target node not found: ${validated.target}`);
  }

  // Create relation
  await graphIndex.addRelation(
    validated.source,
    validated.target,
    validated.type,
    validated.description,
    validated.confidence
  );

  // Create reverse relation if bidirectional
  if (validated.bidirectional) {
    await graphIndex.addRelation(
      validated.target,
      validated.source,
      validated.type,
      validated.description ? `Reverse: ${validated.description}` : undefined,
      validated.confidence
    );
  }

  const output = [
    `✅ Created relationship:`,
    ``,
    `${sourceNode.title} (${validated.source})`,
    `  ${validated.type.toUpperCase()}`,
    `${targetNode.title} (${validated.target})`,
    ``
  ];

  if (validated.description) {
    output.push(`Description: ${validated.description}`);
  }

  if (validated.bidirectional) {
    output.push(`(bidirectional relationship created)`);
  }

  return {
    content: [
      {
        type: 'text',
        text: output.join('\n')
      }
    ]
  };
}
