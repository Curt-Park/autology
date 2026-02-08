/**
 * Context builder for autology_context tool
 * Intelligently selects relevant nodes based on current working context
 */
import type { KnowledgeNode } from '../storage/types.js';

export interface ContextSignals {
  readonly currentFile?: string | undefined;
  readonly currentTask?: string | undefined;
  readonly recentFiles?: ReadonlyArray<string> | undefined;
}

export interface ScoredNode {
  readonly node: KnowledgeNode;
  readonly score: number;
  readonly reasons: ReadonlyArray<string>;
}

/**
 * Score nodes based on relevance to current context
 */
export function scoreNodesForContext(
  nodes: ReadonlyArray<KnowledgeNode>,
  signals: ContextSignals,
): ReadonlyArray<ScoredNode> {
  const scored: ScoredNode[] = [];

  for (const node of nodes) {
    const result = scoreNode(node, signals);
    if (result.score > 0) {
      scored.push(result);
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * Score a single node
 */
function scoreNode(node: KnowledgeNode, signals: ContextSignals): ScoredNode {
  let score = 0;
  const reasons: string[] = [];

  // 1. Current file exact match (highest priority)
  if (signals.currentFile && node.references.includes(signals.currentFile)) {
    score += 1.0;
    reasons.push('References current file');
  }

  // 2. Current file partial match (directory or filename similarity)
  if (signals.currentFile) {
    for (const ref of node.references) {
      if (filesAreSimilar(signals.currentFile, ref)) {
        score += 0.6;
        reasons.push('References similar file');
        break;
      }
    }
  }

  // 3. Recent files match
  if (signals.recentFiles) {
    let matchCount = 0;
    for (const recentFile of signals.recentFiles) {
      if (node.references.includes(recentFile)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      score += 0.4 * Math.min(matchCount / signals.recentFiles.length, 1);
      reasons.push(`References ${matchCount} recent file(s)`);
    }
  }

  // 4. Task description match
  if (signals.currentTask) {
    const taskWords = extractKeywords(signals.currentTask);
    const nodeText = `${node.title} ${node.content} ${node.tags.join(' ')}`;
    const matchScore = calculateKeywordMatch(taskWords, nodeText);

    if (matchScore > 0.3) {
      score += matchScore * 0.8;
      reasons.push(`Matches task keywords (${(matchScore * 100).toFixed(0)}%)`);
    }
  }

  // 5. Node type weighting
  const typeWeights: Record<string, number> = {
    decision: 0.3,
    convention: 0.25,
    component: 0.2,
    concept: 0.15,
    pattern: 0.2,
    issue: 0.1,
    session: 0.05,
  };

  score += typeWeights[node.type] || 0.1;

  // 6. Confidence boost
  score += node.confidence * 0.2;

  // 7. Recency boost (favor recently modified)
  const ageInDays = (Date.now() - new Date(node.modified).getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 0.3 - (ageInDays / 30) * 0.1);
  score += recencyScore;
  if (recencyScore > 0.1) {
    reasons.push('Recently modified');
  }

  // 8. Status penalty
  if (node.status === 'superseded') {
    score *= 0.3; // Heavily penalize superseded nodes
    reasons.push('Superseded (low priority)');
  } else if (node.status === 'needs_review') {
    score *= 0.8; // Slightly penalize nodes needing review
  }

  // 9. Relation density boost (well-connected nodes are more important)
  if (node.relations.length > 3) {
    score += 0.15;
    reasons.push(`Well-connected (${node.relations.length} relations)`);
  }

  return { node, score, reasons };
}

/**
 * Check if two file paths are similar
 */
function filesAreSimilar(file1: string, file2: string): boolean {
  // Same directory
  const dir1 = file1.substring(0, file1.lastIndexOf('/'));
  const dir2 = file2.substring(0, file2.lastIndexOf('/'));

  if (dir1 === dir2 && dir1.length > 0) {
    return true;
  }

  // Similar filename
  const name1 = file1.substring(file1.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '');
  const name2 = file2.substring(file2.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '');

  if (name1 === name2) {
    return true;
  }

  // Related names (e.g., test file and source file)
  if (name1.includes(name2) || name2.includes(name1)) {
    return true;
  }

  return false;
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): ReadonlyArray<string> {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3) // Skip short words
    .filter((w) => !isStopWord(w));

  return [...new Set(words)]; // Deduplicate
}

/**
 * Calculate keyword match score
 */
function calculateKeywordMatch(keywords: ReadonlyArray<string>, text: string): number {
  if (keywords.length === 0) return 0;

  const textLower = text.toLowerCase();
  let matches = 0;

  for (const keyword of keywords) {
    if (textLower.includes(keyword)) {
      matches++;
    }
  }

  return matches / keywords.length;
}

/**
 * Check if word is a stop word
 */
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the',
    'is',
    'at',
    'which',
    'on',
    'in',
    'to',
    'for',
    'of',
    'and',
    'or',
    'but',
    'with',
    'from',
    'this',
    'that',
    'these',
    'those',
    'will',
    'would',
    'should',
    'could',
    'can',
    'may',
  ]);

  return stopWords.has(word);
}

/**
 * Group scored nodes by relevance tier
 */
export function groupByRelevance(scoredNodes: ReadonlyArray<ScoredNode>): {
  readonly high: ReadonlyArray<ScoredNode>;
  readonly medium: ReadonlyArray<ScoredNode>;
  readonly low: ReadonlyArray<ScoredNode>;
} {
  const high: ScoredNode[] = [];
  const medium: ScoredNode[] = [];
  const low: ScoredNode[] = [];

  for (const scored of scoredNodes) {
    if (scored.score >= 1.0) {
      high.push(scored);
    } else if (scored.score >= 0.5) {
      medium.push(scored);
    } else {
      low.push(scored);
    }
  }

  return { high, medium, low };
}

/**
 * Format scored nodes for display
 */
export function formatContextResults(
  scoredNodes: ReadonlyArray<ScoredNode>,
  limit: number,
): string {
  const limited = scoredNodes.slice(0, limit);

  if (limited.length === 0) {
    return 'No relevant context found for current task.';
  }

  const lines: string[] = [];

  for (const { node, score, reasons } of limited) {
    lines.push(`\n## ${node.title}`);
    lines.push(`**Type**: ${node.type} | **Relevance**: ${(score * 100).toFixed(0)}%`);
    lines.push(`**Why**: ${reasons.join(', ')}`);

    if (node.tags.length > 0) {
      lines.push(`**Tags**: ${node.tags.join(', ')}`);
    }

    // Show preview
    const preview = node.content.substring(0, 200).replace(/\n/g, ' ');
    lines.push(`\n${preview}${node.content.length > 200 ? '...' : ''}\n`);
  }

  return lines.join('\n');
}
