package storage

import (
	"strings"
	"testing"
	"time"
)

func TestSerializeNode(t *testing.T) {
	node := KnowledgeNode{
		ID:         "test-id-123",
		Type:       NodeTypeDecision,
		Title:      "Test Decision",
		Content:    "This is the content",
		Tags:       []string{"test", "decision"},
		Relations:  []Relation{},
		Confidence: 0.9,
		Created:    time.Date(2024, 1, 15, 10, 30, 0, 0, time.UTC),
		Modified:   time.Date(2024, 1, 15, 10, 30, 0, 0, time.UTC),
		Source:     "manual",
		References: []string{"src/test.go"},
		Status:     NodeStatusActive,
	}

	markdown, err := SerializeNode(node)
	if err != nil {
		t.Fatalf("SerializeNode failed: %v", err)
	}

	// Check frontmatter delimiter
	if !strings.HasPrefix(markdown, "---\n") {
		t.Errorf("markdown should start with frontmatter delimiter")
	}

	// Check content is present
	if !strings.Contains(markdown, "This is the content") {
		t.Errorf("markdown should contain content")
	}

	// Check YAML fields
	if !strings.Contains(markdown, "id: test-id-123") {
		t.Errorf("markdown should contain id field")
	}
	if !strings.Contains(markdown, "type: decision") {
		t.Errorf("markdown should contain type field")
	}
}

func TestParseNode(t *testing.T) {
	markdown := `---
id: test-id-123
type: decision
title: Test Decision
tags:
  - test
  - decision
relations: []
confidence: 0.9
created: 2024-01-15T10:30:00Z
modified: 2024-01-15T10:30:00Z
source: manual
references:
  - src/test.go
status: active
---

This is the content`

	node, err := ParseNode(markdown)
	if err != nil {
		t.Fatalf("ParseNode failed: %v", err)
	}

	if node.ID != "test-id-123" {
		t.Errorf("expected ID = test-id-123, got %s", node.ID)
	}
	if node.Type != NodeTypeDecision {
		t.Errorf("expected Type = decision, got %s", node.Type)
	}
	if node.Title != "Test Decision" {
		t.Errorf("expected Title = Test Decision, got %s", node.Title)
	}
	if node.Content != "This is the content" {
		t.Errorf("expected Content = This is the content, got %s", node.Content)
	}
}

func TestRoundTrip(t *testing.T) {
	original := CreateKnowledgeNode(
		"round-trip-id",
		NodeTypeDecision,
		"Round Trip Test",
		"Testing serialization round trip",
	)
	original.Tags = []string{"test"}

	// Serialize
	markdown, err := SerializeNode(original)
	if err != nil {
		t.Fatalf("SerializeNode failed: %v", err)
	}

	// Parse
	parsed, err := ParseNode(markdown)
	if err != nil {
		t.Fatalf("ParseNode failed: %v", err)
	}

	// Verify
	if parsed.ID != original.ID {
		t.Errorf("ID mismatch after round trip")
	}
	if parsed.Title != original.Title {
		t.Errorf("Title mismatch after round trip")
	}
	if parsed.Content != original.Content {
		t.Errorf("Content mismatch after round trip")
	}
}
