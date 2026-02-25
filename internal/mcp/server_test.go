package mcp

import (
	"os"
	"testing"

	"github.com/Curt-Park/autology/internal/storage"
)

// setupTestServer creates a test server with temporary storage
func setupTestServer(t *testing.T) (*Server, string) {
	tmpDir, err := os.MkdirTemp("", "autology-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}

	nodeStore := storage.NewNodeStore(tmpDir)
	if err := nodeStore.Initialize(); err != nil {
		_ = os.RemoveAll(tmpDir)
		t.Fatalf("Failed to initialize node store: %v", err)
	}

	server := NewServer("autology-test", "1.0.0", nodeStore)
	return server, tmpDir
}

// createTestNode creates a node for testing
func createTestNode(t *testing.T, server *Server, id, nodeType, title, content string) storage.KnowledgeNode {
	node := storage.CreateKnowledgeNode(id, storage.NodeType(nodeType), title, content)
	if err := server.nodeStore.CreateNode(node); err != nil {
		t.Fatalf("Failed to create test node: %v", err)
	}
	return node
}

func TestHandleUpdate(t *testing.T) {
	tests := []struct {
		name        string
		args        map[string]any
		setup       func(*Server)
		expectError bool
		errorMsg    string
	}{
		{
			name: "valid update - title only",
			args: map[string]any{
				"id":    "test-decision-1",
				"title": "Updated Title",
			},
			setup: func(s *Server) {
				createTestNode(t, s, "test-decision-1", "decision", "Original Title", "Original content")
			},
			expectError: false,
		},
		{
			name: "valid update - multiple fields",
			args: map[string]any{
				"id":         "test-decision-2",
				"title":      "New Title",
				"content":    "New content",
				"tags":       []any{"tag1", "tag2"},
				"status":     "superseded",
				"confidence": 0.9,
			},
			setup: func(s *Server) {
				createTestNode(t, s, "test-decision-2", "decision", "Old Title", "Old content")
			},
			expectError: false,
		},
		{
			name: "missing id",
			args: map[string]any{
				"title": "Some Title",
			},
			setup:       func(s *Server) {},
			expectError: true,
			errorMsg:    "id is required",
		},
		{
			name: "non-existent node",
			args: map[string]any{
				"id":    "nonexistent-id",
				"title": "Some Title",
			},
			setup:       func(s *Server) {},
			expectError: true,
			errorMsg:    "node not found",
		},
		{
			name: "no fields to update",
			args: map[string]any{
				"id": "test-decision-3",
			},
			setup: func(s *Server) {
				createTestNode(t, s, "test-decision-3", "decision", "Title", "Content")
			},
			expectError: true,
			errorMsg:    "no fields to update",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server, tmpDir := setupTestServer(t)
			defer func() { _ = os.RemoveAll(tmpDir) }()

			tt.setup(server)

			result, err := server.handleUpdate(tt.args)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error but got none")
				} else if tt.errorMsg != "" && err.Error() != tt.errorMsg {
					// Check if error contains expected message
					if tt.errorMsg == "node not found" && err.Error()[:14] != "node not found" {
						t.Errorf("Expected error containing '%s', got '%s'", tt.errorMsg, err.Error())
					}
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				}
				if result == nil {
					t.Errorf("Expected result but got nil")
				}
			}
		})
	}
}

func TestHandleDelete(t *testing.T) {
	tests := []struct {
		name        string
		args        map[string]any
		setup       func(*Server)
		expectError bool
		errorMsg    string
	}{
		{
			name: "valid delete",
			args: map[string]any{
				"id": "test-decision-1",
			},
			setup: func(s *Server) {
				createTestNode(t, s, "test-decision-1", "decision", "Title", "Content")
			},
			expectError: false,
		},
		{
			name: "delete with relations",
			args: map[string]any{
				"id": "test-decision-2",
			},
			setup: func(s *Server) {
				node := createTestNode(t, s, "test-decision-2", "decision", "Source", "Content")
				createTestNode(t, s, "test-component-1", "component", "Target", "Content")
				// Add relation to node
				node.Relations = append(node.Relations, storage.Relation{
					Type:        storage.RelationTypeAffects,
					Target:      "test-component-1",
					Description: "Test relation",
					Confidence:  0.8,
				})
				if err := s.nodeStore.UpdateNode(node); err != nil {
					t.Fatalf("failed to update node with relation: %v", err)
				}
			},
			expectError: false,
		},
		{
			name:        "missing id",
			args:        map[string]any{},
			setup:       func(s *Server) {},
			expectError: true,
			errorMsg:    "id is required",
		},
		{
			name: "non-existent node",
			args: map[string]any{
				"id": "nonexistent-id",
			},
			setup:       func(s *Server) {},
			expectError: true,
			errorMsg:    "node not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server, tmpDir := setupTestServer(t)
			defer func() { _ = os.RemoveAll(tmpDir) }()

			tt.setup(server)

			result, err := server.handleDelete(tt.args)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				}
				if result == nil {
					t.Errorf("Expected result but got nil")
				}

				// Verify node is deleted
				id := tt.args["id"].(string)
				_, err := server.nodeStore.FindNode(id)
				if err == nil {
					t.Errorf("Node should be deleted but still exists")
				}
			}
		})
	}
}

