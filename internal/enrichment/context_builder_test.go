package enrichment

import (
	"strings"
	"testing"
	"time"

	"github.com/Curt-Park/autology/internal/storage"
)

func TestScoreNodesForContext(t *testing.T) {
	node1 := storage.CreateKnowledgeNode("node-1", storage.NodeTypeDecision, "API Decision", "Content")
	node1.References = []string{"src/api/handler.go"}
	node1.Tags = []string{"api", "rest"}

	node2 := storage.CreateKnowledgeNode("node-2", storage.NodeTypeComponent, "Database Service", "Content")
	node2.References = []string{"src/db/service.go"}

	nodes := []storage.KnowledgeNode{node1, node2}

	signals := ContextSignals{
		CurrentFile: stringPtr("src/api/handler.go"),
	}

	scored := ScoreNodesForContext(nodes, signals)

	if len(scored) == 0 {
		t.Fatal("expected at least one scored node")
	}

	// node1 should score higher (file match)
	if scored[0].Node.ID != "node-1" {
		t.Errorf("expected node-1 to score highest, got %s", scored[0].Node.ID)
	}

	if scored[0].Score <= 0 {
		t.Errorf("expected positive score, got %f", scored[0].Score)
	}

	if len(scored[0].Reasons) == 0 {
		t.Error("expected reasons for score")
	}
}

func TestScoreNodeCurrentFileExactMatch(t *testing.T) {
	node := storage.CreateKnowledgeNode("node-1", storage.NodeTypeDecision, "Test", "Content")
	node.References = []string{"src/main.go", "src/test.go"}

	signals := ContextSignals{
		CurrentFile: stringPtr("src/main.go"),
	}

	scored := ScoreNodesForContext([]storage.KnowledgeNode{node}, signals)

	if len(scored) == 0 {
		t.Fatal("expected scored node")
	}

	// Should have high score from exact file match
	if scored[0].Score < 1.0 {
		t.Errorf("expected score >= 1.0 for exact file match, got %f", scored[0].Score)
	}

	// Should have reason mentioning current file
	hasFileReason := false
	for _, reason := range scored[0].Reasons {
		if strings.Contains(strings.ToLower(reason), "current file") {
			hasFileReason = true
			break
		}
	}
	if !hasFileReason {
		t.Error("expected reason mentioning current file")
	}
}

func TestScoreNodeCurrentFilePartialMatch(t *testing.T) {
	node := storage.CreateKnowledgeNode("node-1", storage.NodeTypeDecision, "Test", "Content")
	node.References = []string{"src/api/handler_test.go"}

	signals := ContextSignals{
		CurrentFile: stringPtr("src/api/handler.go"),
	}

	scored := ScoreNodesForContext([]storage.KnowledgeNode{node}, signals)

	if len(scored) == 0 {
		t.Fatal("expected scored node")
	}

	// Should have score boost from similar file
	if scored[0].Score < 0.5 {
		t.Errorf("expected score >= 0.5 for similar file, got %f", scored[0].Score)
	}
}

func TestScoreNodeRecentFiles(t *testing.T) {
	node := storage.CreateKnowledgeNode("node-1", storage.NodeTypeDecision, "Test", "Content")
	node.References = []string{"src/file1.go", "src/file2.go"}

	signals := ContextSignals{
		RecentFiles: []string{"src/file1.go", "src/file3.go"},
	}

	scored := ScoreNodesForContext([]storage.KnowledgeNode{node}, signals)

	if len(scored) == 0 {
		t.Fatal("expected scored node")
	}

	// Should have reason about recent files
	hasRecentReason := false
	for _, reason := range scored[0].Reasons {
		if strings.Contains(strings.ToLower(reason), "recent") {
			hasRecentReason = true
			break
		}
	}
	if !hasRecentReason {
		t.Error("expected reason mentioning recent files")
	}
}

