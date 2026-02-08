package enrichment

import (
	"testing"

	"github.com/Curt-Park/autology/internal/storage"
)

func TestInferRelations(t *testing.T) {
	// Create nodes for testing
	decision := storage.CreateKnowledgeNode("dec-1", storage.NodeTypeDecision, "Use PostgreSQL", "We decided to use PostgreSQL")
	decision.Tags = []string{"database", "postgres"}

	component := storage.CreateKnowledgeNode("comp-1", storage.NodeTypeComponent, "User Service", "Handles users")
	component.Tags = []string{"database", "users"}

	existingNodes := []storage.KnowledgeNode{component}

	// Infer relations
	inferred := InferRelations(decision, existingNodes)

	if len(inferred) == 0 {
		t.Fatal("expected at least one inferred relation")
	}

	// Should infer "decision affects component" due to tag overlap
	found := false
	for _, rel := range inferred {
		if rel.Type == storage.RelationTypeAffects {
			found = true
			if rel.Source != decision.ID {
				t.Errorf("expected source %s, got %s", decision.ID, rel.Source)
			}
			if rel.Target != component.ID {
				t.Errorf("expected target %s, got %s", component.ID, rel.Target)
			}
			if rel.Confidence < 0.5 {
				t.Errorf("expected reasonable confidence, got %f", rel.Confidence)
			}
			if rel.Reasoning == "" {
				t.Error("expected non-empty reasoning")
			}
		}
	}

	if !found {
		t.Error("expected to find 'affects' relation")
	}
}

func TestInferRelationsSkipSelf(t *testing.T) {
	node := storage.CreateKnowledgeNode("node-1", storage.NodeTypeDecision, "Test", "Content")
	node.Tags = []string{"test"}

	// Pass the same node as existing
	inferred := InferRelations(node, []storage.KnowledgeNode{node})

	// Should not infer relation to self
	if len(inferred) != 0 {
		t.Error("should not infer relation to self")
	}
}

func TestInferSpecificRelationDecisionAffectsComponent(t *testing.T) {
	decision := storage.CreateKnowledgeNode("dec-1", storage.NodeTypeDecision, "API Decision", "Use REST")
	decision.Tags = []string{"api", "rest"}

	component := storage.CreateKnowledgeNode("comp-1", storage.NodeTypeComponent, "API Service", "REST API")
	component.Tags = []string{"api", "service"}

	inferred := InferRelations(decision, []storage.KnowledgeNode{component})

	if len(inferred) == 0 {
		t.Fatal("expected relation for decision -> component with tag overlap")
	}

	if inferred[0].Type != storage.RelationTypeAffects {
		t.Errorf("expected type affects, got %s", inferred[0].Type)
	}
}

func TestInferSpecificRelationComponentImplementsPattern(t *testing.T) {
	pattern := storage.CreateKnowledgeNode("pat-1", storage.NodeTypePattern, "Repository Pattern", "Data access")
	pattern.Tags = []string{"pattern", "data"}

	component := storage.CreateKnowledgeNode("comp-1", storage.NodeTypeComponent, "User Repository", "Uses repository pattern")
	component.Tags = []string{"pattern", "data"}

	inferred := InferRelations(component, []storage.KnowledgeNode{pattern})

	if len(inferred) == 0 {
		t.Fatal("expected relation for component -> pattern")
	}

	if inferred[0].Type != storage.RelationTypeImplements {
		t.Errorf("expected type implements, got %s", inferred[0].Type)
	}
}

func TestInferSpecificRelationComponentUsesComponent(t *testing.T) {
	comp1 := storage.CreateKnowledgeNode("comp-1", storage.NodeTypeComponent, "Auth Service", "Authentication")
	comp1.References = []string{"src/auth/service.go", "src/auth/handler.go"}

	comp2 := storage.CreateKnowledgeNode("comp-2", storage.NodeTypeComponent, "User Service", "User management")
	comp2.References = []string{"src/auth/service.go", "src/user/service.go"}

	inferred := InferRelations(comp1, []storage.KnowledgeNode{comp2})

	if len(inferred) == 0 {
		t.Fatal("expected relation for component -> component with file overlap")
	}

	if inferred[0].Type != storage.RelationTypeUses {
		t.Errorf("expected type uses, got %s", inferred[0].Type)
	}
}

