package enrichment

import (
	"strings"

	"github.com/Curt-Park/autology/internal/storage"
)

// InferredRelation represents an inferred relationship between nodes
type InferredRelation struct {
	Source     string
	Target     string
	Type       storage.RelationType
	Confidence float64
	Reasoning  string
}

// InferRelations infers relations for a new node based on existing nodes
func InferRelations(newNode storage.KnowledgeNode, existingNodes []storage.KnowledgeNode) []InferredRelation {
	inferred := make([]InferredRelation, 0)

	for _, existing := range existingNodes {
		// Skip self
		if existing.ID == newNode.ID {
			continue
		}

		// Check various relation signals
		tagOverlap := calculateTagOverlap(newNode.Tags, existing.Tags)
		fileOverlap := calculateFileOverlap(newNode.References, existing.References)
		sameSession := newNode.Session != "" && newNode.Session == existing.Session
		titleSimilarity := calculateTitleSimilarity(newNode.Title, existing.Title)

		// Infer specific relation types
		relation := inferSpecificRelation(newNode, existing, relationSignals{
			tagOverlap:      tagOverlap,
			fileOverlap:     fileOverlap,
			sameSession:     sameSession,
			titleSimilarity: titleSimilarity,
		})

		if relation != nil {
			inferred = append(inferred, *relation)
		}
	}

	// Sort by confidence descending
	for i := 0; i < len(inferred)-1; i++ {
		for j := i + 1; j < len(inferred); j++ {
			if inferred[j].Confidence > inferred[i].Confidence {
				inferred[i], inferred[j] = inferred[j], inferred[i]
			}
		}
	}

	return inferred
}

type relationSignals struct {
	tagOverlap      float64
	fileOverlap     int
	sameSession     bool
	titleSimilarity float64
}

// inferSpecificRelation infers specific relation type based on signals
func inferSpecificRelation(source, target storage.KnowledgeNode, signals relationSignals) *InferredRelation {
	// Rule 1: Decision affects component
	if source.Type == storage.NodeTypeDecision && target.Type == storage.NodeTypeComponent {
		if signals.tagOverlap > 0.3 || signals.fileOverlap > 0 {
			confidence := 0.7 + signals.tagOverlap*0.2
			return &InferredRelation{
				Source:     source.ID,
				Target:     target.ID,
				Type:       storage.RelationTypeAffects,
				Confidence: confidence,
				Reasoning:  formatReasoning("Decision affects component (tag overlap: %.0f%%)", signals.tagOverlap*100),
			}
		}
	}

	// Rule 2: Component uses pattern
	if source.Type == storage.NodeTypeComponent && target.Type == storage.NodeTypePattern {
		if signals.tagOverlap > 0.4 || containsPatternReference(source.Content, target.Title) {
			return &InferredRelation{
				Source:     source.ID,
				Target:     target.ID,
				Type:       storage.RelationTypeImplements,
				Confidence: 0.75,
				Reasoning:  "Component implements pattern",
			}
		}
	}

	// Rule 3: Component uses another component
	if source.Type == storage.NodeTypeComponent && target.Type == storage.NodeTypeComponent {
		if signals.fileOverlap > 0 {
			return &InferredRelation{
				Source:     source.ID,
				Target:     target.ID,
				Type:       storage.RelationTypeUses,
				Confidence: 0.8,
				Reasoning:  formatReasoning("Shared file references: %d file(s)", signals.fileOverlap),
			}
		}
	}

	// Rule 4: Decision supersedes decision
	if source.Type == storage.NodeTypeDecision && target.Type == storage.NodeTypeDecision {
		if containsSupersession(source.Content, target.Title) || containsSupersession(source.Title, target.Title) {
			return &InferredRelation{
				Source:     source.ID,
				Target:     target.ID,
				Type:       storage.RelationTypeSupersedes,
				Confidence: 0.85,
				Reasoning:  "Decision supersedes previous decision",
			}
		}
	}

	// Rule 5: Convention applies to component
	if source.Type == storage.NodeTypeConvention && target.Type == storage.NodeTypeComponent {
		if signals.tagOverlap > 0.3 {
			return &InferredRelation{
				Source:     source.ID,
				Target:     target.ID,
				Type:       storage.RelationTypeRelatesTo,
				Confidence: 0.65,
				Reasoning:  "Convention relates to component",
			}
		}
	}

	// Rule 6: Same session relations (weak)
	if signals.sameSession && signals.tagOverlap > 0.2 {
		return &InferredRelation{
			Source:     source.ID,
			Target:     target.ID,
			Type:       storage.RelationTypeRelatesTo,
			Confidence: 0.6,
			Reasoning:  "Created in same session with shared tags",
		}
	}

	// Rule 7: High tag overlap (generic)
	if signals.tagOverlap > 0.5 {
		confidence := 0.55 + signals.tagOverlap*0.15
		return &InferredRelation{
			Source:     source.ID,
			Target:     target.ID,
			Type:       storage.RelationTypeRelatesTo,
			Confidence: confidence,
			Reasoning:  formatReasoning("High tag overlap: %.0f%%", signals.tagOverlap*100),
		}
	}

	return nil
}