func TestScoreNodeTaskMatch(t *testing.T) {
	node := storage.CreateKnowledgeNode("node-1", storage.NodeTypeDecision, "Authentication Decision", "We use JWT tokens for authentication")
	node.Tags = []string{"auth", "jwt"}

	signals := ContextSignals{
		CurrentTask: stringPtr("Implement authentication using JWT tokens"),
	}

	scored := ScoreNodesForContext([]storage.KnowledgeNode{node}, signals)

	if len(scored) == 0 {
		t.Fatal("expected scored node")
	}

	// Should have score boost from task keyword match
	if scored[0].Score < 0.5 {
		t.Errorf("expected score >= 0.5 for task match, got %f", scored[0].Score)
	}

	// Should have reason about task keywords
	hasTaskReason := false
	for _, reason := range scored[0].Reasons {
		if strings.Contains(strings.ToLower(reason), "task") {
			hasTaskReason = true
			break
		}
	}
	if !hasTaskReason {
		t.Error("expected reason mentioning task keywords")
	}
}

func TestScoreNodeTypeWeighting(t *testing.T) {
	decision := storage.CreateKnowledgeNode("dec-1", storage.NodeTypeDecision, "Decision", "Content")
	session := storage.CreateKnowledgeNode("ses-1", storage.NodeTypeSession, "Session", "Content")

	signals := ContextSignals{}

	scored := ScoreNodesForContext([]storage.KnowledgeNode{decision, session}, signals)

	if len(scored) < 2 {
		t.Fatal("expected 2 scored nodes")
	}

	// Decision should score higher than session (type weighting)
	if scored[0].Node.Type != storage.NodeTypeDecision {
		t.Errorf("expected decision to score higher than session")
	}
}

func TestScoreNodeRecencyBoost(t *testing.T) {
	recent := storage.CreateKnowledgeNode("recent", storage.NodeTypeDecision, "Recent", "Content")
	recent.Modified = time.Now()

	old := storage.CreateKnowledgeNode("old", storage.NodeTypeDecision, "Old", "Content")
	old.Modified = time.Now().AddDate(0, -6, 0) // 6 months ago

	signals := ContextSignals{}

	scored := ScoreNodesForContext([]storage.KnowledgeNode{recent, old}, signals)

	if len(scored) < 2 {
		t.Fatal("expected 2 scored nodes")
	}

	// Recent should score higher than old
	if scored[0].Node.ID != "recent" {
		t.Error("expected recent node to score higher than old node")
	}
}

func TestScoreNodeStatusPenalty(t *testing.T) {
	active := storage.CreateKnowledgeNode("active", storage.NodeTypeDecision, "Active", "Content")
	active.Status = storage.NodeStatusActive
	active.References = []string{"file.go"}

	superseded := storage.CreateKnowledgeNode("superseded", storage.NodeTypeDecision, "Superseded", "Content")
	superseded.Status = storage.NodeStatusSuperseded
	superseded.References = []string{"file.go"}

	signals := ContextSignals{
		CurrentFile: stringPtr("file.go"),
	}

	scored := ScoreNodesForContext([]storage.KnowledgeNode{active, superseded}, signals)

	if len(scored) < 2 {
		t.Fatal("expected 2 scored nodes")
	}

	// Active should score much higher than superseded
	if scored[0].Node.Status != storage.NodeStatusActive {
		t.Error("expected active node to score higher than superseded")
	}

	// Verify superseded has penalty reason
	var supersededScore *ScoredNode
	for i := range scored {
		if scored[i].Node.Status == storage.NodeStatusSuperseded {
			supersededScore = &scored[i]
			break
		}
	}

	if supersededScore != nil {
		hasSupersededReason := false
		for _, reason := range supersededScore.Reasons {
			if strings.Contains(strings.ToLower(reason), "superseded") {
				hasSupersededReason = true
				break
			}
		}
		if !hasSupersededReason {
			t.Error("expected reason mentioning superseded status")
		}
	}
}

