package enrichment

import (
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/Curt-Park/autology/internal/storage"
)

// ContextSignals provides signals about the current working context
type ContextSignals struct {
	CurrentFile *string
	CurrentTask *string
	RecentFiles []string
}

// ScoredNode represents a node with its relevance score
type ScoredNode struct {
	Node    storage.KnowledgeNode
	Score   float64
	Reasons []string
}

// ScoreNodesForContext scores nodes based on relevance to current context
func ScoreNodesForContext(nodes []storage.KnowledgeNode, signals ContextSignals) []ScoredNode {
	scored := make([]ScoredNode, 0)

	for _, node := range nodes {
		result := scoreNode(node, signals)
		if result.Score > 0 {
			scored = append(scored, result)
		}
	}

	// Sort by score descending
	for i := 0; i < len(scored)-1; i++ {
		for j := i + 1; j < len(scored); j++ {
			if scored[j].Score > scored[i].Score {
				scored[i], scored[j] = scored[j], scored[i]
			}
		}
	}

	return scored
}

// scoreNode scores a single node
func scoreNode(node storage.KnowledgeNode, signals ContextSignals) ScoredNode {
	score := 0.0
	reasons := make([]string, 0)

	// 1. Current file exact match (highest priority)
	if signals.CurrentFile != nil {
		for _, ref := range node.References {
			if ref == *signals.CurrentFile {
				score += 1.0
				reasons = append(reasons, "References current file")
				break
			}
		}
	}

	// 2. Current file partial match (directory or filename similarity)
	if signals.CurrentFile != nil {
		for _, ref := range node.References {
			if filesAreSimilar(*signals.CurrentFile, ref) {
				score += 0.6
				reasons = append(reasons, "References similar file")
				break
			}
		}
	}

	// 3. Recent files match
	if len(signals.RecentFiles) > 0 {
		matchCount := 0
		for _, recentFile := range signals.RecentFiles {
			for _, ref := range node.References {
				if ref == recentFile {
					matchCount++
					break
				}
			}
		}
		if matchCount > 0 {
			score += 0.4 * math.Min(float64(matchCount)/float64(len(signals.RecentFiles)), 1.0)
			reasons = append(reasons, fmt.Sprintf("References %d recent file(s)", matchCount))
		}
	}

	// 4. Task description match
	if signals.CurrentTask != nil {
		taskWords := extractKeywords(*signals.CurrentTask)
		nodeText := node.Title + " " + node.Content + " " + strings.Join(node.Tags, " ")
		matchScore := calculateKeywordMatch(taskWords, nodeText)

		if matchScore > 0.3 {
			score += matchScore * 0.8
			reasons = append(reasons, fmt.Sprintf("Matches task keywords (%.0f%%)", matchScore*100))
		}
	}

	// 5. Node type weighting
	typeWeights := map[storage.NodeType]float64{
		storage.NodeTypeDecision:   0.3,
		storage.NodeTypeConvention: 0.25,
		storage.NodeTypeComponent:  0.2,
		storage.NodeTypeConcept:    0.15,
		storage.NodeTypePattern:    0.2,
		storage.NodeTypeIssue:      0.1,
		storage.NodeTypeSession:    0.05,
	}

	if weight, ok := typeWeights[node.Type]; ok {
		score += weight
	} else {
		score += 0.1
	}

	// 6. Confidence boost
	score += node.Confidence * 0.2

	// 7. Recency boost (favor recently modified)
	ageInDays := time.Since(node.Modified).Hours() / 24
	recencyScore := math.Max(0, 0.3-(ageInDays/30)*0.1)
	score += recencyScore
	if recencyScore > 0.1 {
		reasons = append(reasons, "Recently modified")
	}

	// 8. Status penalty
	if node.Status == storage.NodeStatusSuperseded {
		score *= 0.3 // Heavily penalize superseded nodes
		reasons = append(reasons, "Superseded (low priority)")
	} else if node.Status == storage.NodeStatusNeedsReview {
		score *= 0.8 // Slightly penalize nodes needing review
	}

	// 9. Relation density boost (well-connected nodes are more important)
	if len(node.Relations) > 3 {
		score += 0.15
		reasons = append(reasons, fmt.Sprintf("Well-connected (%d relations)", len(node.Relations)))
	}

	return ScoredNode{
		Node:    node,
		Score:   score,
		Reasons: reasons,
	}
}