// calculateTagOverlap calculates tag overlap ratio (Jaccard index)
func calculateTagOverlap(tags1, tags2 []string) float64 {
	if len(tags1) == 0 || len(tags2) == 0 {
		return 0
	}

	// Convert to lowercase sets
	set1 := make(map[string]bool)
	for _, tag := range tags1 {
		set1[strings.ToLower(tag)] = true
	}

	set2 := make(map[string]bool)
	for _, tag := range tags2 {
		set2[strings.ToLower(tag)] = true
	}

	// Calculate intersection
	intersection := 0
	for tag := range set1 {
		if set2[tag] {
			intersection++
		}
	}

	// Calculate union
	union := make(map[string]bool)
	for tag := range set1 {
		union[tag] = true
	}
	for tag := range set2 {
		union[tag] = true
	}

	return float64(intersection) / float64(len(union))
}

// calculateFileOverlap calculates number of shared file references
func calculateFileOverlap(refs1, refs2 []string) int {
	if len(refs1) == 0 || len(refs2) == 0 {
		return 0
	}

	set1 := make(map[string]bool)
	for _, ref := range refs1 {
		set1[ref] = true
	}

	overlap := 0
	for _, ref := range refs2 {
		if set1[ref] {
			overlap++
		}
	}

	return overlap
}

// calculateTitleSimilarity calculates title similarity using word overlap
func calculateTitleSimilarity(title1, title2 string) float64 {
	// Extract words > 3 characters
	words1 := make(map[string]bool)
	for _, word := range strings.Fields(strings.ToLower(title1)) {
		if len(word) > 3 {
			words1[word] = true
		}
	}

	words2 := make(map[string]bool)
	for _, word := range strings.Fields(strings.ToLower(title2)) {
		if len(word) > 3 {
			words2[word] = true
		}
	}

	if len(words1) == 0 || len(words2) == 0 {
		return 0
	}

	// Calculate intersection
	intersection := 0
	for word := range words1 {
		if words2[word] {
			intersection++
		}
	}

	// Calculate union
	union := make(map[string]bool)
	for word := range words1 {
		union[word] = true
	}
	for word := range words2 {
		union[word] = true
	}

	return float64(intersection) / float64(len(union))
}

// containsPatternReference checks if content references a pattern name
func containsPatternReference(content, patternName string) bool {
	contentLower := strings.ToLower(content)
	patternLower := strings.ToLower(patternName)

	if strings.Contains(contentLower, patternLower) {
		return true
	}

	// Try without "pattern" suffix
	withoutPattern := strings.Replace(patternLower, " pattern", "", -1)
	if strings.Contains(contentLower, withoutPattern) {
		return true
	}

	// Try with spaces instead of hyphens
	withSpaces := strings.Replace(patternLower, "-", " ", -1)
	return strings.Contains(contentLower, withSpaces)
}

// containsSupersession checks if content indicates supersession
func containsSupersession(content, targetTitle string) bool {
	contentLower := strings.ToLower(content)
	targetLower := strings.ToLower(targetTitle)

	supersessionKeywords := []string{
		"supersedes",
		"replaces",
		"instead of",
		"rather than",
		"deprecates",
		"obsoletes",
		"upgrades from",
	}

	for _, keyword := range supersessionKeywords {
		if strings.Contains(contentLower, keyword) && strings.Contains(contentLower, targetLower) {
			return true
		}
	}

	return false
}

// FilterByConfidence filters inferred relations by confidence threshold
func FilterByConfidence(relations []InferredRelation, minConfidence float64) []InferredRelation {
	filtered := make([]InferredRelation, 0)
	for _, rel := range relations {
		if rel.Confidence >= minConfidence {
			filtered = append(filtered, rel)
		}
	}
	return filtered
}

// GroupByActionResult represents the result of grouping by action
type GroupByActionResult struct {
	AutoCreate []InferredRelation
	Suggest    []InferredRelation
}

// GroupByAction groups inferred relations by action (auto-create vs suggest)
func GroupByAction(relations []InferredRelation, autoCreateThreshold float64) GroupByActionResult {
	autoCreate := make([]InferredRelation, 0)
	suggest := make([]InferredRelation, 0)

	for _, relation := range relations {
		if relation.Confidence >= autoCreateThreshold {
			autoCreate = append(autoCreate, relation)
		} else {
			suggest = append(suggest, relation)
		}
	}

	return GroupByActionResult{
		AutoCreate: autoCreate,
		Suggest:    suggest,
	}
}

// formatReasoning formats reasoning string with printf-style formatting
func formatReasoning(format string, args ...interface{}) string {
	// Simple formatting - handle %.0f%% and %d cases
	result := format
	for _, arg := range args {
		switch v := arg.(type) {
		case float64:
			result = strings.Replace(result, "%.0f%%", formatFloat(v)+"%", 1)
		case int:
			result = strings.Replace(result, "%d", formatInt(v), 1)
		}
	}
	return result
}

func formatFloat(f float64) string {
	return strings.TrimSuffix(strings.TrimSuffix(formatDecimal(f, 0), "."), "0")
}

func formatInt(i int) string {
	if i == 0 {
		return "0"
	}
	result := ""
	for i > 0 {
		result = string(rune('0'+i%10)) + result
		i /= 10
	}
	return result
}

func formatDecimal(f float64, decimals int) string {
	// Simple float to string conversion
	i := int(f)
	result := formatInt(i)
	if decimals > 0 {
		frac := f - float64(i)
		result += "."
		for j := 0; j < decimals; j++ {
			frac *= 10
			result += string(rune('0' + int(frac)%10))
		}
	}
	return result
}
