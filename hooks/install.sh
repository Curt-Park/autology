#!/bin/bash
set -e

echo "🔧 Installing autology MCP server..."

# Detect platform and architecture
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Normalize architecture names
case "$ARCH" in
  x86_64)
    ARCH="amd64"
    ;;
  aarch64 | arm64)
    ARCH="arm64"
    ;;
  *)
    echo "❌ Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

# Build binary name
if [ "$PLATFORM" = "windows" ]; then
  BINARY_NAME="autology-${PLATFORM}-${ARCH}.exe"
  LOCAL_BINARY="autology.exe"
else
  BINARY_NAME="autology-${PLATFORM}-${ARCH}"
  LOCAL_BINARY="autology"
fi

# Get latest release URL
REPO="Curt-Park/autology"
DOWNLOAD_URL="https://github.com/${REPO}/releases/latest/download/${BINARY_NAME}"

# Create bin directory
BIN_DIR="${CLAUDE_PLUGIN_ROOT}/bin"
mkdir -p "$BIN_DIR"

echo "📥 Downloading ${BINARY_NAME} from GitHub..."
echo "   URL: ${DOWNLOAD_URL}"

# Download binary
if command -v curl > /dev/null; then
  curl -fsSL -o "${BIN_DIR}/${LOCAL_BINARY}" "$DOWNLOAD_URL"
elif command -v wget > /dev/null; then
  wget -q -O "${BIN_DIR}/${LOCAL_BINARY}" "$DOWNLOAD_URL"
else
  echo "❌ Neither curl nor wget is available. Please install one of them."
  exit 1
fi

# Make executable
chmod +x "${BIN_DIR}/${LOCAL_BINARY}"

# Verify installation
if [ -x "${BIN_DIR}/${LOCAL_BINARY}" ]; then
  echo "✅ Autology MCP server installed successfully!"
  echo "   Binary: ${BIN_DIR}/${LOCAL_BINARY}"
  echo ""
  echo "You can now use autology tools in Claude Code:"
  echo "  - autology_capture"
  echo "  - autology_query"
  echo "  - autology_relate"
  echo "  - autology_status"
  echo "  - autology_context"
else
  echo "❌ Installation failed. Binary is not executable."
  exit 1
fi
