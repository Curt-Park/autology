package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/Curt-Park/autology/internal/classification"
	"github.com/Curt-Park/autology/internal/enrichment"
	"github.com/Curt-Park/autology/internal/storage"
)

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

	searchEngine := storage.NewSearchEngine(nodeStore, graphIndex)

	fmt.Fprintf(os.Stderr, "Storage initialized at: %s\n", absPath)

	// Demonstrate functionality
	fmt.Fprintf(os.Stderr, "Autology Go implementation ready\n")
	fmt.Fprintf(os.Stderr, "Storage: %T\n", nodeStore)
	fmt.Fprintf(os.Stderr, "Graph Index: %T\n", graphIndex)
	fmt.Fprintf(os.Stderr, "Search Engine: %T\n", searchEngine)
	fmt.Fprintf(os.Stderr, "Classification: %T\n", &classification.ClassificationResult{})
	fmt.Fprintf(os.Stderr, "Enrichment: %T\n", &enrichment.InferredRelation{})

	// For now, just verify everything compiles and initializes correctly
	fmt.Fprintf(os.Stderr, "\nAll modules loaded successfully!\n")
}
