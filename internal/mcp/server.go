package mcp

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os"

	"github.com/Curt-Park/autology/internal/classification"
	"github.com/Curt-Park/autology/internal/enrichment"
	"github.com/Curt-Park/autology/internal/storage"
)

// Server represents an MCP server
type Server struct {
	name         string
	version      string
	nodeStore    *storage.NodeStore
	graphIndex   *storage.GraphIndexStore
	searchEngine *storage.SearchEngine
	tools        map[string]Tool
}

// Tool represents an MCP tool
type Tool struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	InputSchema map[string]interface{} `json:"inputSchema"`
	Handler     func(map[string]interface{}) (interface{}, error)
}

// JSONRPCRequest represents a JSON-RPC 2.0 request
type JSONRPCRequest struct {
	JSONRPC string                 `json:"jsonrpc"`
	ID      interface{}            `json:"id"`
	Method  string                 `json:"method"`
	Params  map[string]interface{} `json:"params,omitempty"`
}

// JSONRPCResponse represents a JSON-RPC 2.0 response
type JSONRPCResponse struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      interface{} `json:"id"`
	Result  interface{} `json:"result,omitempty"`
	Error   *RPCError   `json:"error,omitempty"`
}

// RPCError represents a JSON-RPC error
type RPCError struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// NewServer creates a new MCP server
func NewServer(name, version string, nodeStore *storage.NodeStore, graphIndex *storage.GraphIndexStore) *Server {
	searchEngine := storage.NewSearchEngine(nodeStore, graphIndex)

	s := &Server{
		name:         name,
		version:      version,
		nodeStore:    nodeStore,
		graphIndex:   graphIndex,
		searchEngine: searchEngine,
		tools:        make(map[string]Tool),
	}

	// Register tools
	s.registerTools()

	return s
}

// Run starts the MCP server on stdio
func (s *Server) Run() error {
	fmt.Fprintf(os.Stderr, "%s MCP server v%s running on stdio\n", s.name, s.version)

	reader := bufio.NewReader(os.Stdin)
	writer := bufio.NewWriter(os.Stdout)

	for {
		// Read JSON-RPC request
		line, err := reader.ReadBytes('\n')
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return fmt.Errorf("error reading request: %w", err)
		}

		// Parse request
		var req JSONRPCRequest
		if err := json.Unmarshal(line, &req); err != nil {
			s.sendError(writer, nil, -32700, "Parse error", nil)
			continue
		}

		// Handle request
		s.handleRequest(writer, &req)
	}
}

// handleRequest handles a JSON-RPC request
func (s *Server) handleRequest(w *bufio.Writer, req *JSONRPCRequest) {
	switch req.Method {
	case "initialize":
		s.handleInitialize(w, req)
	case "tools/list":
		s.handleToolsList(w, req)
	case "tools/call":
		s.handleToolsCall(w, req)
	default:
		s.sendError(w, req.ID, -32601, "Method not found", nil)
	}
}

// handleInitialize handles the initialize request
func (s *Server) handleInitialize(w *bufio.Writer, req *JSONRPCRequest) {
	result := map[string]interface{}{
		"protocolVersion": "2024-11-05",
		"capabilities": map[string]interface{}{
			"tools": map[string]interface{}{},
		},
		"serverInfo": map[string]interface{}{
			"name":    s.name,
			"version": s.version,
		},
	}

	s.sendResult(w, req.ID, result)
}

// handleToolsList handles the tools/list request
func (s *Server) handleToolsList(w *bufio.Writer, req *JSONRPCRequest) {
	tools := make([]map[string]interface{}, 0, len(s.tools))

	for _, tool := range s.tools {
		tools = append(tools, map[string]interface{}{
			"name":        tool.Name,
			"description": tool.Description,
			"inputSchema": tool.InputSchema,
		})
	}

	result := map[string]interface{}{
		"tools": tools,
	}

	s.sendResult(w, req.ID, result)
}

