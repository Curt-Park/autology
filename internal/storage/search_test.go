package storage

import (
	"math"
	"testing"
	"time"
)

func TestSearchEngineSearch(t *testing.T) {
	tmpDir := t.TempDir()
	nodeStore := NewNodeStore(tmpDir)
	graphIndex := NewGraphIndexStore(tmpDir)
	_ = nodeStore.Initialize()
	_ = graphIndex.Load()

	engine := NewSearchEngine(nodeStore, graphIndex)

	// Create test nodes
	node1 := CreateKnowledgeNode("search-1", NodeTypeDecision, "High confidence node", "Content about testing")
	node1.Confidence = 0.9
	node1.Tags = []string{"testing", "ci"}

	node2 := CreateKnowledgeNode("search-2", NodeTypeComponent, "Low confidence node", "Content about build")
	node2.Confidence = 0.3
	node2.Tags = []string{"build"}

	_ = nodeStore.CreateNode(node1)
	_ = nodeStore.CreateNode(node2)

	// Test basic search
	results, err := engine.Search(nil, 10, 0)
	if err != nil {
		t.Fatalf("Search failed: %v", err)
	}
	if len(results) != 2 {
		t.Errorf("expected 2 results, got %d", len(results))
	}

	// Test with type filter
	decisionType := NodeTypeDecision
	filter := &NodeFilter{Type: &decisionType}
	results, err = engine.Search(filter, 10, 0)
	if err != nil {
		t.Fatalf("Search with filter failed: %v", err)
	}
	if len(results) != 1 {
		t.Errorf("expected 1 result, got %d", len(results))
	}
	if results[0].Node.ID != "search-1" {
		t.Errorf("expected node search-1, got %s", results[0].Node.ID)
	}

	// Test with minConfidence filter
	minConf := 0.5
	filter = &NodeFilter{MinConfidence: &minConf}
	results, err = engine.Search(filter, 10, 0)
	if err != nil {
		t.Fatalf("Search with minConfidence failed: %v", err)
	}
	if len(results) != 1 {
		t.Errorf("expected 1 result with confidence >= 0.5, got %d", len(results))
	}

	// Test pagination
	results, err = engine.Search(nil, 1, 0)
	if err != nil {
		t.Fatalf("Search with limit failed: %v", err)
	}
	if len(results) != 1 {
		t.Errorf("expected 1 result with limit=1, got %d", len(results))
	}
}

func TestSearchEngineFindRelated(t *testing.T) {
	tmpDir := t.TempDir()
	nodeStore := NewNodeStore(tmpDir)
	graphIndex := NewGraphIndexStore(tmpDir)
	_ = nodeStore.Initialize()
	_ = graphIndex.Load()

	engine := NewSearchEngine(nodeStore, graphIndex)

	// Create test nodes
	node1 := CreateKnowledgeNode("related-1", NodeTypeDecision, "Node 1", "Content")
	node2 := CreateKnowledgeNode("related-2", NodeTypeComponent, "Node 2", "Content")
	node3 := CreateKnowledgeNode("related-3", NodeTypeConcept, "Node 3", "Content")

	_ = nodeStore.CreateNode(node1)
	_ = nodeStore.CreateNode(node2)
	_ = nodeStore.CreateNode(node3)

	// Create relations: 1 -> 2 -> 3
	_ = graphIndex.AddRelation("related-1", "related-2", RelationTypeAffects, "", 0.8)
	_ = graphIndex.AddRelation("related-2", "related-3", RelationTypeUses, "", 0.8)

	// Find related nodes from node 1 with depth 1
	results, err := engine.FindRelated("related-1", 1)
	if err != nil {
		t.Fatalf("FindRelated failed: %v", err)
	}
	if len(results) != 1 {
		t.Errorf("expected 1 related node at depth 1, got %d", len(results))
	}
	if results[0].Node.ID != "related-2" {
		t.Errorf("expected related-2, got %s", results[0].Node.ID)
	}

	// Find related nodes from node 1 with depth 2
	results, err = engine.FindRelated("related-1", 2)
	if err != nil {
		t.Fatalf("FindRelated with depth 2 failed: %v", err)
	}
	if len(results) != 2 {
		t.Errorf("expected 2 related nodes at depth 2, got %d", len(results))
	}

	// Verify scores decay with depth
	if len(results) == 2 {
		if results[0].Score <= results[1].Score {
			t.Errorf("expected scores to decay with depth")
		}
	}
}

