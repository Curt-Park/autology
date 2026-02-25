package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/Curt-Park/autology/internal/hooks"
	"github.com/Curt-Park/autology/internal/mcp"
	"github.com/Curt-Park/autology/internal/storage"
)

var version = "0.0.0"

func main() {
	// Check if running as a hook subcommand
	if len(os.Args) > 1 && os.Args[1] == "hook" {
		runHook(os.Args[2:])
		return
	}

	// Otherwise run as MCP server
	runMCPServer()
}

func runHook(args []string) {
	if len(args) == 0 {
		fmt.Fprintf(os.Stderr, "Usage: autology hook <post-commit|pre-compact|session-end>\n")
		os.Exit(1)
	}

	switch args[0] {
	case "post-commit":
		hooks.RunPostCommit()
	case "pre-compact":
		hooks.RunPreCompact()
	case "session-end":
		hooks.RunSessionEnd()
	default:
		fmt.Fprintf(os.Stderr, "Unknown hook: %s\n", args[0])
		os.Exit(1)
	}
}

func runMCPServer() {
	rootPath := os.Getenv("AUTOLOGY_ROOT")
	if rootPath == "" {
		rootPath = "docs"
	}

	// Get absolute path
	absPath, err := filepath.Abs(rootPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error resolving path: %v\n", err)
		os.Exit(1)
	}

	// Initialize storage
	nodeStore := storage.NewNodeStore(absPath)
	if err := nodeStore.Initialize(); err != nil {
		fmt.Fprintf(os.Stderr, "Error initializing node store: %v\n", err)
		os.Exit(1)
	}

	fmt.Fprintf(os.Stderr, "Storage initialized at: %s\n", absPath)

	// Create and run MCP server
	server := mcp.NewServer("autology", version, nodeStore)
	if err := server.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
		os.Exit(1)
	}
}
