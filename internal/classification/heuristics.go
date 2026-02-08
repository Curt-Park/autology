package classification

import (
	"fmt"
	"math"
	"strings"

	"github.com/Curt-Park/autology/internal/storage"
)

// ClassificationResult represents the result of node type classification
type ClassificationResult struct {
	Type       storage.NodeType
	Confidence float64
	Reasoning  string
}

// Pattern represents a keyword pattern for classification
type Pattern struct {
	Keywords []string
	Weight   float64
}

// Classification patterns for each node type
var classificationPatterns = map[storage.NodeType][]Pattern{
	storage.NodeTypeDecision: {
		{Keywords: []string{"chose", "choose", "decided", "decide", "selected", "select"}, Weight: 1.0},
		{Keywords: []string{"decision", "choice", "selection"}, Weight: 0.9},
		{Keywords: []string{"adopt", "use", "switch to", "move to"}, Weight: 0.8},
		{Keywords: []string{"instead of", "over", "rather than", "vs"}, Weight: 0.7},
		{Keywords: []string{"because", "since", "reason", "rationale"}, Weight: 0.6},
		{Keywords: []string{"alternative", "option", "considered"}, Weight: 0.5},
	},
	storage.NodeTypeComponent: {
		{Keywords: []string{"service", "module", "class", "function", "method"}, Weight: 1.0},
		{Keywords: []string{"component", "controller", "model", "view"}, Weight: 0.9},
		{Keywords: []string{"handles", "manages", "implements", "provides"}, Weight: 0.8},
		{Keywords: []string{"api", "endpoint", "route", "handler"}, Weight: 0.7},
		{Keywords: []string{"created", "built", "implemented"}, Weight: 0.6},
	},
	storage.NodeTypeConvention: {
		{Keywords: []string{"always", "never", "must", "should", "shall"}, Weight: 1.0},
		{Keywords: []string{"convention", "standard", "practice", "guideline"}, Weight: 0.9},
		{Keywords: []string{"rule", "policy", "requirement"}, Weight: 0.8},
		{Keywords: []string{"style", "format", "naming", "pattern"}, Weight: 0.7},
		{Keywords: []string{"all", "every", "each", "any"}, Weight: 0.6},
	},
	storage.NodeTypeConcept: {
		{Keywords: []string{"concept", "idea", "notion", "model"}, Weight: 1.0},
		{Keywords: []string{"represents", "means", "refers to", "is"}, Weight: 0.9},
		{Keywords: []string{"lifecycle", "workflow", "process", "flow"}, Weight: 0.8},
		{Keywords: []string{"state", "status", "phase", "stage"}, Weight: 0.7},
		{Keywords: []string{"domain", "business", "entity"}, Weight: 0.6},
	},
	storage.NodeTypePattern: {
		{Keywords: []string{"pattern", "approach", "strategy", "technique"}, Weight: 1.0},
		{Keywords: []string{"reusable", "generic", "abstract", "common"}, Weight: 0.9},
		{Keywords: []string{"design pattern", "architectural pattern"}, Weight: 0.95},
		{Keywords: []string{"factory", "singleton", "observer", "repository"}, Weight: 0.8},
		{Keywords: []string{"template", "blueprint", "recipe"}, Weight: 0.7},
	},
	storage.NodeTypeIssue: {
		{Keywords: []string{"issue", "problem", "bug", "error", "defect"}, Weight: 1.0},
		{Keywords: []string{"broken", "failing", "not working"}, Weight: 0.9},
		{Keywords: []string{"debt", "technical debt", "todo", "fixme"}, Weight: 0.8},
		{Keywords: []string{"bottleneck", "performance", "slow"}, Weight: 0.7},
		{Keywords: []string{"needs fix", "needs refactor", "improvement needed"}, Weight: 0.6},
	},
	storage.NodeTypeSession: {
		{Keywords: []string{"session", "worked on", "accomplished", "completed"}, Weight: 1.0},
		{Keywords: []string{"today", "this session", "summary"}, Weight: 0.9},
		{Keywords: []string{"implemented", "fixed", "added", "updated"}, Weight: 0.7},
		{Keywords: []string{"progress", "status update"}, Weight: 0.6},
	},
}

// Context-based score boosting
var contextBoost = map[string]map[storage.NodeType]float64{
	"hook_write": {
		storage.NodeTypeComponent:  0.3,
		storage.NodeTypeConvention: 0.2,
	},
	"hook_commit": {
		storage.NodeTypeDecision: 0.3,
		storage.NodeTypeIssue:    0.2,
	},
	"hook_session": {
		storage.NodeTypeSession: 0.5,
	},
	"manual": {},
}

