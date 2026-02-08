/**
 * Heuristic-based node type classification
 * Fast keyword matching without LLM calls
 */
import type { NodeType } from '../storage/types.js';

export interface ClassificationResult {
  readonly type: NodeType;
  readonly confidence: number;
  readonly reasoning: string;
}

interface Pattern {
  readonly keywords: ReadonlyArray<string>;
  readonly weight: number;
}

const CLASSIFICATION_PATTERNS: Record<NodeType, ReadonlyArray<Pattern>> = {
  decision: [
    { keywords: ['chose', 'choose', 'decided', 'decide', 'selected', 'select'], weight: 1.0 },
    { keywords: ['decision', 'choice', 'selection'], weight: 0.9 },
    { keywords: ['adopt', 'use', 'switch to', 'move to'], weight: 0.8 },
    { keywords: ['instead of', 'over', 'rather than', 'vs'], weight: 0.7 },
    { keywords: ['because', 'since', 'reason', 'rationale'], weight: 0.6 },
    { keywords: ['alternative', 'option', 'considered'], weight: 0.5 }
  ],

  component: [
    { keywords: ['service', 'module', 'class', 'function', 'method'], weight: 1.0 },
    { keywords: ['component', 'controller', 'model', 'view'], weight: 0.9 },
    { keywords: ['handles', 'manages', 'implements', 'provides'], weight: 0.8 },
    { keywords: ['api', 'endpoint', 'route', 'handler'], weight: 0.7 },
    { keywords: ['created', 'built', 'implemented'], weight: 0.6 }
  ],

  convention: [
    { keywords: ['always', 'never', 'must', 'should', 'shall'], weight: 1.0 },
    { keywords: ['convention', 'standard', 'practice', 'guideline'], weight: 0.9 },
    { keywords: ['rule', 'policy', 'requirement'], weight: 0.8 },
    { keywords: ['style', 'format', 'naming', 'pattern'], weight: 0.7 },
    { keywords: ['all', 'every', 'each', 'any'], weight: 0.6 }
  ],

  concept: [
    { keywords: ['concept', 'idea', 'notion', 'model'], weight: 1.0 },
    { keywords: ['represents', 'means', 'refers to', 'is'], weight: 0.9 },
    { keywords: ['lifecycle', 'workflow', 'process', 'flow'], weight: 0.8 },
    { keywords: ['state', 'status', 'phase', 'stage'], weight: 0.7 },
    { keywords: ['domain', 'business', 'entity'], weight: 0.6 }
  ],

  pattern: [
    { keywords: ['pattern', 'approach', 'strategy', 'technique'], weight: 1.0 },
    { keywords: ['reusable', 'generic', 'abstract', 'common'], weight: 0.9 },
    { keywords: ['design pattern', 'architectural pattern'], weight: 0.95 },
    { keywords: ['factory', 'singleton', 'observer', 'repository'], weight: 0.8 },
    { keywords: ['template', 'blueprint', 'recipe'], weight: 0.7 }
  ],

  issue: [
    { keywords: ['issue', 'problem', 'bug', 'error', 'defect'], weight: 1.0 },
    { keywords: ['broken', 'failing', 'not working'], weight: 0.9 },
    { keywords: ['debt', 'technical debt', 'todo', 'fixme'], weight: 0.8 },
    { keywords: ['bottleneck', 'performance', 'slow'], weight: 0.7 },
    { keywords: ['needs fix', 'needs refactor', 'improvement needed'], weight: 0.6 }
  ],

  session: [
    { keywords: ['session', 'worked on', 'accomplished', 'completed'], weight: 1.0 },
    { keywords: ['today', 'this session', 'summary'], weight: 0.9 },
    { keywords: ['implemented', 'fixed', 'added', 'updated'], weight: 0.7 },
    { keywords: ['progress', 'status update'], weight: 0.6 }
  ]
};

/**
 * Classify node type based on title and content
 */
