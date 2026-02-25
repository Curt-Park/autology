package hooks

import (
	"bytes"
	"encoding/json"
	"os"
	"strings"
	"testing"
)

func TestParseInput(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{
			name:    "valid PostToolUse input",
			input:   `{"session_id":"test","hook_event_name":"PostToolUse","tool_name":"Bash","tool_input":{"command":"git commit -m \"test\""}}`,
			wantErr: false,
		},
		{
			name:    "valid PreCompact input",
			input:   `{"hook_event_name":"PreCompact","trigger":"auto"}`,
			wantErr: false,
		},
		{
			name:    "invalid JSON",
			input:   `{invalid}`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ParseInput([]byte(tt.input))
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseInput() error = %v, wantErr %v", err, tt.wantErr)
			}
			if !tt.wantErr && result == nil {
				t.Error("ParseInput() returned nil result")
			}
		})
	}
}

func TestDetectEventType(t *testing.T) {
	tests := []struct {
		name    string
		command string
		want    string
	}{
		{
			name:    "git commit",
			command: `git commit -m "feat: add feature"`,
			want:    "git commit",
		},
		{
			name:    "PR creation",
			command: `gh pr create --title "Add feature"`,
			want:    "PR creation",
		},
		{
			name:    "PR merge",
			command: `gh pr merge 123`,
			want:    "PR merge",
		},
		{
			name:    "other command",
			command: `git status`,
			want:    "git event",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := detectEventType(tt.command)
			if got != tt.want {
				t.Errorf("detectEventType() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestWriteAdditionalContext(t *testing.T) {
	// Capture stdout
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	err := WriteAdditionalContext("PostToolUse", "Test context")
	if err != nil {
		t.Fatalf("WriteAdditionalContext() error = %v", err)
	}

	_ = w.Close()
	os.Stdout = oldStdout

	var buf bytes.Buffer
	if _, err := buf.ReadFrom(r); err != nil {
		t.Fatalf("Failed to read output: %v", err)
	}

	var output HookOutput
	if err := json.Unmarshal(buf.Bytes(), &output); err != nil {
		t.Fatalf("Failed to parse output JSON: %v", err)
	}

	if output.HookSpecificOutput == nil {
		t.Fatal("HookSpecificOutput is nil")
	}

	if output.HookSpecificOutput.HookEventName != "PostToolUse" {
		t.Errorf("HookEventName = %v, want PostToolUse", output.HookSpecificOutput.HookEventName)
	}

	if output.HookSpecificOutput.AdditionalContext != "Test context" {
		t.Errorf("AdditionalContext = %v, want 'Test context'", output.HookSpecificOutput.AdditionalContext)
	}
}

func TestWriteStderr(t *testing.T) {
	// Capture stderr
	oldStderr := os.Stderr
	r, w, _ := os.Pipe()
	os.Stderr = w

	WriteStderr("[test] Message with %s", "formatting")

	_ = w.Close()
	os.Stderr = oldStderr

	var buf bytes.Buffer
	if _, err := buf.ReadFrom(r); err != nil {
		t.Fatalf("Failed to read stderr: %v", err)
	}

	output := buf.String()
	if !strings.Contains(output, "[test] Message with formatting") {
		t.Errorf("WriteStderr() output = %v, want '[test] Message with formatting'", output)
	}
}
