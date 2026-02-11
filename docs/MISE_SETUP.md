# Mise Setup Guide

## What is Mise?

[mise](https://mise.jdx.dev/) is a polyglot tool version manager. It replaces tools like `asdf`, `nvm`, `rbenv`, and ensures everyone on the team uses the same tool versions.

## Quick Start

```bash
# 1. Install mise (one-time)
curl https://mise.run | sh
# or: brew install mise (macOS)

# 2. Activate in your shell (one-time)
echo 'eval "$(mise activate bash)"' >> ~/.bashrc  # Bash
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc    # Zsh

# Reload your shell
source ~/.bashrc  # or source ~/.zshrc

# 3. Trust the project config (first time in this repo)
cd /path/to/autology
mise trust

# 4. Install all tools defined in .mise.toml
mise install

# 5. Verify installation
mise ls
# Should show:
# go             1.23.x
# golangci-lint  1.64.x
```

## Usage

Once `mise install` is complete, use **Makefile** for all tasks:

```bash
# Setup dependencies
make setup

# Build
make build

# Run tests
make test

# Lint
make lint

# Run all checks (fmt + lint + test)
make check

# See all available commands
make help
```

**Why Makefile instead of mise tasks?**
- Makefile is the standard in Go projects
- No duplication of task definitions
- mise focuses on what it does best: tool version management

## What Gets Installed?

From `.mise.toml`:

| Tool | Version | Purpose |
|------|---------|---------|
| `go` | 1.23 | Go language (matches go.mod) |
| `golangci-lint` | 1.64 | Linter (matches CI version) |

## Benefits

✅ **Consistent environments**: Everyone uses Go 1.23 and golangci-lint 1.64
✅ **No version drift**: CI and local dev use identical tool versions
✅ **Easy onboarding**: New contributors run `mise install` and they're ready
✅ **Per-project isolation**: Different projects can use different Go versions
✅ **Automatic activation**: Tools available when you `cd` into the project

## Troubleshooting

### `mise: command not found`

Install mise first:
```bash
curl https://mise.run | sh
```

### Tools show as "missing"

Run `mise install` in the project directory.

### `Config files are not trusted`

Run `mise trust` in the project directory. This is a security feature.

### Want to use system Go instead?

You can! mise doesn't override if you prefer system tools:
```bash
# Skip mise, use system tools
make setup
make build
```

## Advanced

### Update mise itself

```bash
mise self-update
```

### Install specific tool version

```bash
mise install go@1.23.4
```

### Check outdated tools

```bash
mise outdated
```

## Documentation

- [mise documentation](https://mise.jdx.dev/)
- [mise CLI reference](https://mise.jdx.dev/cli/)
- [mise configuration](https://mise.jdx.dev/configuration.html)
