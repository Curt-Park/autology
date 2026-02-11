# Autology

**Living Ontology for Claude Code**

## The Crisis

AI agents boost productivity but create a paradox:

```
Productivity ↑ + Transparency ↓ + Knowledge Accumulation ↓ = Crisis of Understanding
```

Developers don't fully understand AI-generated code. Teams can't track what's actually happening. Organizations repeat mistakes. Skills atrophy.

## The Goal

**Maintain AI productivity while expanding, not contracting, human understanding.**

Not "code faster"—but "understand deeper while coding faster."

## How It Works

Autology captures the "why" behind decisions and feeds it back into future sessions:

```
Your Work → Capture (Hooks) → Knowledge Graph → Inject (SessionStart) → Future Sessions
                                     ↑                                           ↓
                                     └────────────── Learning Loop ───────-──────┘
```

**Three interaction modes**:
1. **Automatic**: Hooks capture as you work (file changes, commits, sessions)
2. **Interactive**: Skills for explicit capture (`/autology:capture`, `/autology:explore`, `/autology:tutorial`)
3. **Programmatic**: MCP tools for automation (`autology_capture`, `autology_query`, `autology_relate`, etc.)

**7 Knowledge types**: `decisions` (ADR format), `components`, `conventions`, `concepts`, `patterns`, `issues`, `sessions`

**7 Relationships**: `affects`, `uses`, `supersedes`, `relates_to`, `implements`, `depends_on`, `derived_from`

**Storage**: Obsidian-compatible markdown in `.autology/nodes/`

## Example

**Without Autology**:
```
Dev: "Claude, add authentication"
→ Code appears
→ Dev: "Looks good" (doesn't understand JWT)
→ Next dev: "Why JWT?" (no answer)
```

**With Autology**:
```
Dev: "Claude, add authentication"
→ Code appears
→ Hook: "Capture decision?"
→ ADR: Context (stateless for microservices), Decision (JWT RS256),
       Alternatives (sessions, OAuth), Consequences (complexity vs scaling)
→ Next dev: /autology:explore authentication
→ Sees reasoning, builds on knowledge
```

## Installation

```bash
# Step 1: Add the marketplace
/plugin marketplace add Curt-Park/autology

# Step 2: Install the plugin
/plugin install autology@autology
```

The plugin will automatically download the correct binary for your platform (macOS, Linux, or Windows).

## Quick Start

```bash
# Learn the model
/autology:tutorial

# Capture a decision
/autology:capture "We chose PostgreSQL for ACID guarantees"

# Explore
/autology:explore decisions
```

## Development Setup

### Option 1: Using mise (Recommended)

[mise](https://mise.jdx.dev/) automatically installs all required tools:

```bash
# Install mise (if not already installed)
curl https://mise.run | sh
# or: brew install mise (macOS)
echo 'eval "$(mise activate bash)"' >> ~/.bashrc  # or ~/.zshrc
source ~/.bashrc  # or source ~/.zshrc

# Clone and setup
git clone https://github.com/Curt-Park/autology.git
cd autology

# Install all tools (Go 1.23 + golangci-lint 1.64)
mise trust
mise install

# Install dependencies, build, and test
make install
make build
make check
```

### Option 2: Manual Setup

```bash
git clone https://github.com/Curt-Park/autology.git
cd autology

# Install Go 1.23+ (see https://go.dev/doc/install)
# Install golangci-lint (https://golangci-lint.run/welcome/install/)

# Install dependencies, build, and test
make install
make build
make check
```

## Running Locally

```bash
claude --plugin-dir .
```

## Philosophy

When AI writes code, humans should **understand more, not less**.

When productivity increases, knowledge should **compound, not evaporate**.

When decisions are made, reasoning should be **transparent, not opaque**.

Autology ensures AI serves human intelligence, not replaces it.

## License

MIT