func TestSearchEngineFindByTags(t *testing.T) {
	tmpDir := t.TempDir()
	nodeStore := NewNodeStore(tmpDir)
	graphIndex := NewGraphIndexStore(tmpDir)
	_ = nodeStore.Initialize()
	_ = graphIndex.Load()

	engine := NewSearchEngine(nodeStore, graphIndex)

	// Create test nodes
	node1 := CreateKnowledgeNode("tag-1", NodeTypeDecision, "Node 1", "Content")
	node1.Tags = []string{"go", "testing", "ci"}

	node2 := CreateKnowledgeNode("tag-2", NodeTypeComponent, "Node 2", "Content")
	node2.Tags = []string{"go", "build"}

	node3 := CreateKnowledgeNode("tag-3", NodeTypeConcept, "Node 3", "Content")
	node3.Tags = []string{"python"}

	_ = nodeStore.CreateNode(node1)
	_ = nodeStore.CreateNode(node2)
	_ = nodeStore.CreateNode(node3)

	// Test "all" mode
	results, err := engine.FindByTags([]string{"go", "testing"}, "all")
	if err != nil {
		t.Fatalf("FindByTags (all) failed: %v", err)
	}
	if len(results) != 1 {
		t.Errorf("expected 1 node with both 'go' and 'testing' tags, got %d", len(results))
	}
	if len(results) > 0 && results[0].Node.ID != "tag-1" {
		t.Errorf("expected tag-1, got %s", results[0].Node.ID)
	}

	// Test "any" mode
	results, err = engine.FindByTags([]string{"go", "python"}, "any")
	if err != nil {
		t.Fatalf("FindByTags (any) failed: %v", err)
	}
	if len(results) != 3 {
		t.Errorf("expected 3 nodes with 'go' or 'python' tags, got %d", len(results))
	}

	// Test single tag
	results, err = engine.FindByTags([]string{"build"}, "all")
	if err != nil {
		t.Fatalf("FindByTags (single tag) failed: %v", err)
	}
	if len(results) != 1 {
		t.Errorf("expected 1 node with 'build' tag, got %d", len(results))
	}
}

func TestSearchEngineFullTextSearch(t *testing.T) {
	tmpDir := t.TempDir()
	nodeStore := NewNodeStore(tmpDir)
	graphIndex := NewGraphIndexStore(tmpDir)
	_ = nodeStore.Initialize()
	_ = graphIndex.Load()

	engine := NewSearchEngine(nodeStore, graphIndex)

	// Create test nodes
	node1 := CreateKnowledgeNode("text-1", NodeTypeDecision, "Testing Framework", "We use Go testing framework for unit tests")
	node2 := CreateKnowledgeNode("text-2", NodeTypeComponent, "Build System", "The build uses make and go build")
	node3 := CreateKnowledgeNode("text-3", NodeTypeConcept, "Deployment", "Deployment uses docker")

	_ = nodeStore.CreateNode(node1)
	_ = nodeStore.CreateNode(node2)
	_ = nodeStore.CreateNode(node3)

	// Test single term
	results, err := engine.FullTextSearch("testing", 10)
	if err != nil {
		t.Fatalf("FullTextSearch failed: %v", err)
	}
	if len(results) < 1 {
		t.Errorf("expected at least 1 result for 'testing'")
	}

	// Test multiple terms
	results, err = engine.FullTextSearch("go build", 10)
	if err != nil {
		t.Fatalf("FullTextSearch (multi-term) failed: %v", err)
	}
	if len(results) < 1 {
		t.Errorf("expected at least 1 result for 'go build'")
	}

	// Verify results are sorted by score
	if len(results) > 1 {
		for i := 0; i < len(results)-1; i++ {
			if results[i].Score < results[i+1].Score {
				t.Errorf("results not sorted by score descending")
			}
		}
	}

	// Test limit
	results, err = engine.FullTextSearch("go", 1)
	if err != nil {
		t.Fatalf("FullTextSearch with limit failed: %v", err)
	}
	if len(results) > 1 {
		t.Errorf("expected at most 1 result with limit=1, got %d", len(results))
	}
}

