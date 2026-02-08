/**
 * autology_context tool - Get relevant knowledge for current context
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { NodeStore } from '../storage/node-store.js';
import type { GraphIndexStore } from '../storage/graph-index.js';
import type { SearchEngine } from '../storage/search.js';
import type { KnowledgeNode } from '../storage/types.js';

const ContextArgsSchema = z.object({
  currentFile: z.string().optional(),
  currentTask: z.string().optional(),
  recentFiles: z.array(z.string()).optional(),
  maxNodes: z.number().int().min(1).max(20).default(10),
});

export function registerContextTool(
  _nodeStore: NodeStore,
  _graphIndex: GraphIndexStore,
  _searchEngine: SearchEngine,
): Tool {
  return {
    name: 'autology_context',
    description: 'Get relevant knowledge nodes for the current working context',
    inputSchema: {
      type: 'object',
      properties: {
        currentFile: {
          type: 'string',
          description: 'Currently active file path',
        },
        currentTask: {
          type: 'string',
          description: 'Description of current task',
        },
        recentFiles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Recently modified file paths',
        },
        maxNodes: {
          type: 'number',
          description: 'Maximum number of nodes to return (default 10)',
        },
      },
    },
  };
}

export async function handleContext(
  args: Record<string, unknown>,
  nodeStore: NodeStore,
  _graphIndex: GraphIndexStore,
  searchEngine: SearchEngine,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const validated = ContextArgsSchema.parse(args);

  // Collect relevant nodes with scoring
  const relevantNodes = new Map<string, { node: KnowledgeNode; score: number }>();

  // 1. Find nodes by file references
  if (validated.currentFile) {
    const byFile = await searchEngine.findByFileReference(validated.currentFile);
    for (const result of byFile) {
      relevantNodes.set(result.node.id, {
        node: result.node,
        score: 1.0, // High score for exact file match
      });
    }
  }

  // 2. Find nodes by recent files
  if (validated.recentFiles && validated.recentFiles.length > 0) {
    for (const file of validated.recentFiles) {
      const byFile = await searchEngine.findByFileReference(file);
      for (const result of byFile) {
        const existing = relevantNodes.get(result.node.id);
        if (!existing || existing.score < 0.7) {
          relevantNodes.set(result.node.id, {
            node: result.node,
            score: 0.7, // Medium score for recent files
          });
        }
      }
    }
  }

  // 3. Find nodes by task description
  if (validated.currentTask) {
    const byTask = await searchEngine.fullTextSearch(validated.currentTask, validated.maxNodes);
    for (const result of byTask) {
      const existing = relevantNodes.get(result.node.id);
      if (!existing || existing.score < result.score * 0.8) {
        relevantNodes.set(result.node.id, {
          node: result.node,
          score: result.score * 0.8, // Scaled score from text search
        });
      }
    }
  }

  // 4. Get recent and high-confidence nodes as fallback
  if (relevantNodes.size < validated.maxNodes) {
    const allNodes = await nodeStore.listNodes({
      minConfidence: 0.7,
      status: 'active',
    });

    const recentNodes = allNodes
      .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
      .slice(0, validated.maxNodes - relevantNodes.size);

    for (const node of recentNodes) {
      if (!relevantNodes.has(node.id)) {
        // Recency score based on how old the node is
        const ageInDays = (Date.now() - new Date(node.modified).getTime()) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.max(0.3, 0.6 - (ageInDays / 30) * 0.1);

        relevantNodes.set(node.id, {
          node,
          score: recencyScore,
        });
      }
    }
  }

  // Sort by score and limit
  const sortedResults = Array.from(relevantNodes.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, validated.maxNodes);

  // Format output
  if (sortedResults.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'No relevant knowledge found for the current context. The ontology may be empty or no nodes match the current working context.',
        },
      ],
    };
  }

  const output = [
    `# Relevant Knowledge (${sortedResults.length} nodes)\n`,
    validated.currentFile && `**Current File**: ${validated.currentFile}`,
    validated.currentTask && `**Current Task**: ${validated.currentTask}`,
    '\n---\n',
  ].filter(Boolean);

  for (const { node, score } of sortedResults) {
    output.push(`\n## ${node.title}`);
    output.push(`- **Type**: ${node.type}`);
    output.push(`- **Relevance**: ${(score * 100).toFixed(0)}%`);
    output.push(`- **Tags**: ${node.tags.join(', ') || 'none'}`);

    if (node.references.length > 0) {
      output.push(`- **References**: ${node.references.slice(0, 3).join(', ')}`);
    }

    // Show content preview
    const preview = node.content.substring(0, 300).replace(/\n/g, ' ');
    output.push(`\n${preview}${node.content.length > 300 ? '...' : ''}\n`);

    // Show relations
    if (node.relations.length > 0) {
      const relations = node.relations.slice(0, 3);
      output.push(`**Related to**: ${relations.map((r) => r.target).join(', ')}`);
      if (node.relations.length > 3) {
        output.push(` (+${node.relations.length - 3} more)`);
      }
    }

    output.push('');
  }

  return {
    content: [
      {
        type: 'text',
        text: output.join('\n'),
      },
    ],
  };
}
