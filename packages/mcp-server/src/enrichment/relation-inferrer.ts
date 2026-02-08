/**
 * Automatic relation inference between nodes
 * Discovers potential relationships based on content analysis
 */
import type { KnowledgeNode, RelationType } from '../storage/types.js';

export interface InferredRelation {
  readonly source: string;
  readonly target: string;
  readonly type: RelationType;
  readonly confidence: number;
  readonly reasoning: string;
}

/**
 * Infer relations for a new node based on existing nodes
 */
export function inferRelations(
  newNode: KnowledgeNode,
  existingNodes: ReadonlyArray<KnowledgeNode>
): ReadonlyArray<InferredRelation> {
  const inferred: InferredRelation[] = [];

  for (const existing of existingNodes) {
    // Skip self
    if (existing.id === newNode.id) continue;

    // Check various relation signals
    const tagOverlap = calculateTagOverlap(newNode.tags, existing.tags);
    const fileOverlap = calculateFileOverlap(newNode.references, existing.references);
    const sameSession = !!(newNode.session && newNode.session === existing.session && newNode.session.length > 0);
    const titleSimilarity = calculateTitleSimilarity(newNode.title, existing.title);

    // Infer specific relation types
    const relation = inferSpecificRelation(newNode, existing, {
      tagOverlap,
      fileOverlap,
      sameSession,
      titleSimilarity
    });

    if (relation) {
      inferred.push(relation);
    }
  }

  // Sort by confidence descending
  inferred.sort((a, b) => b.confidence - a.confidence);

  return inferred;
}

interface RelationSignals {
  readonly tagOverlap: number;
  readonly fileOverlap: number;
  readonly sameSession: boolean;
  readonly titleSimilarity: number;
}

/**
 * Infer specific relation type based on signals
 */
function inferSpecificRelation(
  source: KnowledgeNode,
  target: KnowledgeNode,
  signals: RelationSignals
): InferredRelation | null {
  // Rule 1: Decision affects component
  if (source.type === 'decision' && target.type === 'component') {
    if (signals.tagOverlap > 0.3 || signals.fileOverlap > 0) {
      return {
        source: source.id,
        target: target.id,
        type: 'affects',
        confidence: 0.7 + signals.tagOverlap * 0.2,
        reasoning: `Decision affects component (tag overlap: ${(signals.tagOverlap * 100).toFixed(0)}%)`
      };
    }
  }

  // Rule 2: Component uses pattern
  if (source.type === 'component' && target.type === 'pattern') {
    if (signals.tagOverlap > 0.4 || containsPatternReference(source.content, target.title)) {
      return {
        source: source.id,
        target: target.id,
        type: 'implements',
        confidence: 0.75,
        reasoning: 'Component implements pattern'
      };
    }
  }

  // Rule 3: Component uses another component
  if (source.type === 'component' && target.type === 'component') {
    if (signals.fileOverlap > 0) {
      return {
        source: source.id,
        target: target.id,
        type: 'uses',
        confidence: 0.8,
        reasoning: `Shared file references: ${signals.fileOverlap} file(s)`
      };
    }
  }

  // Rule 4: Decision supersedes decision
  if (source.type === 'decision' && target.type === 'decision') {
    if (containsSupersession(source.content, target.title) || containsSupersession(source.title, target.title)) {
      return {
        source: source.id,
        target: target.id,
        type: 'supersedes',
        confidence: 0.85,
        reasoning: 'Decision supersedes previous decision'
      };
    }
  }

  // Rule 5: Convention applies to component
  if (source.type === 'convention' && target.type === 'component') {
    if (signals.tagOverlap > 0.3) {
      return {
        source: source.id,
        target: target.id,
        type: 'relates_to',
        confidence: 0.65,
        reasoning: 'Convention relates to component'
      };
    }
  }

  // Rule 6: Same session relations (weak)
  if (signals.sameSession && signals.tagOverlap > 0.2) {
    return {
      source: source.id,
      target: target.id,
      type: 'relates_to',
      confidence: 0.6,
      reasoning: 'Created in same session with shared tags'
    };
  }

  // Rule 7: High tag overlap (generic)
  if (signals.tagOverlap > 0.5) {
    return {
      source: source.id,
      target: target.id,
      type: 'relates_to',
      confidence: 0.55 + signals.tagOverlap * 0.15,
      reasoning: `High tag overlap: ${(signals.tagOverlap * 100).toFixed(0)}%`
    };
  }

  return null;
}

/**
 * Calculate tag overlap ratio
 */
function calculateTagOverlap(
  tags1: ReadonlyArray<string>,
  tags2: ReadonlyArray<string>
): number {
  if (tags1.length === 0 || tags2.length === 0) return 0;

  const set1 = new Set(tags1.map(t => t.toLowerCase()));
  const set2 = new Set(tags2.map(t => t.toLowerCase()));

  const intersection = new Set([...set1].filter(t => set2.has(t)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Calculate file reference overlap
 */
function calculateFileOverlap(
  refs1: ReadonlyArray<string>,
  refs2: ReadonlyArray<string>
): number {
  if (refs1.length === 0 || refs2.length === 0) return 0;

  const set1 = new Set(refs1);
  const set2 = new Set(refs2);

  return [...set1].filter(r => set2.has(r)).length;
}

/**
 * Calculate title similarity (simple word overlap)
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const words1 = new Set(title1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(title2.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Check if content references a pattern name
 */
function containsPatternReference(content: string, patternName: string): boolean {
  const contentLower = content.toLowerCase();
  const patternLower = patternName.toLowerCase();

  return contentLower.includes(patternLower) ||
         contentLower.includes(patternLower.replace(' pattern', '')) ||
         contentLower.includes(patternLower.replace('-', ' '));
}

/**
 * Check if content indicates supersession
 */
function containsSupersession(content: string, targetTitle: string): boolean {
  const contentLower = content.toLowerCase();
  const targetLower = targetTitle.toLowerCase();

  const supersessionKeywords = [
    'supersedes', 'replaces', 'instead of', 'rather than',
    'deprecates', 'obsoletes', 'upgrades from'
  ];

  for (const keyword of supersessionKeywords) {
    if (contentLower.includes(keyword) && contentLower.includes(targetLower)) {
      return true;
    }
  }

  return false;
}

/**
 * Filter inferred relations by confidence threshold
 */
export function filterByConfidence(
  relations: ReadonlyArray<InferredRelation>,
  minConfidence: number
): ReadonlyArray<InferredRelation> {
  return relations.filter(r => r.confidence >= minConfidence);
}

/**
 * Group inferred relations by action
 */
export function groupByAction(
  relations: ReadonlyArray<InferredRelation>,
  autoCreateThreshold: number = 0.7
): {
  readonly autoCreate: ReadonlyArray<InferredRelation>;
  readonly suggest: ReadonlyArray<InferredRelation>;
} {
  const autoCreate: InferredRelation[] = [];
  const suggest: InferredRelation[] = [];

  for (const relation of relations) {
    if (relation.confidence >= autoCreateThreshold) {
      autoCreate.push(relation);
    } else {
      suggest.push(relation);
    }
  }

  return { autoCreate, suggest };
}
