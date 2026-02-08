package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// GraphIndexStore manages the graph index
type GraphIndexStore struct {
	index     GraphIndex
	indexPath string
}

// NewGraphIndexStore creates a new GraphIndexStore
func NewGraphIndexStore(rootPath string) *GraphIndexStore {
	return &GraphIndexStore{
		indexPath: filepath.Join(rootPath, "graph.json"),
		index:     createEmptyIndex(),
	}
}

// Load loads the index from disk
func (gis *GraphIndexStore) Load() error {
	if _, err := os.Stat(gis.indexPath); os.IsNotExist(err) {
		// Create empty index
		return gis.Save()
	}

	data, err := os.ReadFile(gis.indexPath)
	if err != nil {
		return fmt.Errorf("failed to read graph index: %w", err)
	}

	if err := json.Unmarshal(data, &gis.index); err != nil {
		return fmt.Errorf("failed to parse graph index: %w", err)
	}

	return nil
}

// Save saves the index to disk atomically
func (gis *GraphIndexStore) Save() error {
	tmpPath := gis.indexPath + ".tmp"

	data, err := json.MarshalIndent(gis.index, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal graph index: %w", err)
	}

	if err := os.WriteFile(tmpPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write temp file: %w", err)
	}

	if err := os.Rename(tmpPath, gis.indexPath); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("failed to rename temp file: %w", err)
	}

	return nil
}

// AddRelation adds or updates a relation in the index
func (gis *GraphIndexStore) AddRelation(source, target string, relType RelationType, description string, confidence float64) error {
	// Check if relation already exists
	exists := false
	for i, rel := range gis.index.Relations {
		if rel.Source == source && rel.Target == target && rel.Type == relType {
			// Update existing relation
			gis.index.Relations[i] = GraphRelation{
				Source:      source,
				Target:      target,
				Type:        relType,
				Description: description,
				Confidence:  confidence,
			}
			exists = true
			break
		}
	}

	if !exists {
		// Add new relation
		newRelation := GraphRelation{
			Source:      source,
			Target:      target,
			Type:        relType,
			Description: description,
			Confidence:  confidence,
		}
		gis.index.Relations = append(gis.index.Relations, newRelation)
	}

	gis.index.LastUpdated = time.Now().UTC().Format(time.RFC3339)
	return gis.Save()
}

// RemoveRelation removes a relation from the index
func (gis *GraphIndexStore) RemoveRelation(source, target string, relType RelationType) error {
	filtered := make([]GraphRelation, 0)
	for _, rel := range gis.index.Relations {
		if !(rel.Source == source && rel.Target == target && rel.Type == relType) {
			filtered = append(filtered, rel)
		}
	}

	gis.index.Relations = filtered
	gis.index.LastUpdated = time.Now().UTC().Format(time.RFC3339)
	return gis.Save()
}

// RemoveNodeRelations removes all relations for a node
func (gis *GraphIndexStore) RemoveNodeRelations(nodeID string) error {
	filtered := make([]GraphRelation, 0)
	for _, rel := range gis.index.Relations {
		if rel.Source != nodeID && rel.Target != nodeID {
			filtered = append(filtered, rel)
		}
	}

	gis.index.Relations = filtered
	gis.index.LastUpdated = time.Now().UTC().Format(time.RFC3339)
	return gis.Save()
}

// NodeRelationWithDirection represents a relation with direction information
type NodeRelationWithDirection struct {
	Source      string
	Target      string
	Type        RelationType
	Description string
	Confidence  float64
	Direction   string // "outgoing" or "incoming"
}

// GetNodeRelations gets all relations for a node (both outgoing and incoming)
func (gis *GraphIndexStore) GetNodeRelations(nodeID string) []NodeRelationWithDirection {
	result := make([]NodeRelationWithDirection, 0)

	for _, rel := range gis.index.Relations {
		if rel.Source == nodeID {
			result = append(result, NodeRelationWithDirection{
				Source:      rel.Source,
				Target:      rel.Target,
				Type:        rel.Type,
				Description: rel.Description,
				Confidence:  rel.Confidence,
				Direction:   "outgoing",
			})
		} else if rel.Target == nodeID {
			result = append(result, NodeRelationWithDirection{
				Source:      rel.Source,
				Target:      rel.Target,
				Type:        rel.Type,
				Description: rel.Description,
				Confidence:  rel.Confidence,
				Direction:   "incoming",
			})
		}
	}

	return result
}

// GetRelatedNodes gets all unique node IDs related to a given node (both directions)
func (gis *GraphIndexStore) GetRelatedNodes(nodeID string) []string {
	related := make(map[string]bool)

	for _, rel := range gis.index.Relations {
		if rel.Source == nodeID {
			related[rel.Target] = true
		} else if rel.Target == nodeID {
			related[rel.Source] = true
		}
	}

	result := make([]string, 0, len(related))
	for id := range related {
		result = append(result, id)
	}

	return result
}

// createEmptyIndex creates an empty graph index
func createEmptyIndex() GraphIndex {
	return GraphIndex{
		Version:     "1.0.0",
		LastUpdated: time.Now().UTC().Format(time.RFC3339),
		Relations:   []GraphRelation{},
	}
}
