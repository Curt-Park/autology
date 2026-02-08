/**
 * Search engine for knowledge nodes
 * Supports text search, tag filtering, type filtering, and relation-based traversal
 */
import type { KnowledgeNode, NodeFilter, SearchResult } from './types.js';
import type { NodeStore } from './node-store.js';
import type { GraphIndexStore } from './graph-index.js';

export class SearchEngine {
  constructor(
    private readonly nodeStore: NodeStore,
    private readonly graphIndex: GraphIndexStore,
  ) {}

  /**
   * Search nodes with filtering and ranking
   */
  async search(
    filter?: NodeFilter,
    limit: number = 50,
    offset: number = 0,
  ): Promise<SearchResult[]> {
    // Get all nodes matching basic filter
    const nodes = await this.nodeStore.listNodes(filter);

    // Calculate relevance scores
    const results: SearchResult[] = nodes.map((node) => ({
      node,
      score: this.calculateRelevance(node, filter),
    }));

    // Sort by relevance score (descending)
    results.sort((a, b) => b.score - a.score);

    // Apply pagination
    return results.slice(offset, offset + limit);
  }

  /**
   * Find nodes related to a given node
   */
  async findRelated(nodeId: string, maxDepth: number = 2): Promise<SearchResult[]> {
    const visited = new Set<string>();
    const results: Map<string, SearchResult> = new Map();

    await this.traverseRelations(nodeId, 0, maxDepth, visited, results);

    // Convert to array and sort by score
    return Array.from(results.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * Find nodes by tags (intersection or union)
   */
  async findByTags(tags: string[], mode: 'all' | 'any' = 'all'): Promise<SearchResult[]> {
    const nodes = await this.nodeStore.listNodes();
    const results: SearchResult[] = [];

    for (const node of nodes) {
      const hasMatch =
        mode === 'all'
          ? tags.every((tag) => node.tags.includes(tag))
          : tags.some((tag) => node.tags.includes(tag));

      if (hasMatch) {
        const score = this.calculateTagScore(node.tags, tags);
        results.push({ node, score });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Full-text search across title and content
   */
  async fullTextSearch(query: string, limit: number = 50): Promise<SearchResult[]> {
    const nodes = await this.nodeStore.listNodes();
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 0);

    for (const node of nodes) {
      const score = this.calculateTextScore(node, queryTerms);
      if (score > 0) {
        results.push({ node, score });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Get nodes by file references
   */
  async findByFileReference(filePath: string): Promise<SearchResult[]> {
    const nodes = await this.nodeStore.listNodes();
    const results: SearchResult[] = [];

    for (const node of nodes) {
      if (node.references.some((ref) => ref.includes(filePath))) {
        results.push({ node, score: 1.0 });
      }
    }

    return results;
  }

  /**
   * Calculate relevance score for a node based on filter
   */
  private calculateRelevance(node: KnowledgeNode, filter?: NodeFilter): number {
    let score = node.confidence; // Base score from node confidence

    if (!filter) {
      return score;
    }

    // Boost score for exact type match
    if (filter.type && node.type === filter.type) {
      score += 0.2;
    }

    // Boost for tag matches
    if (filter.tags && filter.tags.length > 0) {
      const tagScore = this.calculateTagScore(node.tags, filter.tags);
      score += tagScore * 0.3;
    }

    // Boost for search query matches
    if (filter.searchQuery) {
      const queryTerms = filter.searchQuery.toLowerCase().split(/\s+/);
      const textScore = this.calculateTextScore(node, queryTerms);
      score += textScore * 0.5;
    }

    // Boost for relation matches
    if (filter.relatedTo) {
      const hasRelation = node.relations.some((r) => r.target === filter.relatedTo);
      if (hasRelation) {
        score += 0.3;
      }
    }

    // Penalize older nodes (recency bias)
    const ageInDays = (Date.now() - new Date(node.modified).getTime()) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.max(0, 0.2 - (ageInDays / 365) * 0.2); // Decay over a year
    score += recencyBoost;

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Calculate tag overlap score
   */
  private calculateTagScore(nodeTags: readonly string[], searchTags: readonly string[]): number {
    if (searchTags.length === 0) {
      return 0;
    }

    const matches = searchTags.filter((tag) => nodeTags.includes(tag)).length;
    return matches / searchTags.length;
  }

  /**
   * Calculate text match score
   */
  private calculateTextScore(node: KnowledgeNode, queryTerms: string[]): number {
    const text = `${node.title} ${node.content} ${node.tags.join(' ')}`.toLowerCase();
    let matches = 0;

    for (const term of queryTerms) {
      if (text.includes(term)) {
        // Count occurrences for term frequency
        const occurrences = (text.match(new RegExp(term, 'g')) || []).length;
        matches += Math.min(occurrences, 5) / 5; // Cap contribution per term
      }
    }

    return Math.min(matches / queryTerms.length, 1.0);
  }

  /**
   * Traverse relations recursively
   */
  private async traverseRelations(
    nodeId: string,
    depth: number,
    maxDepth: number,
    visited: Set<string>,
    results: Map<string, SearchResult>,
  ): Promise<void> {
    if (depth >= maxDepth || visited.has(nodeId)) {
      return;
    }

    visited.add(nodeId);

    // Get related nodes
    const relatedIds = this.graphIndex.getRelatedNodes(nodeId);

    for (const relatedId of relatedIds) {
      if (!visited.has(relatedId)) {
        // Try to load the node
        const node = await this.nodeStore.findNode(relatedId);
        if (node) {
          // Calculate score based on depth and confidence
          const depthPenalty = Math.pow(0.7, depth); // Decay with depth
          const score = node.confidence * depthPenalty;

          // Keep best score if node already visited
          const existing = results.get(relatedId);
          if (!existing || score > existing.score) {
            results.set(relatedId, { node, score });
          }

          // Recurse
          await this.traverseRelations(relatedId, depth + 1, maxDepth, visited, results);
        }
      }
    }
  }
}
