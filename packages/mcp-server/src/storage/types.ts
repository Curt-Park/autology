/**
 * Core type definitions for autology knowledge nodes
 * All types use Readonly<> for immutability
 */

export const NODE_TYPES = [
  'decision',
  'component',
  'convention',
  'concept',
  'session',
  'pattern',
  'issue'
] as const;

export type NodeType = typeof NODE_TYPES[number];

export const NODE_STATUSES = ['active', 'needs_review', 'superseded'] as const;
export type NodeStatus = typeof NODE_STATUSES[number];

export const RELATION_TYPES = [
  'affects',
  'uses',
  'supersedes',
  'relates_to',
  'implements',
  'depends_on',
  'derived_from'
] as const;

export type RelationType = typeof RELATION_TYPES[number];

export interface Relation {
  readonly type: RelationType;
  readonly target: string; // target node ID
  readonly description?: string | undefined;
  readonly confidence: number; // 0.0 to 1.0
}

export interface KnowledgeNode {
  readonly id: string;
  readonly type: NodeType;
  readonly title: string;
  readonly content: string;
  readonly tags: ReadonlyArray<string>;
  readonly relations: ReadonlyArray<Relation>;
  readonly confidence: number; // 0.0 to 1.0
  readonly created: string; // ISO 8601 timestamp
  readonly modified: string; // ISO 8601 timestamp
  readonly session?: string | undefined; // session ID
  readonly source: 'manual' | 'hook_write' | 'hook_commit' | 'hook_session';
  readonly references: ReadonlyArray<string>; // file paths referenced by this node
  readonly status: NodeStatus;
}

export interface GraphIndex {
  readonly version: string;
  readonly lastUpdated: string; // ISO 8601 timestamp
  readonly relations: ReadonlyArray<{
    readonly source: string;
    readonly target: string;
    readonly type: RelationType;
    readonly description?: string | undefined;
    readonly confidence: number;
  }>;
}

export interface NodeFilter {
  readonly type?: NodeType | undefined;
  readonly tags?: ReadonlyArray<string> | undefined;
  readonly status?: NodeStatus | undefined;
  readonly minConfidence?: number | undefined;
  readonly relatedTo?: string | undefined; // node ID
  readonly searchQuery?: string | undefined;
}

export interface SearchResult {
  readonly node: KnowledgeNode;
  readonly score: number; // relevance score 0.0 to 1.0
}

/**
 * Helper to create a new node with defaults
 */
export function createKnowledgeNode(
  partial: Pick<KnowledgeNode, 'id' | 'type' | 'title' | 'content'> &
    Partial<Omit<KnowledgeNode, 'id' | 'type' | 'title' | 'content' | 'created' | 'modified'>>
): KnowledgeNode {
  const now = new Date().toISOString();
  return {
    tags: [],
    relations: [],
    confidence: 0.8,
    source: 'manual',
    references: [],
    status: 'active',
    ...partial,
    created: now,
    modified: now
  };
}

/**
 * Helper to update a node immutably
 */
export function updateKnowledgeNode(
  node: KnowledgeNode,
  updates: Partial<Omit<KnowledgeNode, 'id' | 'created'>>
): KnowledgeNode {
  return {
    ...node,
    ...updates,
    modified: new Date().toISOString()
  };
}