func TestInferSpecificRelationDecisionSupersedesDecision(t *testing.T) {
	oldDecision := storage.CreateKnowledgeNode("dec-old", storage.NodeTypeDecision, "Use MySQL", "Previous decision")

	newDecision := storage.CreateKnowledgeNode("dec-new", storage.NodeTypeDecision, "Database Choice", "This supersedes Use MySQL decision")

	inferred := InferRelations(newDecision, []storage.KnowledgeNode{oldDecision})

	if len(inferred) == 0 {
		t.Fatal("expected supersedes relation")
	}

	if inferred[0].Type != storage.RelationTypeSupersedes {
		t.Errorf("expected type supersedes, got %s", inferred[0].Type)
	}
}

func TestInferSpecificRelationConventionRelatesComponent(t *testing.T) {
	convention := storage.CreateKnowledgeNode("conv-1", storage.NodeTypeConvention, "Naming Convention", "Use camelCase")
	convention.Tags = []string{"naming", "code"}

	component := storage.CreateKnowledgeNode("comp-1", storage.NodeTypeComponent, "Service", "Code module")
	component.Tags = []string{"code", "service"}

	inferred := InferRelations(convention, []storage.KnowledgeNode{component})

	if len(inferred) == 0 {
		t.Fatal("expected relation for convention -> component")
	}

	if inferred[0].Type != storage.RelationTypeRelatesTo {
		t.Errorf("expected type relates_to, got %s", inferred[0].Type)
	}
}

func TestInferSpecificRelationSameSession(t *testing.T) {
	node1 := storage.CreateKnowledgeNode("node-1", storage.NodeTypeComponent, "Service A", "Content")
	node1.Session = "session-123"
	node1.Tags = []string{"api", "service"}

	node2 := storage.CreateKnowledgeNode("node-2", storage.NodeTypeComponent, "Service B", "Content")
	node2.Session = "session-123"
	node2.Tags = []string{"api", "handler"}

	inferred := InferRelations(node1, []storage.KnowledgeNode{node2})

	if len(inferred) == 0 {
		t.Fatal("expected relation for same session with tag overlap")
	}

	if inferred[0].Type != storage.RelationTypeRelatesTo {
		t.Errorf("expected type relates_to, got %s", inferred[0].Type)
	}
}

func TestInferSpecificRelationHighTagOverlap(t *testing.T) {
	node1 := storage.CreateKnowledgeNode("node-1", storage.NodeTypeConcept, "API Concept", "Content")
	node1.Tags = []string{"api", "rest", "http", "json"}

	node2 := storage.CreateKnowledgeNode("node-2", storage.NodeTypeConcept, "HTTP Concept", "Content")
	node2.Tags = []string{"http", "rest", "api"}

	inferred := InferRelations(node1, []storage.KnowledgeNode{node2})

	if len(inferred) == 0 {
		t.Fatal("expected relation for high tag overlap")
	}

	if inferred[0].Type != storage.RelationTypeRelatesTo {
		t.Errorf("expected type relates_to for generic high overlap, got %s", inferred[0].Type)
	}
}

func TestCalculateTagOverlap(t *testing.T) {
	tests := []struct {
		name     string
		tags1    []string
		tags2    []string
		expected float64
	}{
		{
			name:     "Identical tags",
			tags1:    []string{"api", "rest"},
			tags2:    []string{"api", "rest"},
			expected: 1.0,
		},
		{
			name:     "Partial overlap",
			tags1:    []string{"api", "rest"},
			tags2:    []string{"api", "graphql"},
			expected: 0.33, // 1 shared / 3 total
		},
		{
			name:     "No overlap",
			tags1:    []string{"api"},
			tags2:    []string{"database"},
			expected: 0.0,
		},
		{
			name:     "Empty tags",
			tags1:    []string{},
			tags2:    []string{"api"},
			expected: 0.0,
		},
		{
			name:     "Case insensitive",
			tags1:    []string{"API"},
			tags2:    []string{"api"},
			expected: 1.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calculateTagOverlap(tt.tags1, tt.tags2)

			// Allow small floating point difference
			if result < tt.expected-0.05 || result > tt.expected+0.05 {
				t.Errorf("expected overlap ~%f, got %f", tt.expected, result)
			}
		})
	}
}

