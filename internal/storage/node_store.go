package storage

import (
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"
)

// NodeStore manages knowledge node persistence
type NodeStore struct {
	rootPath string
}

// NewNodeStore creates a new NodeStore
func NewNodeStore(rootPath string) *NodeStore {
	return &NodeStore{
		rootPath: rootPath,
	}
}

// Initialize creates the directory structure
func (ns *NodeStore) Initialize() error {
	dirs := []string{
		"decisions",
		"components",
		"conventions",
		"concepts",
		"sessions",
		"patterns",
		"issues",
	}

	for _, dir := range dirs {
		path := filepath.Join(ns.rootPath, dir)
		if err := os.MkdirAll(path, 0755); err != nil {
			return fmt.Errorf("failed to create directory %s: %w", dir, err)
		}
	}

	return nil
}

// getNodePath returns the file path for a node
func (ns *NodeStore) getNodePath(id string, nodeType NodeType) string {
	return filepath.Join(ns.rootPath, string(nodeType)+"s", id+".md")
}

// CreateNode creates a new node file
func (ns *NodeStore) CreateNode(node KnowledgeNode) error {
	filePath := ns.getNodePath(node.ID, node.Type)

	// Check if already exists
	if _, err := os.Stat(filePath); err == nil {
		return fmt.Errorf("node already exists: %s", node.ID)
	}

	// Serialize to markdown
	markdown, err := SerializeNode(node)
	if err != nil {
		return fmt.Errorf("failed to serialize node: %w", err)
	}

	// Atomic write: write to temp file then rename
	tmpFile := filePath + ".tmp"
	if err := os.WriteFile(tmpFile, []byte(markdown), 0644); err != nil {
		return fmt.Errorf("failed to write temp file: %w", err)
	}

	if err := os.Rename(tmpFile, filePath); err != nil {
		_ = os.Remove(tmpFile)
		return fmt.Errorf("failed to rename temp file: %w", err)
	}

	return nil
}

// ReadNode reads a node by ID and type
func (ns *NodeStore) ReadNode(id string, nodeType NodeType) (KnowledgeNode, error) {
	filePath := ns.getNodePath(id, nodeType)

	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return KnowledgeNode{}, fmt.Errorf("node not found: %s", id)
		}
		return KnowledgeNode{}, fmt.Errorf("failed to read node file: %w", err)
	}

	node, err := ParseNode(string(data))
	if err != nil {
		return KnowledgeNode{}, fmt.Errorf("failed to parse node: %w", err)
	}

	return node, nil
}

// UpdateNode updates an existing node
func (ns *NodeStore) UpdateNode(node KnowledgeNode) error {
	filePath := ns.getNodePath(node.ID, node.Type)

	// Check if exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return fmt.Errorf("node not found: %s", node.ID)
	}

	// Serialize
	markdown, err := SerializeNode(node)
	if err != nil {
		return fmt.Errorf("failed to serialize node: %w", err)
	}

	// Atomic write
	tmpFile := filePath + ".tmp"
	if err := os.WriteFile(tmpFile, []byte(markdown), 0644); err != nil {
		return fmt.Errorf("failed to write temp file: %w", err)
	}

	if err := os.Rename(tmpFile, filePath); err != nil {
		_ = os.Remove(tmpFile)
		return fmt.Errorf("failed to rename temp file: %w", err)
	}

	return nil
}

// DeleteNode deletes a node
func (ns *NodeStore) DeleteNode(id string, nodeType NodeType) error {
	filePath := ns.getNodePath(id, nodeType)

	if err := os.Remove(filePath); err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("node not found: %s", id)
		}
		return fmt.Errorf("failed to delete node: %w", err)
	}

	return nil
}

// FindNode finds a node by ID across all types
func (ns *NodeStore) FindNode(id string) (KnowledgeNode, error) {
	for _, nodeType := range NodeTypes {
		node, err := ns.ReadNode(id, nodeType)
		if err == nil {
			return node, nil
		}
	}
	return KnowledgeNode{}, fmt.Errorf("node not found: %s", id)
}

// ListByType lists all nodes of a given type
func (ns *NodeStore) ListByType(nodeType NodeType) ([]KnowledgeNode, error) {
	dir := filepath.Join(ns.rootPath, string(nodeType)+"s")

	files, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("failed to read directory: %w", err)
	}

	nodes := make([]KnowledgeNode, 0)
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".md") {
			id := strings.TrimSuffix(file.Name(), ".md")
			node, err := ns.ReadNode(id, nodeType)
			if err != nil {
				continue // Skip invalid files
			}
			nodes = append(nodes, node)
		}
	}

	return nodes, nil
}

// ListNodes lists all nodes with optional filtering
func (ns *NodeStore) ListNodes(filter *NodeFilter) ([]KnowledgeNode, error) {
	var types []NodeType
	if filter != nil && filter.Type != nil {
		types = []NodeType{*filter.Type}
	} else {
		types = NodeTypes
	}

	nodes := make([]KnowledgeNode, 0)
	for _, nodeType := range types {
		dir := filepath.Join(ns.rootPath, string(nodeType)+"s")

		if _, err := os.Stat(dir); os.IsNotExist(err) {
			continue
		}

		files, err := os.ReadDir(dir)
		if err != nil {
			continue
		}

		for _, file := range files {
			if !file.IsDir() && strings.HasSuffix(file.Name(), ".md") {
				id := strings.TrimSuffix(file.Name(), ".md")
				node, err := ns.ReadNode(id, nodeType)
				if err != nil {
					continue // Skip invalid files
				}

				if ns.matchesFilter(node, filter) {
					nodes = append(nodes, node)
				}
			}
		}
	}

	return nodes, nil
}

// matchesFilter checks if a node matches the filter criteria
func (ns *NodeStore) matchesFilter(node KnowledgeNode, filter *NodeFilter) bool {
	if filter == nil {
		return true
	}

	if filter.Type != nil && node.Type != *filter.Type {
		return false
	}

	if filter.Status != nil && node.Status != *filter.Status {
		return false
	}

	if filter.MinConfidence != nil && node.Confidence < *filter.MinConfidence {
		return false
	}

	if len(filter.Tags) > 0 {
		for _, filterTag := range filter.Tags {
			found := slices.Contains(node.Tags, filterTag)
			if !found {
				return false
			}
		}
	}

	if filter.RelatedTo != nil {
		found := false
		for _, rel := range node.Relations {
			if rel.Target == *filter.RelatedTo {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}

	if filter.SearchQuery != nil {
		query := strings.ToLower(*filter.SearchQuery)
		searchableText := strings.ToLower(
			node.Title + " " + node.Content + " " + strings.Join(node.Tags, " "),
		)
		if !strings.Contains(searchableText, query) {
			return false
		}
	}

	return true
}
