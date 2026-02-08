package classification

import (
	"github.com/Curt-Park/autology/internal/storage"
)

// ClassificationOptions defines options for node classification
type ClassificationOptions struct {
	Title         string
	Content       string
	SourceContext string             // "hook_write", "hook_commit", "hook_session", "manual"
	UserHint      *storage.NodeType  // User can provide a type hint
	UseLLMFallback bool              // Reserved for future LLM integration
}

// Alternative represents an alternative classification option
type Alternative struct {
	Type       storage.NodeType
	Confidence float64
}

// ClassificationResponse represents the result of classification
type ClassificationResponse struct {
	Type         storage.NodeType
	Confidence   float64
	Reasoning    string
	Alternatives []Alternative
	NeedsReview  bool // True if confidence < 0.6
}

// Classify classifies a node using available methods
func Classify(options ClassificationOptions) ClassificationResponse {
	// If user provides a hint, trust it with high confidence
	if options.UserHint != nil {
		return ClassificationResponse{
			Type:         *options.UserHint,
			Confidence:   0.95,
			Reasoning:    "User-specified type",
			Alternatives: []Alternative{},
			NeedsReview:  false,
		}
	}

	// Use heuristic classification
	heuristicResult := ClassifyNodeType(options.Title, options.Content, options.SourceContext)

	// Check if we're confident enough
	if IsConfidentClassification(heuristicResult) {
		return ClassificationResponse{
			Type:         heuristicResult.Type,
			Confidence:   heuristicResult.Confidence,
			Reasoning:    heuristicResult.Reasoning,
			Alternatives: []Alternative{},
			NeedsReview:  false,
		}
	}

	// Low confidence - provide alternatives
	alternatives := SuggestAlternatives(options.Title, options.Content)

	// Convert to Alternative slice
	altSlice := make([]Alternative, len(alternatives))
	for i, alt := range alternatives {
		altSlice[i] = Alternative{
			Type:       alt.Type,
			Confidence: alt.Confidence,
		}
	}

	// For now, use best heuristic result but mark for review
	// In future, could call LLM here if UseLLMFallback is true
	return ClassificationResponse{
		Type:         heuristicResult.Type,
		Confidence:   heuristicResult.Confidence,
		Reasoning:    heuristicResult.Reasoning + " (low confidence - review recommended)",
		Alternatives: altSlice,
		NeedsReview:  true,
	}
}

// ClassifyBatch classifies multiple nodes in batch
func ClassifyBatch(items []ClassificationOptions) []ClassificationResponse {
	results := make([]ClassificationResponse, len(items))
	for i, item := range items {
		results[i] = Classify(item)
	}
	return results
}

// Reclassify reclassifies an existing node (e.g., after content update)
// Returns nil if the current type should be kept
func Reclassify(currentType storage.NodeType, title, content string) *ClassificationResponse {
	result := Classify(ClassificationOptions{
		Title:   title,
		Content: content,
	})

	// If new classification is significantly different and confident, suggest change
	if result.Type != currentType && result.Confidence >= 0.7 {
		return &result
	}

	// Otherwise, keep current type
	return nil
}
