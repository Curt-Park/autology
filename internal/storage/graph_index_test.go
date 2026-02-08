package storage

import (
	"os"
	"path/filepath"
	"testing"
)

func TestGraphIndexLoad(t *testing.T) {
	tmpDir := t.TempDir()

	store := NewGraphIndexStore(tmpDir)
	err := store.Load()
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}

	// Verify empty index was created
	indexPath := filepath.Join(tmpDir, "graph.json")
	if _, err := os.Stat(indexPath); os.IsNotExist(err) {
		t.Errorf("expected graph.json to exist")
	}
}

func TestGraphIndexAddRelation(t *testing.T) {
	tmpDir := t.TempDir()
	store := NewGraphIndexStore(tmpDir)
	store.Load()

	err := store.AddRelation("node-1", "node-2", RelationTypeAffects, "test relation", 0.9)
	if err != nil {
		t.Fatalf("AddRelation failed: %v", err)
	}

	// Verify relation was added
	relations := store.GetNodeRelations("node-1")
	if len(relations) != 1 {
		t.Errorf("expected 1 relation, got %d", len(relations))
	}

	if relations[0].Source != "node-1" {
		t.Errorf("expected source = node-1, got %s", relations[0].Source)
	}
	if relations[0].Target != "node-2" {
		t.Errorf("expected target = node-2, got %s", relations[0].Target)
	}
	if relations[0].Type != RelationTypeAffects {
		t.Errorf("expected type = affects, got %s", relations[0].Type)
	}
}

func TestGraphIndexUpdateRelation(t *testing.T) {
	tmpDir := t.TempDir()
	store := NewGraphIndexStore(tmpDir)
	store.Load()

	// Add initial relation
	store.AddRelation("node-1", "node-2", RelationTypeAffects, "initial", 0.8)

	// Update same relation
	err := store.AddRelation("node-1", "node-2", RelationTypeAffects, "updated", 0.9)
	if err != nil {
		t.Fatalf("AddRelation (update) failed: %v", err)
	}

	// Verify relation was updated
	relations := store.GetNodeRelations("node-1")
	if len(relations) != 1 {
		t.Errorf("expected 1 relation after update, got %d", len(relations))
	}

	if relations[0].Description != "updated" {
		t.Errorf("expected description = updated, got %s", relations[0].Description)
	}
	if relations[0].Confidence != 0.9 {
		t.Errorf("expected confidence = 0.9, got %f", relations[0].Confidence)
	}
}

func TestGraphIndexRemoveRelation(t *testing.T) {
	tmpDir := t.TempDir()
	store := NewGraphIndexStore(tmpDir)
	store.Load()

	store.AddRelation("node-1", "node-2", RelationTypeAffects, "", 0.8)

	err := store.RemoveRelation("node-1", "node-2", RelationTypeAffects)
	if err != nil {
		t.Fatalf("RemoveRelation failed: %v", err)
	}

	// Verify relation was removed
	relations := store.GetNodeRelations("node-1")
	if len(relations) != 0 {
		t.Errorf("expected 0 relations after removal, got %d", len(relations))
	}
}

func TestGraphIndexRemoveNodeRelations(t *testing.T) {
	tmpDir := t.TempDir()
	store := NewGraphIndexStore(tmpDir)
	store.Load()

	// Add multiple relations
	store.AddRelation("node-1", "node-2", RelationTypeAffects, "", 0.8)
	store.AddRelation("node-1", "node-3", RelationTypeUses, "", 0.8)
	store.AddRelation("node-4", "node-1", RelationTypeDependsOn, "", 0.8)

	err := store.RemoveNodeRelations("node-1")
	if err != nil {
		t.Fatalf("RemoveNodeRelations failed: %v", err)
	}

	// Verify all relations for node-1 were removed
	relations := store.GetNodeRelations("node-1")
	if len(relations) != 0 {
		t.Errorf("expected 0 relations after removal, got %d", len(relations))
	}
}

func TestGraphIndexGetNodeRelations(t *testing.T) {
	tmpDir := t.TempDir()
	store := NewGraphIndexStore(tmpDir)
	store.Load()

	// Add outgoing and incoming relations
	store.AddRelation("node-1", "node-2", RelationTypeAffects, "", 0.8)
	store.AddRelation("node-3", "node-1", RelationTypeUses, "", 0.8)

	relations := store.GetNodeRelations("node-1")
	if len(relations) != 2 {
		t.Errorf("expected 2 relations, got %d", len(relations))
	}

	// Check directions
	outgoing := 0
	incoming := 0
	for _, rel := range relations {
		if rel.Direction == "outgoing" {
			outgoing++
		} else if rel.Direction == "incoming" {
			incoming++
		}
	}

	if outgoing != 1 {
		t.Errorf("expected 1 outgoing relation, got %d", outgoing)
	}
	if incoming != 1 {
		t.Errorf("expected 1 incoming relation, got %d", incoming)
	}
}

func TestGraphIndexPersistence(t *testing.T) {
	tmpDir := t.TempDir()

	// Create store and add relation
	store1 := NewGraphIndexStore(tmpDir)
	store1.Load()
	store1.AddRelation("node-1", "node-2", RelationTypeAffects, "test", 0.8)

	// Create new store and load
	store2 := NewGraphIndexStore(tmpDir)
	err := store2.Load()
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}

	// Verify relation was persisted
	relations := store2.GetNodeRelations("node-1")
	if len(relations) != 1 {
		t.Errorf("expected 1 persisted relation, got %d", len(relations))
	}
}
