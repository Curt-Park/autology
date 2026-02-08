package storage

import (
	"math"
	"regexp"
	"strings"
	"time"
)

// SearchEngine provides search functionality for knowledge nodes
type SearchEngine struct {
	nodeStore  *NodeStore
	graphIndex *GraphIndexStore
}

// NewSearchEngine creates a new SearchEngine
func NewSearchEngine(nodeStore *NodeStore, graphIndex *GraphIndexStore) *SearchEngine {
	return &SearchEngine{
		nodeStore:  nodeStore,
		graphIndex: graphIndex,
	}
}

// Search nodes with filtering and ranking
func (se *SearchEngine) Search(filter *NodeFilter, limit int, offset int) ([]SearchResult, error) {
	// Get all nodes matching basic filter
	nodes, err := se.nodeStore.ListNodes(filter)
	if err != nil {
		return nil, err
	}

	// Calculate relevance scores
	results := make([]SearchResult, len(nodes))
	for i, node := range nodes {
		results[i] = SearchResult{
			Node:  node,
			Score: se.calculateRelevance(node, filter),
		}
	}

	// Sort by relevance score (descending)
	for i := 0; i < len(results)-1; i++ {
		for j := i + 1; j < len(results); j++ {
			if results[j].Score > results[i].Score {
				results[i], results[j] = results[j], results[i]
			}
		}
	}

	// Apply pagination
	if offset >= len(results) {
		return []SearchResult{}, nil
	}
	end := offset + limit
	if end > len(results) {
		end = len(results)
	}

	return results[offset:end], nil
}

// FindRelated finds nodes related to a given node
func (se *SearchEngine) FindRelated(nodeID string, maxDepth int) ([]SearchResult, error) {
	visited := make(map[string]bool)
	results := make(map[string]SearchResult)

	err := se.traverseRelations(nodeID, 0, maxDepth, visited, results)
	if err != nil {
		return nil, err
	}

	// Convert to slice and sort by score
	resultSlice := make([]SearchResult, 0, len(results))
	for _, result := range results {
		resultSlice = append(resultSlice, result)
	}

	// Sort by score (descending)
	for i := 0; i < len(resultSlice)-1; i++ {
		for j := i + 1; j < len(resultSlice); j++ {
			if resultSlice[j].Score > resultSlice[i].Score {
				resultSlice[i], resultSlice[j] = resultSlice[j], resultSlice[i]
			}
		}
	}

	return resultSlice, nil
}

// FindByTags finds nodes by tags (intersection or union)
func (se *SearchEngine) FindByTags(tags []string, mode string) ([]SearchResult, error) {
	nodes, err := se.nodeStore.ListNodes(nil)
	if err != nil {
		return nil, err
	}

	results := make([]SearchResult, 0)

	for _, node := range nodes {
		hasMatch := false
		if mode == "all" {
			hasMatch = true
			for _, tag := range tags {
				found := false
				for _, nodeTag := range node.Tags {
					if nodeTag == tag {
						found = true
						break
					}
				}
				if !found {
					hasMatch = false
					break
				}
			}
		} else { // "any" mode
			for _, tag := range tags {
				for _, nodeTag := range node.Tags {
					if nodeTag == tag {
						hasMatch = true
						break
					}
				}
				if hasMatch {
					break
				}
			}
		}

		if hasMatch {
			score := se.calculateTagScore(node.Tags, tags)
			results = append(results, SearchResult{
				Node:  node,
				Score: score,
			})
		}
	}

	// Sort by score (descending)
	for i := 0; i < len(results)-1; i++ {
		for j := i + 1; j < len(results); j++ {
			if results[j].Score > results[i].Score {
				results[i], results[j] = results[j], results[i]
			}
		}
	}

	return results, nil
}

// FullTextSearch performs full-text search across title and content
func (se *SearchEngine) FullTextSearch(query string, limit int) ([]SearchResult, error) {
	nodes, err := se.nodeStore.ListNodes(nil)
	if err != nil {
		return nil, err
	}

	results := make([]SearchResult, 0)
	queryLower := strings.ToLower(query)
	queryTerms := strings.Fields(queryLower)

	for _, node := range nodes {
		score := se.calculateTextScore(node, queryTerms)
		if score > 0 {
			results = append(results, SearchResult{
				Node:  node,
				Score: score,
			})
		}
	}

	// Sort by score (descending)
	for i := 0; i < len(results)-1; i++ {
		for j := i + 1; j < len(results); j++ {
			if results[j].Score > results[i].Score {
				results[i], results[j] = results[j], results[i]
			}
		}
	}

	// Apply limit
	if limit < len(results) {
		results = results[:limit]
	}

	return results, nil
}

