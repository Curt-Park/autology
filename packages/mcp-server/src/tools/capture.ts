/**
 * autology_capture tool - Create knowledge nodes
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { NodeStore } from '../storage/node-store.js';
import type { GraphIndexStore } from '../storage/graph-index.js';
import type { SchemaRegistryStore } from '../storage/schema-registry.js';
import { createKnowledgeNode } from '../storage/types.js';
import { generateNodeId, generateSessionId } from '../utils/id.js';
import { NodeTypeSchema } from '../utils/validation.js';

const CaptureArgsSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  context: z.string().optional(),
  type: NodeTypeSchema.optional(),
  tags: z.array(z.string()).default([]),
  relatedTo: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).default(0.8),
  references: z.array(z.string()).default([])
});

export function registerCaptureTool(
  _nodeStore: NodeStore,
  _graphIndex: GraphIndexStore,
  _schemaRegistry: SchemaRegistryStore
): Tool {
  return {
    name: 'autology_capture',
    description: 'Capture knowledge as a node in the ontology. Automatically classifies type if not specified.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Short, descriptive title for the knowledge node'
        },
        content: {
          type: 'string',
          description: 'Detailed content in markdown format'
        },
        context: {
          type: 'string',
          description: 'Optional contextual information (e.g., what prompted this capture)'
        },
        type: {
          type: 'string',
          enum: ['decision', 'component', 'convention', 'concept', 'session', 'pattern', 'issue'],
          description: 'Node type (auto-classified if not provided)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization'
        },
        relatedTo: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of related nodes'
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Confidence level (0.0-1.0, default 0.8)'
        },
        references: {
          type: 'array',
          items: { type: 'string' },
          description: 'File paths referenced by this node'
        }
      },
      required: ['title', 'content']
    }
  };
}

export async function handleCapture(
  args: Record<string, unknown>,
  nodeStore: NodeStore,
  graphIndex: GraphIndexStore,
  _schemaRegistry: SchemaRegistryStore
): Promise<{ content: Array<{ type: string; text: string }> }> {
  // Validate arguments
  const validated = CaptureArgsSchema.parse(args);

  // Determine node type (use automatic classification if not provided)
  let nodeType = validated.type;
  let classificationNote = '';

  if (!nodeType) {
    // Import classifier
    const { classify } = await import('../classification/classifier.js');

    const result = classify({
      title: validated.title,
      content: validated.content,
      sourceContext: 'manual'
    });

    nodeType = result.type;
    classificationNote = `\nAuto-classified as '${nodeType}' (confidence: ${(result.confidence * 100).toFixed(0)}%)`;

    if (result.needsReview && result.alternatives) {
      classificationNote += `\n⚠️  Low confidence. Consider these alternatives: ${result.alternatives.map(a => `${a.type} (${(a.confidence * 100).toFixed(0)}%)`).join(', ')}`;
    }
  }

  // Generate ID
  const nodeId = generateNodeId(validated.title, nodeType);

  // Get or create session ID
  const sessionId = process.env['AUTOLOGY_SESSION_ID'] || generateSessionId();

  // Create node
  const node = createKnowledgeNode({
    id: nodeId,
    type: nodeType,
    title: validated.title,
    content: validated.content,
    tags: validated.tags,
    confidence: validated.confidence,
    session: sessionId,
    source: 'manual',
    references: validated.references
  });

  // Save node
  await nodeStore.createNode(node);

  // Create relations if provided
  if (validated.relatedTo && validated.relatedTo.length > 0) {
    for (const targetId of validated.relatedTo) {
      await graphIndex.addRelation(
        nodeId,
        targetId,
        'relates_to',
        undefined,
        validated.confidence
      );
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `✅ Created ${nodeType} node: ${nodeId}\n\nTitle: ${validated.title}\nType: ${nodeType}\nTags: ${validated.tags.join(', ') || 'none'}\nConfidence: ${validated.confidence}${classificationNote}\n\nThe node has been saved to .autology/nodes/${nodeType}s/${nodeId}.md`
      }
    ]
  };
}
