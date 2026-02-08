package storage

import (
	"testing"
	"time"
)

func TestNodeTypes(t *testing.T) {
	expected := []NodeType{
		"decision",
		"component",
		"convention",
		"concept",
		"session",
		"pattern",
		"issue",
	}

	if len(NodeTypes) != len(expected) {
		t.Errorf("expected %d node types, got %d", len(expected), len(NodeTypes))
	}

	for i, nt := range expected {
		if NodeTypes[i] != nt {
			t.Errorf("expected NodeTypes[%d] = %s, got %s", i, nt, NodeTypes[i])
		}
	}
}

func TestNodeStatuses(t *testing.T) {
	expected := []NodeStatus{"active", "needs_review", "superseded"}

	if len(NodeStatuses) != len(expected) {
		t.Errorf("expected %d statuses, got %d", len(expected), len(NodeStatuses))
	}
}

func TestRelationTypes(t *testing.T) {
	expected := []RelationType{
		"affects",
		"uses",
		"supersedes",
		"relates_to",
		"implements",
		"depends_on",
		"derived_from",
	}

	if len(RelationTypes) != len(expected) {
		t.Errorf("expected %d relation types, got %d", len(expected), len(RelationTypes))
	}
}

func TestKnowledgeNodeFields(t *testing.T) {
	now := time.Now()
	node := KnowledgeNode{
		ID:         "test-id",
		Type:       NodeTypeDecision,
		Title:      "Test Decision",
		Content:    "Test content",
		Tags:       []string{"test"},
		Relations:  []Relation{},
		Confidence: 0.8,
		Created:    now,
		Modified:   now,
		Session:    "session-123",
		Source:     "manual",
		References: []string{"src/test.go"},
		Status:     NodeStatusActive,
	}

	if node.ID != "test-id" {
		t.Errorf("expected ID = test-id, got %s", node.ID)
	}
	if node.Type != NodeTypeDecision {
		t.Errorf("expected Type = decision, got %s", node.Type)
	}
}
