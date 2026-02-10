.PHONY: all build test test-coverage coverage-html clean install run fmt check help

# Default target
all: build

# Build the autology binary
build:
	@echo "Building autology..."
	@mkdir -p ./bin
	@go build -o ./bin/autology ./cmd/autology
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

# Run all checks (format + test)
check: fmt test
	@echo "✓ All checks passed"

# Display help
help:
	@echo "Autology - Go Implementation"
	@echo ""
	@echo "Core targets:"
	@echo "  make build         - Build the autology binary"
	@echo "  make test          - Run all unit tests (includes hook tests)"
	@echo "  make test-coverage - Run tests with coverage report"
	@echo "  make coverage-html - View coverage in browser"
	@echo "  make check         - Run fmt and test (recommended before commit)"
	@echo "  make fmt           - Format code"
	@echo ""
	@echo "Other targets:"
	@echo "  make install       - Download Go dependencies"
	@echo "  make clean         - Remove build artifacts"
	@echo "  make run           - Build and run the MCP server"
	@echo "  make help          - Display this help message"
