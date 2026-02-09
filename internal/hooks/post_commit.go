package hooks

import (
	"fmt"
	"os"
	"strings"
)

// detectEventType determines the type of git event from the command
func detectEventType(cmd string) string {
	cmd = strings.ToLower(cmd)
	switch {
	case strings.Contains(cmd, "gh pr merge"):
		return "PR merge"
	case strings.Contains(cmd, "gh pr create"):
		return "PR creation"
	case strings.Contains(cmd, "git commit"):
		return "git commit"
	default:
		return "git event"
	}
}

// RunPostCommit handles PostToolUse hook for git commit and PR events
func RunPostCommit() {
	data, err := ReadStdin()
	if err != nil {
		fmt.Fprintf(os.Stderr, "[autology] Error reading stdin: %v\n", err)
		os.Exit(1)
	}

	input, err := ParseInput(data)
	if err != nil {
		fmt.Fprintf(os.Stderr, "[autology] Error parsing input: %v\n", err)
		os.Exit(1)
	}

	// Extract command from tool input
	cmd, ok := input.ToolInput["command"].(string)
	if !ok {
		cmd = ""
	}

	eventType := detectEventType(cmd)

	// Notify user via stderr
	WriteStderr("[autology] %s detected. Consider capturing decisions/patterns with /autology:capture", eventType)

	// Provide context to Claude via stdout
	context := fmt.Sprintf(
		"A %s was just completed. "+
			"Consider if any decisions, patterns, or conventions from this work should be captured. "+
			"If significant, suggest /autology:capture to the user. Do NOT auto-capture.",
		eventType,
	)

	if err := WriteAdditionalContext("PostToolUse", context); err != nil {
		fmt.Fprintf(os.Stderr, "[autology] Error writing output: %v\n", err)
		os.Exit(1)
	}
}