// handleToolsCall handles the tools/call request
func (s *Server) handleToolsCall(w *bufio.Writer, req *JSONRPCRequest) {
	params := req.Params
	if params == nil {
		s.sendError(w, req.ID, -32602, "Invalid params", nil)
		return
	}

	name, ok := params["name"].(string)
	if !ok {
		s.sendError(w, req.ID, -32602, "Missing tool name", nil)
		return
	}

	arguments, ok := params["arguments"].(map[string]interface{})
	if !ok {
		arguments = make(map[string]interface{})
	}

	tool, exists := s.tools[name]
	if !exists {
		s.sendError(w, req.ID, -32602, fmt.Sprintf("Tool not found: %s", name), nil)
		return
	}

	// Call tool handler
	result, err := tool.Handler(arguments)
	if err != nil {
		s.sendError(w, req.ID, -32603, err.Error(), nil)
		return
	}

	s.sendResult(w, req.ID, map[string]interface{}{
		"content": []map[string]interface{}{
			{
				"type": "text",
				"text": result,
			},
		},
	})
}

// sendResult sends a JSON-RPC result
func (s *Server) sendResult(w *bufio.Writer, id interface{}, result interface{}) {
	resp := JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Result:  result,
	}

	data, _ := json.Marshal(resp)
	_, _ = w.Write(data)
	_ = w.WriteByte('\n')
	_ = w.Flush()
}

// sendError sends a JSON-RPC error
func (s *Server) sendError(w *bufio.Writer, id interface{}, code int, message string, data interface{}) {
	resp := JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Error: &RPCError{
			Code:    code,
			Message: message,
			Data:    data,
		},
	}

	jsonData, _ := json.Marshal(resp)
	_, _ = w.Write(jsonData)
	_ = w.WriteByte('\n')
	_ = w.Flush()
}

// registerTools registers all MCP tools
func (s *Server) registerTools() {
	// Read
	s.tools["autology_query"] = s.createQueryTool()
	s.tools["autology_status"] = s.createStatusTool()
	// Create
	s.tools["autology_capture"] = s.createCaptureTool()
	// Update
	s.tools["autology_update"] = s.createUpdateTool()
	// Delete
	s.tools["autology_delete"] = s.createDeleteTool()
	// Relation CUD
	s.tools["autology_relate"] = s.createRelateTool()
	s.tools["autology_unrelate"] = s.createUnrelateTool()
}

// createCaptureTool creates the capture tool
func (s *Server) createCaptureTool() Tool {
	return Tool{
		Name:        "autology_capture",
		Description: "Capture knowledge as a typed node (decision, component, convention, concept, pattern, issue, session)",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"title": map[string]interface{}{
					"type":        "string",
					"description": "Title of the knowledge node",
				},
				"content": map[string]interface{}{
					"type":        "string",
					"description": "Detailed content in markdown format",
				},
				"type": map[string]interface{}{
					"type":        "string",
					"description": "Node type (decision, component, convention, concept, pattern, issue, session)",
					"enum":        []string{"decision", "component", "convention", "concept", "pattern", "issue", "session"},
				},
				"tags": map[string]interface{}{
					"type":        "array",
					"description": "Tags for categorization",
					"items": map[string]interface{}{
						"type": "string",
					},
				},
			},
			"required": []string{"title", "content"},
		},
		Handler: s.handleCapture,
	}
}

// createQueryTool creates the query tool
func (s *Server) createQueryTool() Tool {
	return Tool{
		Name:        "autology_query",
		Description: "Search knowledge nodes by type, tags, content, or relationships",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"query": map[string]interface{}{
					"type":        "string",
					"description": "Search query text",
				},
				"type": map[string]interface{}{
					"type":        "string",
					"description": "Filter by node type",
				},
				"tags": map[string]interface{}{
					"type":        "array",
					"description": "Filter by tags (all must match)",
					"items": map[string]interface{}{
						"type": "string",
					},
				},
				"limit": map[string]interface{}{
					"type":        "number",
					"description": "Maximum number of results (default: 10)",
				},
			},
		},
		Handler: s.handleQuery,
	}
}

// createStatusTool creates the status tool
func (s *Server) createStatusTool() Tool {
	return Tool{
		Name:        "autology_status",
		Description: "Get overview of knowledge graph statistics and health",
		InputSchema: map[string]interface{}{
			"type":       "object",
			"properties": map[string]interface{}{},
		},
		Handler: s.handleStatus,
	}
}