func TestSearchEngineFindByFileReference(t *testing.T) {
	tmpDir := t.TempDir()
	nodeStore := NewNodeStore(tmpDir)
	graphIndex := NewGraphIndexStore(tmpDir)
	_ = nodeStore.Initialize()
	_ = graphIndex.Load()

	engine := NewSearchEngine(nodeStore, graphIndex)

	// Create test nodes
	node1 := CreateKnowledgeNode("file-1", NodeTypeDecision, "Node 1", "Content")
	node1.References = []string{"src/storage/node_store.go", "src/storage/types.go"}

	node2 := CreateKnowledgeNode("file-2", NodeTypeComponent, "Node 2", "Content")
	node2.References = []string{"src/server/main.go"}

	_ = nodeStore.CreateNode(node1)
	_ = nodeStore.CreateNode(node2)

	// Test exact match
	results, err := engine.FindByFileReference("node_store.go")
	if err != nil {
		t.Fatalf("FindByFileReference failed: %v", err)
	}
	if len(results) != 1 {
		t.Errorf("expected 1 result for 'node_store.go', got %d", len(results))
	}

	// Test partial path match
	results, err = engine.FindByFileReference("storage")
	if err != nil {
		t.Fatalf("FindByFileReference (partial) failed: %v", err)
	}
	if len(results) != 1 {
		t.Errorf("expected 1 result for 'storage' path, got %d", len(results))
	}

	// Test no match
	results, err = engine.FindByFileReference("nonexistent.go")
	if err != nil {
		t.Fatalf("FindByFileReference (no match) failed: %v", err)
	}
	if len(results) != 0 {
		t.Errorf("expected 0 results for nonexistent file, got %d", len(results))
	}
}

func TestSearchEngineScoring(t *testing.T) {
	tmpDir := t.TempDir()
	nodeStore := NewNodeStore(tmpDir)
	graphIndex := NewGraphIndexStore(tmpDir)
	_ = nodeStore.Initialize()
	_ = graphIndex.Load()

	engine := NewSearchEngine(nodeStore, graphIndex)

	// Create nodes with different attributes
	now := time.Now()

	node1 := CreateKnowledgeNode("score-1", NodeTypeDecision, "Testing", "Content with testing keyword")
	node1.Confidence = 0.9
	node1.Tags = []string{"testing", "go"}
	node1.Modified = now // Recent

	node2 := CreateKnowledgeNode("score-2", NodeTypeComponent, "Build", "Content")
	node2.Confidence = 0.5
	node2.Tags = []string{}
	node2.Modified = now.AddDate(-1, 0, 0) // 1 year old

	_ = nodeStore.CreateNode(node1)
	_ = nodeStore.CreateNode(node2)

	// Search with query that matches node1 better
	query := "testing"
	filter := &NodeFilter{SearchQuery: &query}
	results, err := engine.Search(filter, 10, 0)
	if err != nil {
		t.Fatalf("Search for scoring test failed: %v", err)
	}

	// Verify node1 scores higher than node2
	if len(results) >= 2 {
		if results[0].Node.ID != "score-1" {
			t.Errorf("expected score-1 to rank higher due to query match, confidence, and recency")
		}
	}

	// Verify scores are capped at 1.0
	for _, result := range results {
		if result.Score > 1.0 {
			t.Errorf("score %f exceeds maximum 1.0", result.Score)
		}
	}

	// Verify scores use confidence as base
	for _, result := range results {
		if result.Score < 0 {
			t.Errorf("negative score %f", result.Score)
		}
	}
}