func TestHandleRelate(t *testing.T) {
	tests := []struct {
		name        string
		args        map[string]any
		setup       func(*Server)
		expectError bool
		errorMsg    string
	}{
		{
			name: "valid relation",
			args: map[string]any{
				"source": "test-decision-1",
				"target": "test-component-1",
				"type":   "affects",
			},
			setup: func(s *Server) {
				createTestNode(t, s, "test-decision-1", "decision", "Decision", "Content")
				createTestNode(t, s, "test-component-1", "component", "Component", "Content")
			},
			expectError: false,
		},
		{
			name: "relation with description and confidence",
			args: map[string]any{
				"source":      "test-pattern-1",
				"target":      "test-component-2",
				"type":        "implements",
				"description": "Repository pattern implementation",
				"confidence":  0.95,
			},
			setup: func(s *Server) {
				createTestNode(t, s, "test-pattern-1", "pattern", "Pattern", "Content")
				createTestNode(t, s, "test-component-2", "component", "Component", "Content")
			},
			expectError: false,
		},
		{
			name: "missing source",
			args: map[string]any{
				"target": "test-component-1",
				"type":   "affects",
			},
			setup:       func(s *Server) {},
			expectError: true,
			errorMsg:    "source is required",
		},
		{
			name: "missing target",
			args: map[string]any{
				"source": "test-decision-1",
				"type":   "affects",
			},
			setup:       func(s *Server) {},
			expectError: true,
			errorMsg:    "target is required",
		},
		{
			name: "missing type",
			args: map[string]any{
				"source": "test-decision-1",
				"target": "test-component-1",
			},
			setup:       func(s *Server) {},
			expectError: true,
			errorMsg:    "type is required",
		},
		{
			name: "non-existent source",
			args: map[string]any{
				"source": "nonexistent-source",
				"target": "test-component-1",
				"type":   "affects",
			},
			setup: func(s *Server) {
				createTestNode(t, s, "test-component-1", "component", "Component", "Content")
			},
			expectError: true,
			errorMsg:    "source node not found",
		},
		{
			name: "non-existent target",
			args: map[string]any{
				"source": "test-decision-1",
				"target": "nonexistent-target",
				"type":   "affects",
			},
			setup: func(s *Server) {
				createTestNode(t, s, "test-decision-1", "decision", "Decision", "Content")
			},
			expectError: true,
			errorMsg:    "target node not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server, tmpDir := setupTestServer(t)
			defer func() { _ = os.RemoveAll(tmpDir) }()

			tt.setup(server)

			result, err := server.handleRelate(tt.args)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				}
				if result == nil {
					t.Errorf("Expected result but got nil")
				}
			}
		})
	}
}

func TestHandleUnrelate(t *testing.T) {
	tests := []struct {
		name        string
		args        map[string]any
		setup       func(*Server)
		expectError bool
		errorMsg    string
	}{
		{
			name: "valid unrelate",
			args: map[string]any{
				"source": "test-decision-1",
				"target": "test-component-1",
				"type":   "affects",
			},
			setup: func(s *Server) {
				node := createTestNode(t, s, "test-decision-1", "decision", "Decision", "Content")
				createTestNode(t, s, "test-component-1", "component", "Component", "Content")
				// Add relation to node
				node.Relations = append(node.Relations, storage.Relation{
					Type:        storage.RelationTypeAffects,
					Target:      "test-component-1",
					Description: "Test",
					Confidence:  0.8,
				})
				node.Content += "\n\n## Related\n- [[test-component-1]]\n"
				if err := s.nodeStore.UpdateNode(node); err != nil {
					t.Fatalf("failed to update node with relation: %v", err)
				}
			},
			expectError: false,
		},
		{
			name: "missing source",
			args: map[string]any{
				"target": "test-component-1",
				"type":   "affects",
			},
			setup:       func(s *Server) {},
			expectError: true,
			errorMsg:    "source is required",
		},
		{
			name: "missing target",
			args: map[string]any{
				"source": "test-decision-1",
				"type":   "affects",
			},
			setup:       func(s *Server) {},
			expectError: true,
			errorMsg:    "target is required",
		},
		{
			name: "missing type",
			args: map[string]any{
				"source": "test-decision-1",
				"target": "test-component-1",
			},
			setup:       func(s *Server) {},
			expectError: true,
			errorMsg:    "type is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server, tmpDir := setupTestServer(t)
			defer func() { _ = os.RemoveAll(tmpDir) }()

			tt.setup(server)

			result, err := server.handleUnrelate(tt.args)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				}
				if result == nil {
					t.Errorf("Expected result but got nil")
				}

				// Verify relation is removed
				source := tt.args["source"].(string)
				node, err := server.nodeStore.FindNode(source)
				if err != nil {
					t.Fatalf("Failed to find node: %v", err)
				}
				if len(node.Relations) > 0 {
					t.Errorf("Relation should be removed but still exists")
				}
			}
		})
	}
}

func TestToolRegistration(t *testing.T) {
	server, tmpDir := setupTestServer(t)
	defer func() { _ = os.RemoveAll(tmpDir) }()

	expectedTools := []string{
		"autology_query",
		"autology_status",
		"autology_capture",
		"autology_update",
		"autology_delete",
		"autology_relate",
		"autology_unrelate",
	}

	if len(server.tools) != len(expectedTools) {
		t.Errorf("Expected %d tools, got %d", len(expectedTools), len(server.tools))
	}

	for _, toolName := range expectedTools {
		if _, exists := server.tools[toolName]; !exists {
			t.Errorf("Expected tool '%s' to be registered", toolName)
		}
	}
}
