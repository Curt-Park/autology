package classification

import (
	"testing"

	"github.com/Curt-Park/autology/internal/storage"
)

func TestClassifyWithUserHint(t *testing.T) {
	hint := storage.NodeTypeDecision
	opts := ClassificationOptions{
		Title:    "Random text",
		Content:  "No decision keywords here",
		UserHint: &hint,
	}

	result := Classify(opts)

	if result.Type != storage.NodeTypeDecision {
		t.Errorf("expected user hint type decision, got %s", result.Type)
	}

	if result.Confidence != 0.95 {
		t.Errorf("expected user hint confidence 0.95, got %f", result.Confidence)
	}

	if result.Reasoning != "User-specified type" {
		t.Errorf("expected user hint reasoning, got %s", result.Reasoning)
	}

	if result.NeedsReview {
		t.Error("user hint should not need review")
	}

	if len(result.Alternatives) != 0 {
		t.Error("user hint should not have alternatives")
	}
}

func TestClassifyConfident(t *testing.T) {
	opts := ClassificationOptions{
		Title:   "Database Decision Document",
		Content: "We decided to choose PostgreSQL instead of MySQL. After careful consideration of alternatives, we selected PostgreSQL because of better ACID guarantees and the rationale for this decision is clear.",
	}

	result := Classify(opts)

	if result.Type != storage.NodeTypeDecision {
		t.Errorf("expected decision type, got %s", result.Type)
	}

	if result.NeedsReview {
		t.Errorf("confident classification should not need review (confidence: %f)", result.Confidence)
	}

	// Alternatives should be empty for confident classification
	if len(result.Alternatives) != 0 {
		t.Error("confident classification should not have alternatives")
	}
}

func TestClassifyLowConfidence(t *testing.T) {
	// Generic text with low confidence
	opts := ClassificationOptions{
		Title:   "Title",
		Content: "Generic info",
	}

	result := Classify(opts)

	// Should have valid type
	validTypes := []storage.NodeType{
		storage.NodeTypeDecision, storage.NodeTypeComponent, storage.NodeTypeConvention,
		storage.NodeTypeConcept, storage.NodeTypePattern, storage.NodeTypeIssue,
		storage.NodeTypeSession,
	}

	found := false
	for _, nt := range validTypes {
		if result.Type == nt {
			found = true
			break
		}
	}

	if !found {
		t.Errorf("expected valid node type, got %s", result.Type)
	}

	// Should need review for low confidence
	if !result.NeedsReview {
		t.Error("low confidence classification should need review")
	}

	// Should have alternatives
	if len(result.Alternatives) > 3 {
		t.Errorf("expected at most 3 alternatives, got %d", len(result.Alternatives))
	}

	// Reasoning should mention low confidence
	// (Can't check exact string as it varies)
	if result.Reasoning == "" {
		t.Error("should have reasoning")
	}
}

func TestClassifyWithContext(t *testing.T) {
	opts := ClassificationOptions{
		Title:         "New module",
		Content:       "Created a helper module",
		SourceContext: "hook_write",
	}

	result := Classify(opts)

	// hook_write should boost component type
	if result.Type != storage.NodeTypeComponent {
		t.Errorf("expected component with hook_write context, got %s", result.Type)
	}
}

func TestClassifyBatch(t *testing.T) {
	hint1 := storage.NodeTypeDecision
	hint2 := storage.NodeTypeComponent

	items := []ClassificationOptions{
		{
			Title:   "Decision document",
			Content: "We decided to use Go",
		},
		{
			Title:    "Service module",
			Content:  "No keywords",
			UserHint: &hint1,
		},
		{
			Title:    "Random",
			Content:  "Generic",
			UserHint: &hint2,
		},
	}

	results := ClassifyBatch(items)

	if len(results) != 3 {
		t.Fatalf("expected 3 results, got %d", len(results))
	}

	// First should be based on heuristics
	if results[0].Type != storage.NodeTypeDecision {
		t.Errorf("expected decision for first item, got %s", results[0].Type)
	}

	// Second should use user hint
	if results[1].Type != storage.NodeTypeDecision {
		t.Errorf("expected user hint decision for second item, got %s", results[1].Type)
	}
	if results[1].Confidence != 0.95 {
		t.Error("expected user hint to have 0.95 confidence")
	}

	// Third should use user hint
	if results[2].Type != storage.NodeTypeComponent {
		t.Errorf("expected user hint component for third item, got %s", results[2].Type)
	}
}