// FindByFileReference finds nodes by file references
func (se *SearchEngine) FindByFileReference(filePath string) ([]SearchResult, error) {
	nodes, err := se.nodeStore.ListNodes(nil)
	if err != nil {
		return nil, err
	}

	results := make([]SearchResult, 0)

	for _, node := range nodes {
		for _, ref := range node.References {
			if strings.Contains(ref, filePath) {
				results = append(results, SearchResult{
					Node:  node,
					Score: 1.0,
				})
				break
			}
		}
	}

	return results, nil
}

// calculateRelevance calculates relevance score for a node based on filter
func (se *SearchEngine) calculateRelevance(node KnowledgeNode, filter *NodeFilter) float64 {
	score := node.Confidence // Base score from node confidence

	if filter == nil {
		return score
	}

	// Boost score for exact type match
	if filter.Type != nil && node.Type == *filter.Type {
		score += 0.2
	}

	// Boost for tag matches
	if len(filter.Tags) > 0 {
		tagScore := se.calculateTagScore(node.Tags, filter.Tags)
		score += tagScore * 0.3
	}

	// Boost for search query matches
	if filter.SearchQuery != nil {
		queryTerms := strings.Fields(strings.ToLower(*filter.SearchQuery))
		textScore := se.calculateTextScore(node, queryTerms)
		score += textScore * 0.5
	}

	// Boost for relation matches
	if filter.RelatedTo != nil {
		for _, rel := range node.Relations {
			if rel.Target == *filter.RelatedTo {
				score += 0.3
				break
			}
		}
	}

	// Penalize older nodes (recency bias)
	ageInDays := time.Since(node.Modified).Hours() / 24
	recencyBoost := math.Max(0, 0.2-(ageInDays/365)*0.2) // Decay over a year
	score += recencyBoost

	return math.Min(score, 1.0) // Cap at 1.0
}

// calculateTagScore calculates tag overlap score
func (se *SearchEngine) calculateTagScore(nodeTags []string, searchTags []string) float64 {
	if len(searchTags) == 0 {
		return 0
	}

	matches := 0
	for _, searchTag := range searchTags {
		for _, nodeTag := range nodeTags {
			if nodeTag == searchTag {
				matches++
				break
			}
		}
	}

	return float64(matches) / float64(len(searchTags))
}

// calculateTextScore calculates text match score
func (se *SearchEngine) calculateTextScore(node KnowledgeNode, queryTerms []string) float64 {
	text := strings.ToLower(node.Title + " " + node.Content + " " + strings.Join(node.Tags, " "))
	matches := 0.0

	for _, term := range queryTerms {
		if strings.Contains(text, term) {
			// Count occurrences for term frequency
			re := regexp.MustCompile(regexp.QuoteMeta(term))
			occurrences := len(re.FindAllString(text, -1))
			matches += math.Min(float64(occurrences), 5) / 5 // Cap contribution per term
		}
	}

	if len(queryTerms) == 0 {
		return 0
	}

	return math.Min(matches/float64(len(queryTerms)), 1.0)
}

// traverseRelations traverses relations recursively
func (se *SearchEngine) traverseRelations(
	nodeID string,
	depth int,
	maxDepth int,
	visited map[string]bool,
	results map[string]SearchResult,
) error {
	if depth >= maxDepth || visited[nodeID] {
		return nil
	}

	visited[nodeID] = true

	// Get related nodes
	relatedIDs := se.graphIndex.GetRelatedNodes(nodeID)

	for _, relatedID := range relatedIDs {
		if !visited[relatedID] {
			// Try to load the node
			node, err := se.nodeStore.FindNode(relatedID)
			if err != nil {
				continue // Skip nodes that can't be loaded
			}

			// Calculate score based on depth and confidence
			depthPenalty := math.Pow(0.7, float64(depth)) // Decay with depth
			score := node.Confidence * depthPenalty

			// Keep best score if node already visited
			if existing, ok := results[relatedID]; !ok || score > existing.Score {
				results[relatedID] = SearchResult{
					Node:  node,
					Score: score,
				}
			}

			// Recurse
			err = se.traverseRelations(relatedID, depth+1, maxDepth, visited, results)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
