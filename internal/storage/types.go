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