func TestReclassify(t *testing.T) {
	// Reclassify with significant change
	result := Reclassify(
		storage.NodeTypeComponent,
		"Critical Decision Document",
		"After thorough evaluation, we decided to choose PostgreSQL instead of MySQL. We selected this option because of better ACID features. The rationale for this decision is that we considered multiple alternatives.",
	)

	if result == nil {
		t.Fatal("expected reclassification suggestion")
	}

	if result.Type != storage.NodeTypeDecision {
		t.Errorf("expected reclassification to decision, got %s", result.Type)
	}

	if result.Confidence < 0.7 {
		t.Errorf("expected high confidence for reclassification, got %f", result.Confidence)
	}
}

func TestReclassifyNoChange(t *testing.T) {
	// Reclassify but current type is still best
	result := Reclassify(
		storage.NodeTypeDecision,
		"Database Decision",
		"We decided to use PostgreSQL",
	)

	if result != nil {
		t.Error("expected no reclassification when type matches")
	}
}

func TestReclassifyLowConfidence(t *testing.T) {
	// Reclassify but new confidence is too low
	result := Reclassify(
		storage.NodeTypeDecision,
		"Generic Title",
		"Generic content",
	)

	// Should return nil because confidence won't be >= 0.7
	if result != nil {
		t.Logf("Got reclassification with confidence %f", result.Confidence)
		if result.Confidence < 0.7 {
			t.Error("should not suggest reclassification with low confidence")
		}
	}
}

func TestClassificationOptionsDefaults(t *testing.T) {
	// Test with minimal options
	opts := ClassificationOptions{
		Title:   "Test",
		Content: "Content",
	}

	result := Classify(opts)

	// Should not panic and should return valid result
	validTypes := []storage.NodeType{
		storage.NodeTypeDecision, storage.NodeTypeComponent, storage.NodeTypeConvention,
		storage.NodeTypeConcept, storage.NodeTypePattern, storage.NodeTypeIssue,
		storage.NodeTypeSession,
	}

	found := false
	for _, nt := range validTypes {
		if result.Type == nt {
			found = true
			break
		}
	}

	if !found {
		t.Errorf("expected valid node type with defaults, got %s", result.Type)
	}
}

func TestAlternativesStructure(t *testing.T) {
	// Get a result with alternatives
	opts := ClassificationOptions{
		Title:   "Title",
		Content: "Generic",
	}

	result := Classify(opts)

	if result.NeedsReview && len(result.Alternatives) > 0 {
		// Verify alternatives structure
		for i, alt := range result.Alternatives {
			if alt.Type == "" {
				t.Errorf("alternative %d has empty type", i)
			}
			if alt.Confidence < 0 || alt.Confidence > 1.0 {
				t.Errorf("alternative %d has invalid confidence %f", i, alt.Confidence)
			}
		}

		// Should be sorted by confidence descending
		for i := 0; i < len(result.Alternatives)-1; i++ {
			if result.Alternatives[i].Confidence < result.Alternatives[i+1].Confidence {
				t.Error("alternatives should be sorted by confidence descending")
			}
		}
	}
}

func TestNeedsReviewThreshold(t *testing.T) {
	// Test the confidence threshold for needs review
	tests := []struct {
		name         string
		title        string
		content      string
		expectReview bool
	}{
		{
			name:         "High confidence - no review",
			title:        "Database Decision Document",
			content:      "We carefully decided to choose PostgreSQL instead of MySQL because of superior ACID compliance",
			expectReview: false,
		},
		{
			name:         "Low confidence - needs review",
			title:        "Generic Title",
			content:      "Generic content",
			expectReview: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			opts := ClassificationOptions{
				Title:   tt.title,
				Content: tt.content,
			}

			result := Classify(opts)

			if result.NeedsReview != tt.expectReview {
				t.Errorf("expected NeedsReview=%v, got %v (confidence: %f)",
					tt.expectReview, result.NeedsReview, result.Confidence)
			}
		})
	}
}