// handleCapture handles the capture tool
func (s *Server) handleCapture(args map[string]interface{}) (interface{}, error) {
	title, _ := args["title"].(string)
	content, _ := args["content"].(string)
	typeHint, _ := args["type"].(string)
	tagsRaw, _ := args["tags"].([]interface{})

	if title == "" || content == "" {
		return nil, fmt.Errorf("title and content are required")
	}

	// Convert tags
	tags := make([]string, 0)
	for _, t := range tagsRaw {
		if str, ok := t.(string); ok {
			tags = append(tags, str)
		}
	}

	// Classify if no type hint
	var nodeType storage.NodeType
	if typeHint != "" {
		nodeType = storage.NodeType(typeHint)
	} else {
		result := classification.ClassifyNodeType(title, content, "manual")
		nodeType = result.Type
	}

	// Generate ID
	id := fmt.Sprintf("%s-%d", nodeType, len(title)+len(content))

	// Create node
	node := storage.CreateKnowledgeNode(id, nodeType, title, content)
	node.Tags = tags

	// Infer relations
	existingNodes, _ := s.nodeStore.ListNodes(nil)
	inferred := enrichment.InferRelations(node, existingNodes)

	// Auto-create high-confidence relations
	grouped := enrichment.GroupByAction(inferred, 0.7)
	for _, rel := range grouped.AutoCreate {
		node.Relations = append(node.Relations, storage.Relation{
			Type:        rel.Type,
			Target:      rel.Target,
			Description: rel.Reasoning,
			Confidence:  rel.Confidence,
		})
	}

	// Save node
	if err := s.nodeStore.CreateNode(node); err != nil {
		return nil, fmt.Errorf("failed to save node: %w", err)
	}

	// Save relations to graph index
	for _, rel := range node.Relations {
		_ = s.graphIndex.AddRelation(node.ID, rel.Target, rel.Type, rel.Description, rel.Confidence)
	}

	return fmt.Sprintf("✓ Captured: %s (%s)\nID: %s\nRelations: %d auto-created, %d suggested",
		title, nodeType, node.ID, len(grouped.AutoCreate), len(grouped.Suggest)), nil
}

// handleQuery handles the query tool
func (s *Server) handleQuery(args map[string]interface{}) (interface{}, error) {
	query, _ := args["query"].(string)
	typeFilter, _ := args["type"].(string)
	limit := 10
	if l, ok := args["limit"].(float64); ok {
		limit = int(l)
	}

	filter := &storage.NodeFilter{}
	if query != "" {
		filter.SearchQuery = &query
	}
	if typeFilter != "" {
		nt := storage.NodeType(typeFilter)
		filter.Type = &nt
	}

	results, err := s.searchEngine.Search(filter, limit, 0)
	if err != nil {
		return nil, err
	}

	if len(results) == 0 {
		return "No results found.", nil
	}

	output := fmt.Sprintf("Found %d results:\n\n", len(results))
	for i, result := range results {
		output += fmt.Sprintf("%d. **%s** (%s) - Score: %.0f%%\n", i+1, result.Node.Title, result.Node.Type, result.Score*100)
		preview := result.Node.Content
		if len(preview) > 100 {
			preview = preview[:100] + "..."
		}
		output += fmt.Sprintf("   %s\n\n", preview)
	}

	return output, nil
}

// handleStatus handles the status tool
func (s *Server) handleStatus(args map[string]interface{}) (interface{}, error) {
	// Count nodes by type
	counts := make(map[storage.NodeType]int)
	for _, nodeType := range storage.NodeTypes {
		nodes, _ := s.nodeStore.ListByType(nodeType)
		counts[nodeType] = len(nodes)
	}

	total := 0
	for _, count := range counts {
		total += count
	}

	output := "# Autology Knowledge Graph Status\n\n"
	output += fmt.Sprintf("**Total Nodes**: %d\n\n", total)
	output += "**By Type**:\n"
	for _, nodeType := range storage.NodeTypes {
		output += fmt.Sprintf("- %s: %d\n", nodeType, counts[nodeType])
	}

	return output, nil
}

