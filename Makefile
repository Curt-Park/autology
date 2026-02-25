.PHONY: all build test test-coverage coverage-html clean install setup run fmt lint check help

# Default target
all: build

# Build the autology binary
build:
	@echo "Building autology..."
	@mkdir -p ./bin
	@VERSION=$$(grep '"version"' package.json | sed 's/.*"version": *"\(.*\)".*/\1/'); \
	go build -ldflags "-X main.version=$$VERSION" -o ./bin/autology ./cmd/autology
	@echo "✓ Built: ./bin/autology"

# Run all tests (unit tests including hooks)
test:
	@echo "Running tests..."
	@go test ./internal/...

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	@go test -coverprofile=coverage.out ./internal/...
	@echo ""
	@go tool cover -func=coverage.out | tail -1

# View coverage in browser
coverage-html: test-coverage
	@go tool cover -html=coverage.out

# Install dependencies
install:
	@echo "Downloading Go dependencies..."
	@go mod download
	@echo "✓ Dependencies installed"

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -f .claude-plugin/bin/autology coverage.out
	@echo "✓ Cleaned"

# Run the MCP server
run: build
	@./.claude-plugin/bin/autology

# Format code
fmt:
	@echo "Formatting Go code..."
	@go fmt ./...
	@echo "✓ Formatted"

# Lint code
lint:
	@echo "Linting Go code..."
	@if command -v mise >/dev/null 2>&1; then \
		mise exec -- golangci-lint run ./... && echo "✓ Linting passed (golangci-lint)"; \
	elif command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run ./... && echo "✓ Linting passed (golangci-lint)"; \
	else \
		echo "⚠ golangci-lint not found, using go vet..."; \
		go vet ./... && echo "✓ Linting passed (go vet)"; \
	fi

# Run all checks (format + lint + test)
check: fmt lint test
	@echo "✓ All checks passed"

# Display help
help:
	@echo "Autology - Go Implementation"
	@echo ""
	@echo "Setup:"
	@echo "  make setup         - Setup dev environment (uses mise if available)"
	@echo ""
	@echo "Core targets:"
	@echo "  make build         - Build the autology binary"
	@echo "  make test          - Run all unit tests (includes hook tests)"
	@echo "  make test-coverage - Run tests with coverage report"
	@echo "  make coverage-html - View coverage in browser"
	@echo "  make check         - Run fmt, lint, and test (recommended before commit)"
	@echo "  make fmt           - Format code"
	@echo "  make lint          - Lint code (golangci-lint or go vet)"
	@echo ""
	@echo "Other targets:"
	@echo "  make install       - Download Go dependencies"
	@echo "  make clean         - Remove build artifacts"
	@echo "  make run           - Build and run the MCP server"
	@echo "  make help          - Display this help message"
