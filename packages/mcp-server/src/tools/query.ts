/**
 * autology_query tool - Search and filter ontology nodes
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { SearchEngine } from '../storage/search.js';
import { NodeTypeSchema, NodeStatusSchema } from '../utils/validation.js';

const QueryArgsSchema = z.object({
  query: z.string().optional(),
  type: NodeTypeSchema.optional(),
  tags: z.array(z.string()).optional(),
  status: NodeStatusSchema.optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  relatedTo: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0)
});

export function registerQueryTool(_searchEngine: SearchEngine): Tool {
  return {
    name: 'autology_query',
    description: 'Search and filter knowledge nodes in the ontology',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Full-text search query'
        },
        type: {
          type: 'string',
          enum: ['decision', 'component', 'convention', 'concept', 'session', 'pattern', 'issue'],
          description: 'Filter by node type'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags (must have all tags)'
        },
        status: {
          type: 'string',
          enum: ['active', 'needs_review', 'superseded'],
          description: 'Filter by node status'
        },
        minConfidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Minimum confidence level'
        },
        relatedTo: {
          type: 'string',
          description: 'Filter by relationship to another node ID'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default 50)'
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination (default 0)'
        }
      }
    }
  };
}

export async function handleQuery(
  args: Record<string, unknown>,
  searchEngine: SearchEngine
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const validated = QueryArgsSchema.parse(args);

  // Build filter
  const filter = {
    type: validated.type,
    tags: validated.tags,
    status: validated.status,
    minConfidence: validated.minConfidence,
    relatedTo: validated.relatedTo,
    searchQuery: validated.query
  };

  // Execute search
  const results = await searchEngine.search(filter, validated.limit, validated.offset);

  // Format results
  if (results.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'No nodes found matching the query criteria.'
        }
      ]
    };
  }

  const output = [
    `Found ${results.length} node(s):\n`,
    '---\n'
  ];

  for (const { node, score } of results) {
    output.push(`\n## ${node.title}`);
    output.push(`- **ID**: ${node.id}`);
    output.push(`- **Type**: ${node.type}`);
    output.push(`- **Tags**: ${node.tags.join(', ') || 'none'}`);
    output.push(`- **Confidence**: ${node.confidence.toFixed(2)}`);
    output.push(`- **Score**: ${score.toFixed(2)}`);
    output.push(`- **Status**: ${node.status}`);
    output.push(`- **Modified**: ${new Date(node.modified).toLocaleDateString()}`);

    if (node.relations.length > 0) {
      output.push(`- **Relations**: ${node.relations.length} related node(s)`);
    }

    // Show preview of content (first 200 chars)
    const preview = node.content.substring(0, 200).replace(/\n/g, ' ');
    output.push(`- **Preview**: ${preview}${node.content.length > 200 ? '...' : ''}`);
    output.push('');
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
