package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/Curt-Park/autology/internal/mcp"
	"github.com/Curt-Park/autology/internal/storage"
)

const version = "0.1.0"

func main() {
	// Get root path from environment or use default
	rootPath := os.Getenv("AUTOLOGY_ROOT")
	if rootPath == "" {
		rootPath = ".autology"
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

	graphIndex := storage.NewGraphIndexStore(absPath)
	if err := graphIndex.Load(); err != nil {
		fmt.Fprintf(os.Stderr, "Error loading graph index: %v\n", err)
		os.Exit(1)
	}

	fmt.Fprintf(os.Stderr, "Storage initialized at: %s\n", absPath)

	// Create and run MCP server
	server := mcp.NewServer("autology", version, nodeStore, graphIndex)
	if err := server.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
		os.Exit(1)
	}
}
