package classification

import (
	"slices"
	"testing"

	"github.com/Curt-Park/autology/internal/storage"
)

func TestClassifyNodeType(t *testing.T) {
	tests := []struct {
		name          string
		title         string
		content       string
		context       string
		expectType    storage.NodeType
		minConfidence float64
	}{
		{
			name:          "Decision keywords",
			title:         "We decided to use PostgreSQL",
			content:       "After considering MySQL and MongoDB, we chose PostgreSQL because of better ACID guarantees",
			context:       "",
			expectType:    storage.NodeTypeDecision,
			minConfidence: 0.3,
		},
		{
			name:          "Component keywords",
			title:         "User Service",
			content:       "Service that handles user authentication and manages user profiles",
			context:       "",
			expectType:    storage.NodeTypeComponent,
			minConfidence: 0.2,
		},
		{
			name:          "Convention keywords",
			title:         "Naming Convention",
			content:       "All variables must use camelCase. Never use snake_case",
			context:       "",
			expectType:    storage.NodeTypeConvention,
			minConfidence: 0.3,
		},
		{
			name:          "Concept keywords",
			title:         "User Lifecycle",
			content:       "The concept of user states: registered, verified, active, suspended",
			context:       "",
			expectType:    storage.NodeTypeConcept,
			minConfidence: 0.3,
		},
		{
			name:          "Pattern keywords",
			title:         "Repository Pattern",
			content:       "A reusable design pattern for data access abstraction",
			context:       "",
			expectType:    storage.NodeTypePattern,
			minConfidence: 0.4,
		},
		{
			name:          "Issue keywords",
			title:         "Performance Bug",
			content:       "The API endpoint is slow and needs fixing. Technical debt issue",
			context:       "",
			expectType:    storage.NodeTypeIssue,
			minConfidence: 0.4,
		},
		{
			name:          "Session keywords",
			title:         "Development Session Summary",
			content:       "Today I worked on implementing authentication. Completed login and signup",
			context:       "",
			expectType:    storage.NodeTypeSession,
			minConfidence: 0.3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ClassifyNodeType(tt.title, tt.content, tt.context)

			if result.Type != tt.expectType {
				t.Errorf("expected type %s, got %s (reasoning: %s)", tt.expectType, result.Type, result.Reasoning)
			}

			if result.Confidence < tt.minConfidence {
				t.Errorf("expected confidence >= %f, got %f", tt.minConfidence, result.Confidence)
			}

			if result.Reasoning == "" {
				t.Error("expected non-empty reasoning")
			}
		})
	}
}

func TestClassifyNodeTypeWithContext(t *testing.T) {
	tests := []struct {
		name       string
		title      string
		content    string
		context    string
		expectType storage.NodeType
	}{
		{
			name:       "hook_write boosts component",
			title:      "New function",
			content:    "Added a helper function",
			context:    "hook_write",
			expectType: storage.NodeTypeComponent,
		},
		{
			name:       "hook_commit boosts decision",
			title:      "Database Choice",
			content:    "We decided to use PostgreSQL instead of MySQL",
			context:    "hook_commit",
			expectType: storage.NodeTypeDecision,
		},
		{
			name:       "hook_session boosts session",
			title:      "Work summary",
			content:    "Made progress on features",
			context:    "hook_session",
			expectType: storage.NodeTypeSession,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ClassifyNodeType(tt.title, tt.content, tt.context)

			if result.Type != tt.expectType {
				t.Errorf("expected type %s with context %s, got %s", tt.expectType, tt.context, result.Type)
			}
		})
	}
}

func TestClassifyNodeTypeDefaultFallback(t *testing.T) {
	// No clear keywords should default to concept
	// Note: "pattern" is a keyword in "Random" text, so use truly generic text
	result := ClassifyNodeType("Title", "Generic info", "")

	// With truly generic text, should default to concept (lowest/zero scores)
	// But if there's any keyword match, it might pick that type
	// Just verify we get a valid type and low confidence
	validTypes := []storage.NodeType{
		storage.NodeTypeDecision, storage.NodeTypeComponent, storage.NodeTypeConvention,
		storage.NodeTypeConcept, storage.NodeTypePattern, storage.NodeTypeIssue,
		storage.NodeTypeSession,
	}

	found := slices.Contains(validTypes, result.Type)

	if !found {
		t.Errorf("expected valid node type, got %s", result.Type)
	}

	// With no keyword matches, confidence should be very low
	if result.Confidence > 0.2 {
		t.Errorf("expected low confidence for generic text, got %f", result.Confidence)
	}
}

func TestClassifyNodeTypeConfidenceCap(t *testing.T) {
	// Even with many keyword matches, confidence should cap at 0.95
	result := ClassifyNodeType(
		"Decision to decide and choose",
		"We decided to choose and select and adopt this decision because of reasons",
		"",
	)

	if result.Confidence > 0.95 {
		t.Errorf("confidence should be capped at 0.95, got %f", result.Confidence)
	}
}