// filesAreSimilar checks if two file paths are similar
func filesAreSimilar(file1, file2 string) bool {
	// Same directory
	lastSlash1 := strings.LastIndex(file1, "/")
	lastSlash2 := strings.LastIndex(file2, "/")

	if lastSlash1 >= 0 && lastSlash2 >= 0 {
		dir1 := file1[:lastSlash1]
		dir2 := file2[:lastSlash2]

		if dir1 == dir2 && len(dir1) > 0 {
			return true
		}
	}

	// Similar filename
	name1 := file1
	if lastSlash1 >= 0 {
		name1 = file1[lastSlash1+1:]
	}
	// Remove extension
	if dotIdx := strings.LastIndex(name1, "."); dotIdx >= 0 {
		name1 = name1[:dotIdx]
	}

	name2 := file2
	if lastSlash2 >= 0 {
		name2 = file2[lastSlash2+1:]
	}
	// Remove extension
	if dotIdx := strings.LastIndex(name2, "."); dotIdx >= 0 {
		name2 = name2[:dotIdx]
	}

	if name1 == name2 {
		return true
	}

	// Related names (e.g., test file and source file)
	if strings.Contains(name1, name2) || strings.Contains(name2, name1) {
		return true
	}

	return false
}

// extractKeywords extracts keywords from text
func extractKeywords(text string) []string {
	words := strings.Fields(strings.ToLower(text))

	// Filter and deduplicate
	seen := make(map[string]bool)
	keywords := make([]string, 0)

	for _, word := range words {
		if len(word) > 3 && !isStopWord(word) && !seen[word] {
			keywords = append(keywords, word)
			seen[word] = true
		}
	}

	return keywords
}

// calculateKeywordMatch calculates keyword match score
func calculateKeywordMatch(keywords []string, text string) float64 {
	if len(keywords) == 0 {
		return 0
	}

	textLower := strings.ToLower(text)
	matches := 0

	for _, keyword := range keywords {
		if strings.Contains(textLower, keyword) {
			matches++
		}
	}

	return float64(matches) / float64(len(keywords))
}

// isStopWord checks if a word is a stop word
func isStopWord(word string) bool {
	stopWords := map[string]bool{
		"the":    true,
		"is":     true,
		"at":     true,
		"which":  true,
		"on":     true,
		"in":     true,
		"to":     true,
		"for":    true,
		"of":     true,
		"and":    true,
		"or":     true,
		"but":    true,
		"with":   true,
		"from":   true,
		"this":   true,
		"that":   true,
		"these":  true,
		"those":  true,
		"will":   true,
		"would":  true,
		"should": true,
		"could":  true,
		"can":    true,
		"may":    true,
	}

	return stopWords[word]
}

// RelevanceGroups represents nodes grouped by relevance
type RelevanceGroups struct {
	High   []ScoredNode
	Medium []ScoredNode
	Low    []ScoredNode
}

// GroupByRelevance groups scored nodes by relevance tier
func GroupByRelevance(scoredNodes []ScoredNode) RelevanceGroups {
	high := make([]ScoredNode, 0)
	medium := make([]ScoredNode, 0)
	low := make([]ScoredNode, 0)

	for _, scored := range scoredNodes {
		if scored.Score >= 1.0 {
			high = append(high, scored)
		} else if scored.Score >= 0.5 {
			medium = append(medium, scored)
		} else {
			low = append(low, scored)
		}
	}

	return RelevanceGroups{
		High:   high,
		Medium: medium,
		Low:    low,
	}
}

// FormatContextResults formats scored nodes for display
func FormatContextResults(scoredNodes []ScoredNode, limit int) string {
	if len(scoredNodes) == 0 {
		return "No relevant context found for current task."
	}

	// Apply limit
	limited := scoredNodes
	if limit < len(scoredNodes) {
		limited = scoredNodes[:limit]
	}

	lines := make([]string, 0)

	for _, scored := range limited {
		lines = append(lines, "")
		lines = append(lines, fmt.Sprintf("## %s", scored.Node.Title))
		lines = append(lines, fmt.Sprintf("**Type**: %s | **Relevance**: %.0f%%",
			scored.Node.Type, scored.Score*100))
		lines = append(lines, fmt.Sprintf("**Why**: %s", strings.Join(scored.Reasons, ", ")))

		if len(scored.Node.Tags) > 0 {
			lines = append(lines, fmt.Sprintf("**Tags**: %s", strings.Join(scored.Node.Tags, ", ")))
		}

		// Show preview
		preview := scored.Node.Content
		if len(preview) > 200 {
			preview = preview[:200]
		}
		preview = strings.ReplaceAll(preview, "\n", " ")

		suffix := ""
		if len(scored.Node.Content) > 200 {
			suffix = "..."
		}

		lines = append(lines, "")
		lines = append(lines, preview+suffix)
		lines = append(lines, "")
	}

	return strings.Join(lines, "\n")
}
