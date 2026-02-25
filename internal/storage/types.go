package storage

import "time"

// NodeType represents the category of a knowledge node
type NodeType string

const (
	NodeTypeDecision   NodeType = "decision"
	NodeTypeComponent  NodeType = "component"
	NodeTypeConvention NodeType = "convention"
	NodeTypeConcept    NodeType = "concept"
	NodeTypeSession    NodeType = "session"
	NodeTypePattern    NodeType = "pattern"
	NodeTypeIssue      NodeType = "issue"
)

// NodeTypes contains all valid node types
var NodeTypes = []NodeType{
	NodeTypeDecision,
	NodeTypeComponent,
	NodeTypeConvention,
	NodeTypeConcept,
	NodeTypeSession,
	NodeTypePattern,
	NodeTypeIssue,
}

// NodeStatus represents the lifecycle state of a node
type NodeStatus string

const (
	NodeStatusActive      NodeStatus = "active"
	NodeStatusNeedsReview NodeStatus = "needs_review"
	NodeStatusSuperseded  NodeStatus = "superseded"
)

// NodeStatuses contains all valid node statuses
var NodeStatuses = []NodeStatus{
	NodeStatusActive,
	NodeStatusNeedsReview,
	NodeStatusSuperseded,
}

// RelationType represents the type of relationship between nodes
type RelationType string

const (
	RelationTypeAffects     RelationType = "affects"
	RelationTypeUses        RelationType = "uses"
	RelationTypeSupersedes  RelationType = "supersedes"
	RelationTypeRelatesTo   RelationType = "relates_to"
	RelationTypeImplements  RelationType = "implements"
	RelationTypeDependsOn   RelationType = "depends_on"
	RelationTypeDerivedFrom RelationType = "derived_from"
)

// RelationTypes contains all valid relation types
var RelationTypes = []RelationType{
	RelationTypeAffects,
	RelationTypeUses,
	RelationTypeSupersedes,
	RelationTypeRelatesTo,
	RelationTypeImplements,
	RelationTypeDependsOn,
	RelationTypeDerivedFrom,
}

// Relation represents a typed relationship between nodes
type Relation struct {
	Type        RelationType `json:"type" yaml:"type"`
	Target      string       `json:"target" yaml:"target"`
	Description string       `json:"description,omitempty" yaml:"description,omitempty"`
	Confidence  float64      `json:"confidence" yaml:"confidence"`
}

// KnowledgeNode represents a knowledge item in the ontology
type KnowledgeNode struct {
	ID         string     `json:"id" yaml:"id"`
	Type       NodeType   `json:"type" yaml:"type"`
	Title      string     `json:"title" yaml:"title"`
	Content    string     `json:"content" yaml:"content"`
	Tags       []string   `json:"tags" yaml:"tags"`
	Relations  []Relation `json:"relations" yaml:"relations"`
	Confidence float64    `json:"confidence" yaml:"confidence"`
	Created    time.Time  `json:"created" yaml:"created"`
	Modified   time.Time  `json:"modified" yaml:"modified"`
	Session    string     `json:"session,omitempty" yaml:"session,omitempty"`
	Source     string     `json:"source" yaml:"source"`
	References []string   `json:"references" yaml:"references"`
	Status     NodeStatus `json:"status" yaml:"status"`
}

// NodeFilter defines search criteria for nodes
type NodeFilter struct {
	Type          *NodeType   // Filter by node type
	Tags          []string    // Filter by tags (all must match)
	Status        *NodeStatus // Filter by status
	MinConfidence *float64    // Minimum confidence threshold
	RelatedTo     *string     // Filter by relation to node ID
	SearchQuery   *string     // Full-text search query
}

// SearchResult represents a search result with relevance score
type SearchResult struct {
	Node  KnowledgeNode
	Score float64 // Relevance score 0.0 to 1.0
}

// CreateKnowledgeNode creates a new node with default values
func CreateKnowledgeNode(id string, nodeType NodeType, title, content string) KnowledgeNode {
	now := time.Now()
	return KnowledgeNode{
		ID:         id,
		Type:       nodeType,
		Title:      title,
		Content:    content,
		Tags:       []string{},
		Relations:  []Relation{},
		Confidence: 0.8,
		Created:    now,
		Modified:   now,
		Source:     "manual",
		References: []string{},
		Status:     NodeStatusActive,
	}
}

// UpdateKnowledgeNode creates a new node with updated fields (immutable pattern)
func UpdateKnowledgeNode(node KnowledgeNode, updates map[string]any) KnowledgeNode {
	updated := node
	updated.Modified = time.Now()

	if title, ok := updates["title"].(string); ok {
		updated.Title = title
	}
	if content, ok := updates["content"].(string); ok {
		updated.Content = content
	}
	if tags, ok := updates["tags"].([]string); ok {
		updated.Tags = tags
	}
	if status, ok := updates["status"].(NodeStatus); ok {
		updated.Status = status
	}
	if confidence, ok := updates["confidence"].(float64); ok {
		updated.Confidence = confidence
	}

	return updated
}
