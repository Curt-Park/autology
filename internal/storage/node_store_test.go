package storage

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"
)

func TestNodeStoreInitialize(t *testing.T) {
	// Create temp directory
	tmpDir := t.TempDir()

	store := NewNodeStore(tmpDir)
	err := store.Initialize()
	if err != nil {
		t.Fatalf("Initialize failed: %v", err)
	}

	// Verify directories were created
	expectedDirs := []string{
		"decisions",
		"components",
		"conventions",
		"concepts",
		"sessions",
		"patterns",
		"issues",
	}

	for _, dir := range expectedDirs {
		path := filepath.Join(tmpDir, dir)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			t.Errorf("expected directory %s to exist", dir)
		}
	}
}

func TestNodeStoreCreateAndRead(t *testing.T) {
	tmpDir := t.TempDir()
	store := NewNodeStore(tmpDir)
	_ = store.Initialize()

	node := CreateKnowledgeNode(
		"test-create-123",
		NodeTypeDecision,
		"Test Create",
		"Test content",
	)

	// Create node
	err := store.CreateNode(node)
	if err != nil {
		t.Fatalf("CreateNode failed: %v", err)
	}

	// Read node
	retrieved, err := store.ReadNode(node.ID, node.Type)
	if err != nil {
		t.Fatalf("ReadNode failed: %v", err)
	}

	// Verify
	if retrieved.ID != node.ID {
		t.Errorf("expected ID = %s, got %s", node.ID, retrieved.ID)
	}
	if retrieved.Title != node.Title {
		t.Errorf("expected Title = %s, got %s", node.Title, retrieved.Title)
	}
}

func TestNodeStoreUpdate(t *testing.T) {
	tmpDir := t.TempDir()
	store := NewNodeStore(tmpDir)
	_ = store.Initialize()

	original := CreateKnowledgeNode(
		"test-update-123",
		NodeTypeDecision,
		"Original Title",
		"Original content",
	)

	_ = store.CreateNode(original)

	// Update
	updated := UpdateKnowledgeNode(original, map[string]any{
		"title": "Updated Title",
	})

	err := store.UpdateNode(updated)
	if err != nil {
		t.Fatalf("UpdateNode failed: %v", err)
	}

	// Read and verify
	retrieved, err := store.ReadNode(updated.ID, updated.Type)
	if err != nil {
		t.Fatalf("ReadNode failed: %v", err)
	}

	if retrieved.Title != "Updated Title" {
		t.Errorf("expected Title = Updated Title, got %s", retrieved.Title)
	}
}

func TestNodeStoreDelete(t *testing.T) {
	tmpDir := t.TempDir()
	store := NewNodeStore(tmpDir)
	_ = store.Initialize()

	node := CreateKnowledgeNode(
		"test-delete-123",
		NodeTypeDecision,
		"Test Delete",
		"Test content",
	)

	_ = store.CreateNode(node)

	// Delete
	err := store.DeleteNode(node.ID, node.Type)
	if err != nil {
		t.Fatalf("DeleteNode failed: %v", err)
	}

	// Verify deleted
	_, err = store.ReadNode(node.ID, node.Type)
	if err == nil {
		t.Errorf("expected ReadNode to fail after delete")
	}
}

func TestNodeStoreFindNode(t *testing.T) {
	tmpDir := t.TempDir()
	store := NewNodeStore(tmpDir)
	_ = store.Initialize()

	node := CreateKnowledgeNode(
		"test-find-123",
		NodeTypeDecision,
		"Test Find",
		"Test content",
	)

	_ = store.CreateNode(node)

	// Find without knowing type
	found, err := store.FindNode(node.ID)
	if err != nil {
		t.Fatalf("FindNode failed: %v", err)
	}

	if found.ID != node.ID {
		t.Errorf("expected ID = %s, got %s", node.ID, found.ID)
	}
}

func TestNodeStoreListByType(t *testing.T) {
	tmpDir := t.TempDir()
	store := NewNodeStore(tmpDir)
	_ = store.Initialize()

	// Create multiple nodes
	for i := range 3 {
		node := CreateKnowledgeNode(
			fmt.Sprintf("test-list-%d", i),
			NodeTypeDecision,
			fmt.Sprintf("Decision %d", i),
			"Content",
		)
		_ = store.CreateNode(node)
	}

	// List
	nodes, err := store.ListByType(NodeTypeDecision)
	if err != nil {
		t.Fatalf("ListByType failed: %v", err)
	}

	if len(nodes) != 3 {
		t.Errorf("expected 3 nodes, got %d", len(nodes))
	}
}
