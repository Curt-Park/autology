/**
 * autology_status tool - Get ontology status and statistics
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { NodeStore } from '../storage/node-store.js';
import type { GraphIndexStore } from '../storage/graph-index.js';
import type { NodeType } from '../storage/types.js';

const StatusArgsSchema = z.object({
  detail: z.enum(['summary', 'full']).default('summary'),
});

export function registerStatusTool(_nodeStore: NodeStore, _graphIndex: GraphIndexStore): Tool {
  return {
    name: 'autology_status',
    description: 'Get current status and statistics of the ontology',
    inputSchema: {
      type: 'object',
      properties: {
        detail: {
          type: 'string',
          enum: ['summary', 'full'],
          description: 'Level of detail (summary or full)',
        },
      },
    },
  };
}

export async function handleStatus(
  args: Record<string, unknown>,
  nodeStore: NodeStore,
  graphIndex: GraphIndexStore,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const validated = StatusArgsSchema.parse(args);

  // Get all nodes
  const allNodes = await nodeStore.listNodes();

  // Group by type
  const nodesByType: Partial<Record<NodeType, number>> = {};
  const nodesByStatus: Record<string, number> = {};
  const nodesByConfidence: { low: number; medium: number; high: number } = {
    low: 0,
    medium: 0,
    high: 0,
  };

  for (const node of allNodes) {
    // Count by type
    nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;

    // Count by status
    nodesByStatus[node.status] = (nodesByStatus[node.status] || 0) + 1;

    // Count by confidence
    if (node.confidence < 0.5) {
      nodesByConfidence.low++;
    } else if (node.confidence < 0.8) {
      nodesByConfidence.medium++;
    } else {
      nodesByConfidence.high++;
    }
  }

  // Get graph statistics
  const graphStats = graphIndex.getStatistics();

  // Build output
  const output = [
    '# autology Ontology Status\n',
    `**Total Nodes**: ${allNodes.length}`,
    `**Total Relations**: ${graphStats.totalRelations}\n`,
    '## Nodes by Type\n',
  ];

  for (const [type, count] of Object.entries(nodesByType)) {
    output.push(`- **${type}**: ${count}`);
  }

  output.push('\n## Nodes by Status\n');
  for (const [status, count] of Object.entries(nodesByStatus)) {
    output.push(`- **${status}**: ${count}`);
  }

  output.push('\n## Confidence Distribution\n');
  output.push(`- **High (≥0.8)**: ${nodesByConfidence.high}`);
  output.push(`- **Medium (0.5-0.8)**: ${nodesByConfidence.medium}`);
  output.push(`- **Low (<0.5)**: ${nodesByConfidence.low}`);

  if (validated.detail === 'full') {
    output.push('\n## Relations by Type\n');
    for (const [type, count] of Object.entries(graphStats.relationsByType)) {
      output.push(`- **${type}**: ${count}`);
    }

    // Recent nodes
    const recentNodes = allNodes
      .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
      .slice(0, 5);

    if (recentNodes.length > 0) {
      output.push('\n## Recent Activity\n');
      for (const node of recentNodes) {
        const date = new Date(node.modified).toLocaleDateString();
        output.push(`- **${node.title}** (${node.type}) - ${date}`);
      }
    }

    // Nodes needing review
    const needsReview = allNodes.filter((n) => n.status === 'needs_review');
    if (needsReview.length > 0) {
      output.push(`\n## ⚠️  Nodes Needing Review: ${needsReview.length}\n`);
      for (const node of needsReview.slice(0, 5)) {
        output.push(`- **${node.title}** (${node.id})`);
      }
      if (needsReview.length > 5) {
        output.push(`  ... and ${needsReview.length - 5} more`);
      }
    }
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
