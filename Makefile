.PHONY: all build test test-coverage test-agents clean install run fmt check help

# Default target
all: build

# Build the autology binary
build:
	@echo "Building autology..."
	@mkdir -p .claude-plugin/bin
	@go build -o .claude-plugin/bin/autology ./cmd/autology
	@echo "✓ Built: .claude-plugin/bin/autology"

# Run all tests
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

# Run agent triggering tests
test-agents:
	@echo "Running agent triggering tests..."
	@bash tests/agents/run.sh

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

# Run all checks
check: fmt test
	@echo "✓ All checks passed"

# Display help
help:
	@echo "Autology - Go Implementation"
	@echo ""
	@echo "Available targets:"
	@echo "  make build          - Build the autology binary"
	@echo "  make test           - Run all tests"
	@echo "  make test-coverage  - Run tests with coverage report"
	@echo "  make coverage-html  - View coverage in browser"
	@echo "  make test-agents    - Run agent triggering tests"
	@echo "  make install        - Download dependencies"
	@echo "  make clean          - Remove build artifacts"
	@echo "  make run            - Build and run the MCP server"
	@echo "  make fmt            - Format code"
	@echo "  make check          - Run fmt and test"
	@echo "  make help           - Display this help message"
