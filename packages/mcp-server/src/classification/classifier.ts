/**
 * Classification orchestrator
 * Uses heuristics first, falls back to LLM if confidence is too low
 */
import { classifyNodeType, isConfidentClassification, suggestAlternatives } from './heuristics.js';
import type { NodeType } from '../storage/types.js';

export interface ClassificationOptions {
  readonly title: string;
  readonly content: string;
  readonly sourceContext?: 'hook_write' | 'hook_commit' | 'hook_session' | 'manual';
  readonly userHint?: NodeType; // User can provide a hint
  readonly useLLMFallback?: boolean; // Not implemented yet, reserved for future
}

export interface ClassificationResponse {
  readonly type: NodeType;
  readonly confidence: number;
  readonly reasoning: string;
  readonly alternatives?: ReadonlyArray<{
    readonly type: NodeType;
    readonly confidence: number;
  }>;
  readonly needsReview: boolean; // True if confidence < 0.6
}

/**
 * Classify a node using available methods
 */
export function classify(options: ClassificationOptions): ClassificationResponse {
  // If user provides a hint, trust it with high confidence
  if (options.userHint) {
    return {
      type: options.userHint,
      confidence: 0.95,
      reasoning: 'User-specified type',
      needsReview: false
    };
  }

  // Use heuristic classification
  const heuristicResult = classifyNodeType(
    options.title,
    options.content,
    options.sourceContext
  );

  // Check if we're confident enough
  if (isConfidentClassification(heuristicResult)) {
    return {
      type: heuristicResult.type,
      confidence: heuristicResult.confidence,
      reasoning: heuristicResult.reasoning,
      needsReview: false
    };
  }

  // Low confidence - provide alternatives
  const alternatives = suggestAlternatives(options.title, options.content);

  // For now, use best heuristic result but mark for review
  // In future, could call LLM here if useLLMFallback is true
  return {
    type: heuristicResult.type,
    confidence: heuristicResult.confidence,
    reasoning: `${heuristicResult.reasoning} (low confidence - review recommended)`,
    alternatives: alternatives.map(a => ({
      type: a.type,
      confidence: a.confidence
    })),
    needsReview: true
  };
}

/**
 * Batch classify multiple nodes
 */
export function classifyBatch(
  items: ReadonlyArray<Omit<ClassificationOptions, 'useLLMFallback'>>
): ReadonlyArray<ClassificationResponse> {
  return items.map(item => classify(item));
}

/**
 * Re-classify existing node (e.g., after content update)
 */
export function reclassify(
  currentType: NodeType,
  title: string,
  content: string
): ClassificationResponse | null {
  const result = classify({ title, content });

  // If new classification is significantly different and confident, suggest change
  if (result.type !== currentType && result.confidence >= 0.7) {
    return result;
  }

  // Otherwise, keep current type
  return null;
}