func TestCalculateFileOverlap(t *testing.T) {
	tests := []struct {
		name     string
		refs1    []string
		refs2    []string
		expected int
	}{
		{
			name:     "Same files",
			refs1:    []string{"file1.go", "file2.go"},
			refs2:    []string{"file1.go", "file2.go"},
			expected: 2,
		},
		{
			name:     "Partial overlap",
			refs1:    []string{"file1.go", "file2.go"},
			refs2:    []string{"file2.go", "file3.go"},
			expected: 1,
		},
		{
			name:     "No overlap",
			refs1:    []string{"file1.go"},
			refs2:    []string{"file2.go"},
			expected: 0,
		},
		{
			name:     "Empty refs",
			refs1:    []string{},
			refs2:    []string{"file1.go"},
			expected: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calculateFileOverlap(tt.refs1, tt.refs2)

			if result != tt.expected {
				t.Errorf("expected %d, got %d", tt.expected, result)
			}
		})
	}
}

func TestCalculateTitleSimilarity(t *testing.T) {
	tests := []struct {
		name     string
		title1   string
		title2   string
		minScore float64
	}{
		{
			name:     "Identical titles",
			title1:   "User Authentication Service",
			title2:   "User Authentication Service",
			minScore: 0.8,
		},
		{
			name:     "Similar titles",
			title1:   "User Service Implementation",
			title2:   "User Service Design",
			minScore: 0.3,
		},
		{
			name:     "Different titles",
			title1:   "Authentication System",
			title2:   "Database Schema",
			minScore: 0.0,
		},
		{
			name:     "Short words filtered",
			title1:   "The API Service",
			title2:   "The API Handler",
			minScore: 0.0, // "The" and "API" are filtered (<=3 chars)
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calculateTitleSimilarity(tt.title1, tt.title2)

			if result < tt.minScore {
				t.Errorf("expected similarity >= %f, got %f", tt.minScore, result)
			}
		})
	}
}

