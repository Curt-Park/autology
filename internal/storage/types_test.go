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

func TestCreateKnowledgeNode(t *testing.T) {
	node := CreateKnowledgeNode(
		"test-id",
		NodeTypeDecision,
		"Test Title",
		"Test content",
	)

	if node.ID != "test-id" {
		t.Errorf("expected ID = test-id, got %s", node.ID)
	}
	if node.Type != NodeTypeDecision {
		t.Errorf("expected Type = decision, got %s", node.Type)
	}
	if node.Title != "Test Title" {
		t.Errorf("expected Title = Test Title, got %s", node.Title)
	}
	if node.Confidence != 0.8 {
		t.Errorf("expected Confidence = 0.8, got %f", node.Confidence)
	}
	if node.Source != "manual" {
		t.Errorf("expected Source = manual, got %s", node.Source)
	}
	if node.Status != NodeStatusActive {
		t.Errorf("expected Status = active, got %s", node.Status)
	}
	if len(node.Tags) != 0 {
		t.Errorf("expected empty Tags, got %d", len(node.Tags))
	}
	if len(node.Relations) != 0 {
		t.Errorf("expected empty Relations, got %d", len(node.Relations))
	}
}

func TestUpdateKnowledgeNode(t *testing.T) {
	original := CreateKnowledgeNode("id", NodeTypeDecision, "Title", "Content")

	updated := UpdateKnowledgeNode(original, map[string]any{
		"title": "New Title",
		"tags":  []string{"new-tag"},
	})

	if updated.ID != original.ID {
		t.Errorf("ID should be preserved")
	}
	if updated.Created != original.Created {
		t.Errorf("Created should be preserved")
	}
	if updated.Title != "New Title" {
		t.Errorf("expected Title = New Title, got %s", updated.Title)
	}
	if updated.Modified.Equal(original.Modified) {
		t.Errorf("Modified timestamp should be updated")
	}
}