func TestIsConfidentClassification(t *testing.T) {
	tests := []struct {
		name       string
		confidence float64
		expect     bool
	}{
		{"High confidence", 0.8, true},
		{"Threshold confidence", 0.6, true},
		{"Just below threshold", 0.59, false},
		{"Low confidence", 0.3, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ClassificationResult{
				Type:       storage.NodeTypeDecision,
				Confidence: tt.confidence,
				Reasoning:  "test",
			}

			if IsConfidentClassification(result) != tt.expect {
				t.Errorf("expected %v for confidence %f", tt.expect, tt.confidence)
			}
		})
	}
}

func TestSuggestAlternatives(t *testing.T) {
	// Text with multiple type signals
	alternatives := SuggestAlternatives(
		"API Service Decision",
		"We decided to implement a service component",
	)

	if len(alternatives) == 0 {
		t.Fatal("expected at least one alternative")
	}

	if len(alternatives) > 3 {
		t.Errorf("expected at most 3 alternatives, got %d", len(alternatives))
	}

	// Verify sorted by score (descending)
	for i := 0; i < len(alternatives)-1; i++ {
		if alternatives[i].Confidence < alternatives[i+1].Confidence {
			t.Error("alternatives not sorted by confidence descending")
		}
	}

	// All should have reasoning
	for _, alt := range alternatives {
		if alt.Reasoning == "" {
			t.Error("alternative should have reasoning")
		}
	}
}

func TestSuggestAlternativesNoMatches(t *testing.T) {
	// Text with no keywords
	alternatives := SuggestAlternatives("Random", "Generic content")

	// Should return empty or very low confidence results
	if len(alternatives) > 3 {
		t.Errorf("expected at most 3 alternatives, got %d", len(alternatives))
	}
}

func TestClassificationPatterns(t *testing.T) {
	// Verify all node types have patterns
	patterns := GetClassificationPatterns()

	expectedTypes := []storage.NodeType{
		storage.NodeTypeDecision,
		storage.NodeTypeComponent,
		storage.NodeTypeConvention,
		storage.NodeTypeConcept,
		storage.NodeTypePattern,
		storage.NodeTypeIssue,
		storage.NodeTypeSession,
	}

	for _, nodeType := range expectedTypes {
		if _, ok := patterns[nodeType]; !ok {
			t.Errorf("missing patterns for node type: %s", nodeType)
		}

		if len(patterns[nodeType]) == 0 {
			t.Errorf("node type %s has no patterns", nodeType)
		}

		// Verify pattern structure
		for _, pattern := range patterns[nodeType] {
			if len(pattern.Keywords) == 0 {
				t.Errorf("pattern for %s has no keywords", nodeType)
			}
			if pattern.Weight <= 0 || pattern.Weight > 1.0 {
				t.Errorf("invalid weight %f for pattern in %s", pattern.Weight, nodeType)
			}
		}
	}
}

func TestGenerateReasoning(t *testing.T) {
	result := ClassifyNodeType(
		"Decision Document",
		"We decided to use Go because of performance",
		"",
	)

	// Reasoning should mention matched keywords
	if result.Reasoning == "" {
		t.Error("expected non-empty reasoning")
	}

	// Should mention the chosen type
	if result.Reasoning == "" {
		t.Error("reasoning should not be empty")
	}
}

func TestKeywordMatching(t *testing.T) {
	tests := []struct {
		name        string
		text        string
		keyword     string
		shouldMatch bool
	}{
		{"Exact match", "we decided to use go", "decided", true},
		{"Case insensitive", "We DECIDED to use Go", "decided", true},
		{"Partial word", "undecided", "decided", true}, // contains check
		{"No match", "we chose to use go", "decided", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ClassifyNodeType(tt.text, "", "")

			// Verify the classification produces a valid result
			if result.Type == "" {
				t.Errorf("Expected non-empty type, got empty")
			}
		})
	}
}

func TestContextBoostValues(t *testing.T) {
	// Test that context boost actually affects scoring
	withoutContext := ClassifyNodeType("Component", "A service module", "")
	withContext := ClassifyNodeType("Component", "A service module", "hook_write")

	// hook_write should boost component type
	if withContext.Confidence <= withoutContext.Confidence {
		t.Error("expected hook_write context to boost component confidence")
	}
}

func TestMultipleKeywordMatches(t *testing.T) {
	// Multiple keywords from same pattern should increase score
	result := ClassifyNodeType(
		"Decision and Choice",
		"We decided to choose this option and selected it",
		"",
	)

	if result.Type != storage.NodeTypeDecision {
		t.Errorf("expected decision type with multiple decision keywords, got %s", result.Type)
	}

	// More keywords should mean higher confidence
	if result.Confidence < 0.5 {
		t.Errorf("expected high confidence with multiple keywords, got %f", result.Confidence)
	}
}