// ClassifyNodeType classifies a node based on title and content
func ClassifyNodeType(title, content, sourceContext string) ClassificationResult {
	text := strings.ToLower(title + " " + content)

	// Get context boost
	boost := contextBoost[sourceContext]
	if boost == nil {
		boost = contextBoost["manual"]
	}

	// Score each type
	scores := make(map[storage.NodeType]float64)
	for _, nodeType := range storage.NodeTypes {
		scores[nodeType] = 0
	}

	for nodeType, patterns := range classificationPatterns {
		typeScore := 0.0

		for _, pattern := range patterns {
			for _, keyword := range pattern.Keywords {
				if strings.Contains(text, keyword) {
					typeScore += pattern.Weight
				}
			}
		}

		// Apply context boost
		if boostAmount, ok := boost[nodeType]; ok {
			typeScore += boostAmount
		}

		scores[nodeType] = typeScore
	}

	// Find best match
	bestType := storage.NodeTypeConcept // Default fallback
	bestScore := 0.0

	for nodeType, score := range scores {
		if score > bestScore {
			bestScore = score
			bestType = nodeType
		}
	}

	// Normalize confidence (cap at 0.95 for heuristics)
	maxPossibleScore := 10.0 // Rough estimate
	confidence := math.Min(0.95, bestScore/maxPossibleScore)

	// Generate reasoning
	reasoning := generateReasoning(bestType, text, scores)

	return ClassificationResult{
		Type:       bestType,
		Confidence: confidence,
		Reasoning:  reasoning,
	}
}

// generateReasoning creates human-readable reasoning for the classification
func generateReasoning(chosenType storage.NodeType, text string, scores map[storage.NodeType]float64) string {
	patterns := classificationPatterns[chosenType]
	matchedKeywords := make([]string, 0, 3)

	for _, pattern := range patterns {
		for _, keyword := range pattern.Keywords {
			if strings.Contains(text, keyword) {
				matchedKeywords = append(matchedKeywords, keyword)
				if len(matchedKeywords) >= 3 {
					break
				}
			}
		}
		if len(matchedKeywords) >= 3 {
			break
		}
	}

	// Find top alternative scores
	type scoreEntry struct {
		nodeType storage.NodeType
		score    float64
	}

	alternatives := make([]scoreEntry, 0)
	for nodeType, score := range scores {
		if nodeType != chosenType {
			alternatives = append(alternatives, scoreEntry{nodeType, score})
		}
	}

	// Sort alternatives by score descending
	for i := 0; i < len(alternatives)-1; i++ {
		for j := i + 1; j < len(alternatives); j++ {
			if alternatives[j].score > alternatives[i].score {
				alternatives[i], alternatives[j] = alternatives[j], alternatives[i]
			}
		}
	}

	reasoning := fmt.Sprintf("Classified as '%s' based on keywords: %s",
		chosenType, strings.Join(matchedKeywords, ", "))

	if len(alternatives) > 0 && alternatives[0].score > scores[chosenType]*0.7 {
		reasoning += fmt.Sprintf(". Also considered '%s' (score: %.2f)",
			alternatives[0].nodeType, alternatives[0].score)
	}

	return reasoning
}

// IsConfidentClassification checks if classification confidence is sufficient
func IsConfidentClassification(result ClassificationResult) bool {
	return result.Confidence >= 0.6
}

// SuggestAlternatives suggests alternative node types with their scores
func SuggestAlternatives(title, content string) []ClassificationResult {
	text := strings.ToLower(title + " " + content)

	type scoreEntry struct {
		nodeType storage.NodeType
		score    float64
	}

	scores := make([]scoreEntry, 0)

	for nodeType, patterns := range classificationPatterns {
		typeScore := 0.0

		for _, pattern := range patterns {
			for _, keyword := range pattern.Keywords {
				if strings.Contains(text, keyword) {
					typeScore += pattern.Weight
				}
			}
		}

		if typeScore > 0 {
			scores = append(scores, scoreEntry{nodeType, typeScore})
		}
	}

	// Sort by score descending
	for i := 0; i < len(scores)-1; i++ {
		for j := i + 1; j < len(scores); j++ {
			if scores[j].score > scores[i].score {
				scores[i], scores[j] = scores[j], scores[i]
			}
		}
	}

	// Return top 3
	maxPossibleScore := 10.0
	results := make([]ClassificationResult, 0, 3)

	limit := 3
	if len(scores) < limit {
		limit = len(scores)
	}

	for i := 0; i < limit; i++ {
		results = append(results, ClassificationResult{
			Type:       scores[i].nodeType,
			Confidence: math.Min(0.95, scores[i].score/maxPossibleScore),
			Reasoning:  fmt.Sprintf("Score: %.2f", scores[i].score),
		})
	}

	return results
}

// GetClassificationPatterns returns the classification patterns (for testing)
func GetClassificationPatterns() map[storage.NodeType][]Pattern {
	return classificationPatterns
}