func TestSearchEngineCalculateRelevance(t *testing.T) {
	tmpDir := t.TempDir()
	nodeStore := NewNodeStore(tmpDir)
	graphIndex := NewGraphIndexStore(tmpDir)
	_ = nodeStore.Initialize()
	_ = graphIndex.Load()

	engine := NewSearchEngine(nodeStore, graphIndex)

	node := CreateKnowledgeNode("test-1", NodeTypeDecision, "Test", "Content")
	node.Confidence = 0.8
	node.Tags = []string{"testing", "go"}
	node.Modified = time.Now()

	// Add a relation
	rel := Relation{
		Type:        RelationTypeAffects,
		Target:      "related-node",
		Description: "",
		Confidence:  0.9,
	}
	node.Relations = append(node.Relations, rel)

	// Test base score (no filter)
	score := engine.calculateRelevance(node, nil)
	if score != 0.8 {
		t.Errorf("expected base score 0.8, got %f", score)
	}

	// Test type match boost
	nodeType := NodeTypeDecision
	filter := &NodeFilter{Type: &nodeType}
	score = engine.calculateRelevance(node, filter)
	if score <= 0.8 {
		t.Errorf("expected type match to boost score above 0.8")
	}

	// Test tag match boost
	filter = &NodeFilter{Tags: []string{"testing"}}
	score = engine.calculateRelevance(node, filter)
	if score <= 0.8 {
		t.Errorf("expected tag match to boost score above 0.8")
	}

	// Test relation match boost
	relatedNode := "related-node"
	filter = &NodeFilter{RelatedTo: &relatedNode}
	score = engine.calculateRelevance(node, filter)
	if score <= 0.8 {
		t.Errorf("expected relation match to boost score above 0.8")
	}

	// Test search query boost
	query := "test"
	filter = &NodeFilter{SearchQuery: &query}
	score = engine.calculateRelevance(node, filter)
	if score <= 0.8 {
		t.Errorf("expected search query match to boost score above 0.8")
	}

	// Test score capping at 1.0
	if score > 1.0 {
		t.Errorf("score %f exceeds cap of 1.0", score)
	}
}

func TestSearchEngineCalculateTagScore(t *testing.T) {
	tmpDir := t.TempDir()
	nodeStore := NewNodeStore(tmpDir)
	graphIndex := NewGraphIndexStore(tmpDir)
	_ = nodeStore.Initialize()
	_ = graphIndex.Load()

	engine := NewSearchEngine(nodeStore, graphIndex)

	nodeTags := []string{"go", "testing", "ci"}

	// Test full match
	searchTags := []string{"go", "testing"}
	score := engine.calculateTagScore(nodeTags, searchTags)
	if score != 1.0 {
		t.Errorf("expected full match score 1.0, got %f", score)
	}

	// Test partial match
	searchTags = []string{"go", "python"}
	score = engine.calculateTagScore(nodeTags, searchTags)
	expected := 0.5 // 1 out of 2 tags match
	if math.Abs(score-expected) > 0.01 {
		t.Errorf("expected partial match score %f, got %f", expected, score)
	}

	// Test no match
	searchTags = []string{"python", "java"}
	score = engine.calculateTagScore(nodeTags, searchTags)
	if score != 0.0 {
		t.Errorf("expected no match score 0.0, got %f", score)
	}

	// Test empty search tags
	searchTags = []string{}
	score = engine.calculateTagScore(nodeTags, searchTags)
	if score != 0.0 {
		t.Errorf("expected empty search tags score 0.0, got %f", score)
	}
}

func TestSearchEngineCalculateTextScore(t *testing.T) {
	tmpDir := t.TempDir()
	nodeStore := NewNodeStore(tmpDir)
	graphIndex := NewGraphIndexStore(tmpDir)
	_ = nodeStore.Initialize()
	_ = graphIndex.Load()

	engine := NewSearchEngine(nodeStore, graphIndex)

	node := CreateKnowledgeNode("test-1", NodeTypeDecision, "Testing Framework", "We use testing for tests")
	node.Tags = []string{"testing"}

	// Test single term match (appears 3 times: title, content, tags)
	// Score: min(3, 5) / 5 = 0.6 per term, total: 0.6 / 1 = 0.6
	queryTerms := []string{"testing"}
	score := engine.calculateTextScore(node, queryTerms)
	if score < 0.5 || score > 1.0 {
		t.Errorf("expected reasonable score for term with multiple occurrences, got %f", score)
	}

	// Test multiple terms - both present
	queryTerms = []string{"testing", "framework"}
	score = engine.calculateTextScore(node, queryTerms)
	if score < 0.3 || score > 1.0 {
		t.Errorf("expected reasonable score for all terms present, got %f", score)
	}

	// Test partial match
	queryTerms = []string{"testing", "nonexistent"}
	score = engine.calculateTextScore(node, queryTerms)
	// Should be less than full match but greater than 0
	if score <= 0.0 || score >= 1.0 {
		t.Errorf("expected partial match score between 0 and 1, got %f", score)
	}

	// Test no match
	queryTerms = []string{"python", "django"}
	score = engine.calculateTextScore(node, queryTerms)
	if score != 0.0 {
		t.Errorf("expected no match score 0.0, got %f", score)
	}

	// Test score capping at 1.0
	if score > 1.0 {
		t.Errorf("text score %f exceeds cap of 1.0", score)
	}
}