func TestContainsPatternReference(t *testing.T) {
	tests := []struct {
		name        string
		content     string
		patternName string
		expected    bool
	}{
		{
			name:        "Exact match",
			content:     "We use the Repository Pattern for data access",
			patternName: "Repository Pattern",
			expected:    true,
		},
		{
			name:        "Without 'pattern' suffix",
			content:     "We use the Repository for data access",
			patternName: "Repository Pattern",
			expected:    true,
		},
		{
			name:        "With hyphens",
			content:     "We use the factory pattern",
			patternName: "Factory-Pattern",
			expected:    true,
		},
		{
			name:        "Case insensitive",
			content:     "Uses REPOSITORY PATTERN",
			patternName: "repository pattern",
			expected:    true,
		},
		{
			name:        "No match",
			content:     "Uses different approach",
			patternName: "Repository Pattern",
			expected:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := containsPatternReference(tt.content, tt.patternName)

			if result != tt.expected {
				t.Errorf("expected %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestContainsSupersession(t *testing.T) {
	tests := []struct {
		name        string
		content     string
		targetTitle string
		expected    bool
	}{
		{
			name:        "Supersedes keyword",
			content:     "This supersedes the old MySQL decision",
			targetTitle: "MySQL Decision",
			expected:    true,
		},
		{
			name:        "Replaces keyword",
			content:     "This replaces the MySQL approach",
			targetTitle: "MySQL",
			expected:    true,
		},
		{
			name:        "Instead of keyword",
			content:     "Use PostgreSQL instead of MySQL",
			targetTitle: "MySQL",
			expected:    true,
		},
		{
			name:        "No supersession",
			content:     "We use PostgreSQL",
			targetTitle: "MySQL",
			expected:    false,
		},
		{
			name:        "Keyword without target",
			content:     "This supersedes the old approach",
			targetTitle: "MySQL",
			expected:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := containsSupersession(tt.content, tt.targetTitle)

			if result != tt.expected {
				t.Errorf("expected %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestFilterByConfidence(t *testing.T) {
	relations := []InferredRelation{
		{Source: "1", Target: "2", Type: storage.RelationTypeAffects, Confidence: 0.9, Reasoning: "High"},
		{Source: "1", Target: "3", Type: storage.RelationTypeUses, Confidence: 0.6, Reasoning: "Medium"},
		{Source: "1", Target: "4", Type: storage.RelationTypeRelatesTo, Confidence: 0.4, Reasoning: "Low"},
	}

	// Filter at 0.7
	filtered := FilterByConfidence(relations, 0.7)

	if len(filtered) != 1 {
		t.Errorf("expected 1 relation with confidence >= 0.7, got %d", len(filtered))
	}

	if len(filtered) > 0 && filtered[0].Confidence != 0.9 {
		t.Errorf("expected first filtered relation to have confidence 0.9, got %f", filtered[0].Confidence)
	}
}

func TestGroupByAction(t *testing.T) {
	relations := []InferredRelation{
		{Source: "1", Target: "2", Type: storage.RelationTypeAffects, Confidence: 0.8, Reasoning: "Auto"},
		{Source: "1", Target: "3", Type: storage.RelationTypeUses, Confidence: 0.6, Reasoning: "Suggest"},
		{Source: "1", Target: "4", Type: storage.RelationTypeRelatesTo, Confidence: 0.75, Reasoning: "Auto"},
	}

	result := GroupByAction(relations, 0.7)

	if len(result.AutoCreate) != 2 {
		t.Errorf("expected 2 auto-create relations (>= 0.7), got %d", len(result.AutoCreate))
	}

	if len(result.Suggest) != 1 {
		t.Errorf("expected 1 suggest relation (< 0.7), got %d", len(result.Suggest))
	}

	// Verify auto-create relations have >= 0.7 confidence
	for _, rel := range result.AutoCreate {
		if rel.Confidence < 0.7 {
			t.Errorf("auto-create relation has confidence %f < 0.7", rel.Confidence)
		}
	}

	// Verify suggest relations have < 0.7 confidence
	for _, rel := range result.Suggest {
		if rel.Confidence >= 0.7 {
			t.Errorf("suggest relation has confidence %f >= 0.7", rel.Confidence)
		}
	}
}

func TestInferRelationsSortedByConfidence(t *testing.T) {
	node1 := storage.CreateKnowledgeNode("node-1", storage.NodeTypeDecision, "Decision", "Content")
	node1.Tags = []string{"tag1", "tag2", "tag3"}

	node2 := storage.CreateKnowledgeNode("node-2", storage.NodeTypeComponent, "Component A", "Content")
	node2.Tags = []string{"tag1", "tag2", "tag3"} // High overlap

	node3 := storage.CreateKnowledgeNode("node-3", storage.NodeTypeComponent, "Component B", "Content")
	node3.Tags = []string{"tag1"} // Low overlap

	inferred := InferRelations(node1, []storage.KnowledgeNode{node2, node3})

	if len(inferred) < 2 {
		t.Fatal("expected at least 2 relations")
	}

	// Verify sorted by confidence descending
	for i := 0; i < len(inferred)-1; i++ {
		if inferred[i].Confidence < inferred[i+1].Confidence {
			t.Error("relations should be sorted by confidence descending")
		}
	}
}

func TestInferRelationsNoMatches(t *testing.T) {
	node1 := storage.CreateKnowledgeNode("node-1", storage.NodeTypeConcept, "Concept A", "Content")
	node1.Tags = []string{"unique"}

	node2 := storage.CreateKnowledgeNode("node-2", storage.NodeTypeConcept, "Concept B", "Content")
	node2.Tags = []string{"different"}

	inferred := InferRelations(node1, []storage.KnowledgeNode{node2})

	// With no tag overlap and no other signals, should not infer relations
	if len(inferred) != 0 {
		t.Errorf("expected no relations with no overlap, got %d", len(inferred))
	}
}