// createUpdateTool creates the update tool
func (s *Server) createUpdateTool() Tool {
	return Tool{
		Name:        "autology_update",
		Description: "Update an existing knowledge node",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"id": map[string]interface{}{
					"type":        "string",
					"description": "ID of the node to update (required)",
				},
				"title": map[string]interface{}{
					"type":        "string",
					"description": "New title",
				},
				"content": map[string]interface{}{
					"type":        "string",
					"description": "New content in markdown format",
				},
				"tags": map[string]interface{}{
					"type":        "array",
					"description": "New tags",
					"items": map[string]interface{}{
						"type": "string",
					},
				},
				"status": map[string]interface{}{
					"type":        "string",
					"description": "New status (active, needs_review, superseded)",
					"enum":        []string{"active", "needs_review", "superseded"},
				},
				"confidence": map[string]interface{}{
					"type":        "number",
					"description": "New confidence score (0.0 to 1.0)",
				},
			},
			"required": []string{"id"},
		},
		Handler: s.handleUpdate,
	}
}

// handleUpdate handles the update tool
func (s *Server) handleUpdate(args map[string]interface{}) (interface{}, error) {
	id, ok := args["id"].(string)
	if !ok || id == "" {
		return nil, fmt.Errorf("id is required")
	}

	// Find existing node
	node, err := s.nodeStore.FindNode(id)
	if err != nil {
		return nil, fmt.Errorf("node not found: %s", id)
	}

	// Build updates map
	updates := make(map[string]interface{})
	fieldsChanged := []string{}

	if title, ok := args["title"].(string); ok {
		updates["title"] = title
		fieldsChanged = append(fieldsChanged, "title")
	}
	if content, ok := args["content"].(string); ok {
		updates["content"] = content
		fieldsChanged = append(fieldsChanged, "content")
	}
	if tagsRaw, ok := args["tags"].([]interface{}); ok {
		tags := make([]string, 0)
		for _, t := range tagsRaw {
			if str, ok := t.(string); ok {
				tags = append(tags, str)
			}
		}
		updates["tags"] = tags
		fieldsChanged = append(fieldsChanged, "tags")
	}
	if status, ok := args["status"].(string); ok {
		updates["status"] = storage.NodeStatus(status)
		fieldsChanged = append(fieldsChanged, "status")
	}
	if confidence, ok := args["confidence"].(float64); ok {
		updates["confidence"] = confidence
		fieldsChanged = append(fieldsChanged, "confidence")
	}

	if len(updates) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}

	// Update node
	updatedNode := storage.UpdateKnowledgeNode(node, updates)
	if err := s.nodeStore.UpdateNode(updatedNode); err != nil {
		return nil, fmt.Errorf("failed to update node: %w", err)
	}

	fieldsStr := ""
	for i, field := range fieldsChanged {
		if i > 0 {
			fieldsStr += ", "
		}
		fieldsStr += field
	}

	return fmt.Sprintf("✓ Updated: %s (%s)\nFields changed: %s", updatedNode.Title, updatedNode.Type, fieldsStr), nil
}

// createDeleteTool creates the delete tool
func (s *Server) createDeleteTool() Tool {
	return Tool{
		Name:        "autology_delete",
		Description: "Delete a knowledge node and its relations",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"id": map[string]interface{}{
					"type":        "string",
					"description": "ID of the node to delete (required)",
				},
			},
			"required": []string{"id"},
		},
		Handler: s.handleDelete,
	}
}

// handleDelete handles the delete tool
func (s *Server) handleDelete(args map[string]interface{}) (interface{}, error) {
	id, ok := args["id"].(string)
	if !ok || id == "" {
		return nil, fmt.Errorf("id is required")
	}

	// Find node to get type and title
	node, err := s.nodeStore.FindNode(id)
	if err != nil {
		return nil, fmt.Errorf("node not found: %s", id)
	}

	// Count relations before removal
	relations := s.graphIndex.GetNodeRelations(id)
	relCount := len(relations)

	// Remove all relations
	if err := s.graphIndex.RemoveNodeRelations(id); err != nil {
		return nil, fmt.Errorf("failed to remove relations: %w", err)
	}

	// Delete node
	if err := s.nodeStore.DeleteNode(id, node.Type); err != nil {
		return nil, fmt.Errorf("failed to delete node: %w", err)
	}

	return fmt.Sprintf("✓ Deleted: %s (%s)\nRelations removed: %d", node.Title, node.Type, relCount), nil
}

