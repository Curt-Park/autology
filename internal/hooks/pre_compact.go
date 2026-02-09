package hooks

import (
	"fmt"
	"os"
)

// RunPreCompact handles PreCompact hook before context compaction
func RunPreCompact() {
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

	// Determine trigger type
	trigger := input.Trigger
	if trigger == "" {
		trigger = "auto"
	}

	// Notify user via stderr
	WriteStderr("[autology] Context compaction (%s) is about to occur.", trigger)
	WriteStderr("[autology] Consider capturing important decisions/patterns with /autology:capture")

	// Provide context to Claude via stdout
	context := "Context compaction is about to occur. " +
		"Check if there are important decisions, patterns, or conventions " +
		"that should be captured. If so, suggest /autology:capture to the user."

	if err := WriteAdditionalContext("PreCompact", context); err != nil {
		fmt.Fprintf(os.Stderr, "[autology] Error writing output: %v\n", err)
		os.Exit(1)
	}
}