func TestScoreNodeRelationDensity(t *testing.T) {
	wellConnected := storage.CreateKnowledgeNode("connected", storage.NodeTypeDecision, "Connected", "Content")
	wellConnected.Relations = []storage.Relation{
		{Type: storage.RelationTypeAffects, Target: "1", Confidence: 0.8},
		{Type: storage.RelationTypeAffects, Target: "2", Confidence: 0.8},
		{Type: storage.RelationTypeAffects, Target: "3", Confidence: 0.8},
		{Type: storage.RelationTypeAffects, Target: "4", Confidence: 0.8},
	}

	isolated := storage.CreateKnowledgeNode("isolated", storage.NodeTypeDecision, "Isolated", "Content")

	signals := ContextSignals{}

	scored := ScoreNodesForContext([]storage.KnowledgeNode{wellConnected, isolated}, signals)

	if len(scored) < 2 {
		t.Fatal("expected 2 scored nodes")
	}

	// Well-connected should score higher
	if scored[0].Node.ID != "connected" {
		t.Error("expected well-connected node to score higher")
	}

	// Should have reason about connections
	hasConnectionReason := false
	for _, reason := range scored[0].Reasons {
		if strings.Contains(strings.ToLower(reason), "connect") {
			hasConnectionReason = true
			break
		}
	}
	if !hasConnectionReason {
		t.Error("expected reason mentioning connections")
	}
}