// createRelateTool creates the relate tool
func (s *Server) createRelateTool() Tool {
	return Tool{
		Name:        "autology_relate",
		Description: "Create or update a relation between two nodes",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"source": map[string]interface{}{
					"type":        "string",
					"description": "Source node ID (required)",
				},
				"target": map[string]interface{}{
					"type":        "string",
					"description": "Target node ID (required)",
				},
				"type": map[string]interface{}{
					"type":        "string",
					"description": "Relation type (required)",
					"enum":        []string{"affects", "uses", "supersedes", "relates_to", "implements", "depends_on", "derived_from"},
				},
				"description": map[string]interface{}{
					"type":        "string",
					"description": "Description of the relationship",
				},
				"confidence": map[string]interface{}{
					"type":        "number",
					"description": "Confidence score (0.0 to 1.0, default: 0.8)",
				},
			},
			"required": []string{"source", "target", "type"},
		},
		Handler: s.handleRelate,
	}
}

// handleRelate handles the relate tool
func (s *Server) handleRelate(args map[string]interface{}) (interface{}, error) {
	source, ok := args["source"].(string)
	if !ok || source == "" {
		return nil, fmt.Errorf("source is required")
	}
	target, ok := args["target"].(string)
	if !ok || target == "" {
		return nil, fmt.Errorf("target is required")
	}
	relType, ok := args["type"].(string)
	if !ok || relType == "" {
		return nil, fmt.Errorf("type is required")
	}

	// Validate source and target exist
	if _, err := s.nodeStore.FindNode(source); err != nil {
		return nil, fmt.Errorf("source node not found: %s", source)
	}
	if _, err := s.nodeStore.FindNode(target); err != nil {
		return nil, fmt.Errorf("target node not found: %s", target)
	}

	description, _ := args["description"].(string)
	confidence := 0.8
	if conf, ok := args["confidence"].(float64); ok {
		confidence = conf
	}

	// Add relation (upsert)
	if err := s.graphIndex.AddRelation(source, target, storage.RelationType(relType), description, confidence); err != nil {
		return nil, fmt.Errorf("failed to add relation: %w", err)
	}

	return fmt.Sprintf("✓ Related: %s —[%s]→ %s", source, relType, target), nil
}

// createUnrelateTool creates the unrelate tool
func (s *Server) createUnrelateTool() Tool {
	return Tool{
		Name:        "autology_unrelate",
		Description: "Delete a relation between two nodes",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"source": map[string]interface{}{
					"type":        "string",
					"description": "Source node ID (required)",
				},
				"target": map[string]interface{}{
					"type":        "string",
					"description": "Target node ID (required)",
				},
				"type": map[string]interface{}{
					"type":        "string",
					"description": "Relation type (required)",
					"enum":        []string{"affects", "uses", "supersedes", "relates_to", "implements", "depends_on", "derived_from"},
				},
			},
			"required": []string{"source", "target", "type"},
		},
		Handler: s.handleUnrelate,
	}
}

// handleUnrelate handles the unrelate tool
func (s *Server) handleUnrelate(args map[string]interface{}) (interface{}, error) {
	source, ok := args["source"].(string)
	if !ok || source == "" {
		return nil, fmt.Errorf("source is required")
	}
	target, ok := args["target"].(string)
	if !ok || target == "" {
		return nil, fmt.Errorf("target is required")
	}
	relType, ok := args["type"].(string)
	if !ok || relType == "" {
		return nil, fmt.Errorf("type is required")
	}

	// Remove relation
	if err := s.graphIndex.RemoveRelation(source, target, storage.RelationType(relType)); err != nil {
		return nil, fmt.Errorf("failed to remove relation: %w", err)
	}

	return fmt.Sprintf("✓ Removed relation: %s —[%s]→ %s", source, relType, target), nil
}
