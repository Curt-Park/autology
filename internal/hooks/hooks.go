package hooks

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
)

// HookInput represents the JSON input from Claude Code hooks
type HookInput struct {
	SessionID     string         `json:"session_id"`
	HookEventName string         `json:"hook_event_name"`
	ToolName      string         `json:"tool_name,omitempty"`
	ToolInput     map[string]any `json:"tool_input,omitempty"`
	ToolResponse  map[string]any `json:"tool_response,omitempty"`
	Trigger       string         `json:"trigger,omitempty"`
	Reason        string         `json:"reason,omitempty"`
}

// HookOutput represents the JSON output to Claude Code hooks
type HookOutput struct {
	HookSpecificOutput *HookSpecificOutput `json:"hookSpecificOutput,omitempty"`
}

// HookSpecificOutput contains additional context for Claude
type HookSpecificOutput struct {
	HookEventName     string `json:"hookEventName"`
	AdditionalContext string `json:"additionalContext,omitempty"`
}

// ReadStdin reads all of stdin and returns as bytes
func ReadStdin() ([]byte, error) {
	return io.ReadAll(os.Stdin)
}

// ParseInput parses hook stdin JSON into HookInput struct
func ParseInput(data []byte) (*HookInput, error) {
	var input HookInput
	if err := json.Unmarshal(data, &input); err != nil {
		return nil, fmt.Errorf("failed to parse hook input: %w", err)
	}
	return &input, nil
}

// WriteAdditionalContext outputs hookSpecificOutput JSON to stdout
func WriteAdditionalContext(hookEventName, context string) error {
	output := HookOutput{
		HookSpecificOutput: &HookSpecificOutput{
			HookEventName:     hookEventName,
			AdditionalContext: context,
		},
	}
	return json.NewEncoder(os.Stdout).Encode(output)
}

// WriteStderr outputs a message to stderr (user-visible)
func WriteStderr(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
}
