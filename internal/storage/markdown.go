package storage

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

// SerializeNode converts a KnowledgeNode to Obsidian-compatible markdown
func SerializeNode(node KnowledgeNode) (string, error) {
	var buf bytes.Buffer

	// Write frontmatter delimiter
	buf.WriteString("---\n")

	// Serialize frontmatter as YAML
	frontmatter := map[string]interface{}{
		"id":         node.ID,
		"type":       string(node.Type),
		"title":      node.Title,
		"tags":       node.Tags,
		"relations":  node.Relations,
		"confidence": node.Confidence,
		"created":    node.Created.Format("2006-01-02T15:04:05Z07:00"),
		"modified":   node.Modified.Format("2006-01-02T15:04:05Z07:00"),
		"source":     node.Source,
		"references": node.References,
		"status":     string(node.Status),
	}

	if node.Session != "" {
		frontmatter["session"] = node.Session
	}

	encoder := yaml.NewEncoder(&buf)
	encoder.SetIndent(2)
	if err := encoder.Encode(frontmatter); err != nil {
		return "", fmt.Errorf("failed to encode frontmatter: %w", err)
	}
	encoder.Close()

	// Write closing delimiter
	buf.WriteString("---\n\n")

	// Write content
	buf.WriteString(node.Content)

	return buf.String(), nil
}

// ParseNode parses Obsidian-compatible markdown into a KnowledgeNode
func ParseNode(markdown string) (KnowledgeNode, error) {
	// Split frontmatter and content
	parts := strings.SplitN(markdown, "---", 3)
	if len(parts) < 3 {
		return KnowledgeNode{}, fmt.Errorf("invalid markdown format: missing frontmatter delimiters")
	}

	// Parse frontmatter
	var frontmatter map[string]interface{}
	if err := yaml.Unmarshal([]byte(parts[1]), &frontmatter); err != nil {
		return KnowledgeNode{}, fmt.Errorf("failed to parse frontmatter: %w", err)
	}

	// Extract content (trim leading newlines)
	content := strings.TrimLeft(parts[2], "\n")

	// Build node
	node := KnowledgeNode{
		ID:      getString(frontmatter, "id"),
		Type:    NodeType(getString(frontmatter, "type")),
		Title:   getString(frontmatter, "title"),
		Content: content,
		Tags:    getStringSlice(frontmatter, "tags"),
		Source:  getString(frontmatter, "source"),
		Status:  NodeStatus(getString(frontmatter, "status")),
	}

	// Parse confidence
	if conf, ok := frontmatter["confidence"].(float64); ok {
		node.Confidence = conf
	}

	// Parse timestamps
	if created, ok := frontmatter["created"].(string); ok {
		if t, err := parseTime(created); err == nil {
			node.Created = t
		}
	}
	if modified, ok := frontmatter["modified"].(string); ok {
		if t, err := parseTime(modified); err == nil {
			node.Modified = t
		}
	}

	// Parse optional session
	if session, ok := frontmatter["session"].(string); ok {
		node.Session = session
	}

	// Parse references
	node.References = getStringSlice(frontmatter, "references")

	// Parse relations
	if rels, ok := frontmatter["relations"].([]interface{}); ok {
		for _, r := range rels {
			if relMap, ok := r.(map[string]interface{}); ok {
				rel := Relation{
					Type:   RelationType(getString(relMap, "type")),
					Target: getString(relMap, "target"),
				}
				if desc, ok := relMap["description"].(string); ok {
					rel.Description = desc
				}
				if conf, ok := relMap["confidence"].(float64); ok {
					rel.Confidence = conf
				}
				node.Relations = append(node.Relations, rel)
			}
		}
	}

	return node, nil
}

// Helper functions
func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

func getStringSlice(m map[string]interface{}, key string) []string {
	if v, ok := m[key].([]interface{}); ok {
		result := make([]string, 0, len(v))
		for _, item := range v {
			if s, ok := item.(string); ok {
				result = append(result, s)
			}
		}
		return result
	}
	return []string{}
}

func parseTime(s string) (time.Time, error) {
	layouts := []string{
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02T15:04:05Z",
		time.RFC3339,
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("unable to parse time: %s", s)
}