export function classifyNodeType(
  title: string,
  content: string,
  sourceContext?: 'hook_write' | 'hook_commit' | 'hook_session' | 'manual'
): ClassificationResult {
  const text = `${title} ${content}`.toLowerCase();

  // Context-based boosting
  const contextBoost: Record<string, Partial<Record<NodeType, number>>> = {
    hook_write: { component: 0.3, convention: 0.2 },
    hook_commit: { decision: 0.3, issue: 0.2 },
    hook_session: { session: 0.5 },
    manual: {} // No boost for manual
  };

  const boost = contextBoost[sourceContext || 'manual'] || {};

  // Score each type
  const scores: Record<NodeType, number> = {
    decision: 0,
    component: 0,
    convention: 0,
    concept: 0,
    pattern: 0,
    issue: 0,
    session: 0
  };

  for (const [type, patterns] of Object.entries(CLASSIFICATION_PATTERNS)) {
    let typeScore = 0;

    for (const pattern of patterns) {
      for (const keyword of pattern.keywords) {
        if (text.includes(keyword)) {
          typeScore += pattern.weight;
        }
      }
    }

    // Apply context boost
    const nodeType = type as NodeType;
    const boostAmount = boost[nodeType] || 0;
    typeScore += boostAmount;

    scores[nodeType] = typeScore;
  }

  // Find best match
  let bestType: NodeType = 'concept'; // Default fallback
  let bestScore = 0;

  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type as NodeType;
    }
  }

  // Normalize confidence (cap at 0.95 for heuristics)
  const maxPossibleScore = 10; // Rough estimate
  const confidence = Math.min(0.95, bestScore / maxPossibleScore);

  // Generate reasoning
  const reasoning = generateReasoning(bestType, text, scores);

  return {
    type: bestType,
    confidence,
    reasoning
  };
}

/**
 * Generate human-readable reasoning for classification
 */
function generateReasoning(
  chosenType: NodeType,
  text: string,
  scores: Record<NodeType, number>
): string {
  const patterns = CLASSIFICATION_PATTERNS[chosenType];
  const matchedKeywords: string[] = [];

  for (const pattern of patterns) {
    for (const keyword of pattern.keywords) {
      if (text.includes(keyword)) {
        matchedKeywords.push(keyword);
        if (matchedKeywords.length >= 3) break;
      }
    }
    if (matchedKeywords.length >= 3) break;
  }

  const topScores = Object.entries(scores)
    .filter(([t]) => t !== chosenType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  let reasoning = `Classified as '${chosenType}' based on keywords: ${matchedKeywords.join(', ')}`;

  if (topScores.length > 0 && topScores[0] && topScores[0][1] > scores[chosenType] * 0.7) {
    reasoning += `. Also considered '${topScores[0][0]}' (score: ${topScores[0][1].toFixed(2)})`;
  }

  return reasoning;
}

/**
 * Check if classification is confident enough
 */
export function isConfidentClassification(result: ClassificationResult): boolean {
  return result.confidence >= 0.6;
}

/**
 * Suggest alternative types if confidence is low
 */
export function suggestAlternatives(
  title: string,
  content: string
): ReadonlyArray<ClassificationResult> {
  const text = `${title} ${content}`.toLowerCase();
  const scores: Array<{ type: NodeType; score: number }> = [];

  for (const [type, patterns] of Object.entries(CLASSIFICATION_PATTERNS)) {
    let typeScore = 0;

    for (const pattern of patterns) {
      for (const keyword of pattern.keywords) {
        if (text.includes(keyword)) {
          typeScore += pattern.weight;
        }
      }
    }

    if (typeScore > 0) {
      scores.push({ type: type as NodeType, score: typeScore });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Return top 3
  const maxPossibleScore = 10;
  return scores.slice(0, 3).map(({ type, score }) => ({
    type,
    confidence: Math.min(0.95, score / maxPossibleScore),
    reasoning: `Score: ${score.toFixed(2)}`
  }));
}