func TestFilesAreSimilar(t *testing.T) {
	tests := []struct {
		name     string
		file1    string
		file2    string
		expected bool
	}{
		{
			name:     "Same directory",
			file1:    "src/api/handler.go",
			file2:    "src/api/service.go",
			expected: true,
		},
		{
			name:     "Same filename different directory",
			file1:    "src/api/handler.go",
			file2:    "src/auth/handler.go",
			expected: true,
		},
		{
			name:     "Test file and source",
			file1:    "src/handler.go",
			file2:    "src/handler_test.go",
			expected: true,
		},
		{
			name:     "Completely different",
			file1:    "src/api/handler.go",
			file2:    "pkg/db/model.go",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := filesAreSimilar(tt.file1, tt.file2)
			if result != tt.expected {
				t.Errorf("expected %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestExtractKeywords(t *testing.T) {
	text := "Implement the authentication using JWT tokens and database"

	keywords := extractKeywords(text)

	// Should filter out stop words and short words
	expectedKeywords := map[string]bool{
		"implement":      true,
		"authentication": true,
		"using":          true,
		"tokens":         true,
		"database":       true,
	}

	for _, keyword := range keywords {
		if !expectedKeywords[keyword] {
			t.Errorf("unexpected keyword: %s", keyword)
		}
	}

	// Should not include stop words
	for _, keyword := range keywords {
		if isStopWord(keyword) {
			t.Errorf("should not include stop word: %s", keyword)
		}
	}

	// Should not include short words
	for _, keyword := range keywords {
		if len(keyword) <= 3 {
			t.Errorf("should not include short word: %s", keyword)
		}
	}
}

func TestCalculateKeywordMatch(t *testing.T) {
	keywords := []string{"authentication", "tokens", "database"}

	tests := []struct {
		name     string
		text     string
		minScore float64
	}{
		{
			name:     "All keywords match",
			text:     "We use authentication with JWT tokens stored in the database",
			minScore: 0.9,
		},
		{
			name:     "Partial match",
			text:     "We use authentication and database",
			minScore: 0.6,
		},
		{
			name:     "No match",
			text:     "Something completely different",
			minScore: 0.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			score := calculateKeywordMatch(keywords, tt.text)
			if score < tt.minScore {
				t.Errorf("expected score >= %f, got %f", tt.minScore, score)
			}
		})
	}
}

func TestIsStopWord(t *testing.T) {
	tests := []struct {
		word     string
		expected bool
	}{
		{"the", true},
		{"is", true},
		{"authentication", false},
		{"implement", false},
		{"database", false},
	}

	for _, tt := range tests {
		t.Run(tt.word, func(t *testing.T) {
			result := isStopWord(tt.word)
			if result != tt.expected {
				t.Errorf("expected %v for word '%s', got %v", tt.expected, tt.word, result)
			}
		})
	}
}

func TestGroupByRelevance(t *testing.T) {
	nodes := []ScoredNode{
		{Node: storage.CreateKnowledgeNode("high1", storage.NodeTypeDecision, "High 1", ""), Score: 1.5, Reasons: []string{"test"}},
		{Node: storage.CreateKnowledgeNode("high2", storage.NodeTypeDecision, "High 2", ""), Score: 1.2, Reasons: []string{"test"}},
		{Node: storage.CreateKnowledgeNode("med1", storage.NodeTypeDecision, "Med 1", ""), Score: 0.7, Reasons: []string{"test"}},
		{Node: storage.CreateKnowledgeNode("low1", storage.NodeTypeDecision, "Low 1", ""), Score: 0.3, Reasons: []string{"test"}},
	}

	grouped := GroupByRelevance(nodes)

	if len(grouped.High) != 2 {
		t.Errorf("expected 2 high relevance nodes, got %d", len(grouped.High))
	}

	if len(grouped.Medium) != 1 {
		t.Errorf("expected 1 medium relevance node, got %d", len(grouped.Medium))
	}

	if len(grouped.Low) != 1 {
		t.Errorf("expected 1 low relevance node, got %d", len(grouped.Low))
	}
}

func TestFormatContextResults(t *testing.T) {
	node := storage.CreateKnowledgeNode("node-1", storage.NodeTypeDecision, "Test Decision", "This is test content for the decision node")
	node.Tags = []string{"test", "decision"}

	scored := []ScoredNode{
		{
			Node:    node,
			Score:   0.85,
			Reasons: []string{"References current file", "Matches task keywords"},
		},
	}

	output := FormatContextResults(scored, 10)

	// Should include title
	if !strings.Contains(output, "Test Decision") {
		t.Error("expected output to include node title")
	}

	// Should include type
	if !strings.Contains(output, "decision") {
		t.Error("expected output to include node type")
	}

	// Should include reasons
	if !strings.Contains(output, "References current file") {
		t.Error("expected output to include reasons")
	}

	// Should include tags
	if !strings.Contains(output, "test") {
		t.Error("expected output to include tags")
	}

	// Should include content preview
	if !strings.Contains(output, "This is test content") {
		t.Error("expected output to include content preview")
	}
}

func TestFormatContextResultsEmpty(t *testing.T) {
	output := FormatContextResults([]ScoredNode{}, 10)

	if !strings.Contains(output, "No relevant context") {
		t.Error("expected message about no relevant context")
	}
}

func TestFormatContextResultsLimit(t *testing.T) {
	nodes := []ScoredNode{
		{Node: storage.CreateKnowledgeNode("1", storage.NodeTypeDecision, "Node 1", "Content"), Score: 1.0, Reasons: []string{"test"}},
		{Node: storage.CreateKnowledgeNode("2", storage.NodeTypeDecision, "Node 2", "Content"), Score: 0.9, Reasons: []string{"test"}},
		{Node: storage.CreateKnowledgeNode("3", storage.NodeTypeDecision, "Node 3", "Content"), Score: 0.8, Reasons: []string{"test"}},
	}

	output := FormatContextResults(nodes, 2)

	// Should only include first 2 nodes
	if !strings.Contains(output, "Node 1") {
		t.Error("expected Node 1 in limited output")
	}
	if !strings.Contains(output, "Node 2") {
		t.Error("expected Node 2 in limited output")
	}
	if strings.Contains(output, "Node 3") {
		t.Error("should not include Node 3 in limited output")
	}
}

func TestScoreNodesSortedByScore(t *testing.T) {
	node1 := storage.CreateKnowledgeNode("node-1", storage.NodeTypeDecision, "Node 1", "Content")
	node1.Confidence = 0.9

	node2 := storage.CreateKnowledgeNode("node-2", storage.NodeTypeDecision, "Node 2", "Content")
	node2.Confidence = 0.5

	node3 := storage.CreateKnowledgeNode("node-3", storage.NodeTypeDecision, "Node 3", "Content")
	node3.Confidence = 0.7

	nodes := []storage.KnowledgeNode{node2, node1, node3} // Intentionally unsorted

	signals := ContextSignals{}

	scored := ScoreNodesForContext(nodes, signals)

	// Should be sorted by score descending
	for i := 0; i < len(scored)-1; i++ {
		if scored[i].Score < scored[i+1].Score {
			t.Error("results should be sorted by score descending")
		}
	}
}

// Helper function to create string pointer
func stringPtr(s string) *string {
	return &s
}
