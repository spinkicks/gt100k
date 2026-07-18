#!/usr/bin/env bash
# GT100K onboarding — macOS + Claude Code.
# Give this file to your Claude Code agent ("run this setup script step by step, stop if anything errors")
# or run it yourself:  bash docs/onboarding/teammate-setup.sh
#
# SECRETS YOU PROVIDE (never commit these):
#   - Your OWN TrueFoundry token (from TrueFoundry — do not reuse a teammate's)
#   - Your OWN GitHub login (gh auth login)
set -uo pipefail

echo "== 1/8 Homebrew =="
command -v brew >/dev/null || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || true)"

echo "== 2/8 core tools =="
brew install node gh git
command -v uv >/dev/null || curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

echo "== 3/8 Claude Code =="
command -v claude >/dev/null || curl -fsSL https://claude.ai/install.sh | bash

echo "== 4/8 TrueFoundry auth =="
echo "ACTION REQUIRED: put YOUR token in ~/.claude/settings.json under env:"
echo '  "ANTHROPIC_BASE_URL": "https://tfy.promptlens.trilogy.com",'
echo '  "ANTHROPIC_AUTH_TOKEN": "<YOUR_OWN_TFY_TOKEN>"'
echo "Then verify:  claude -p 'pong'"

echo "== 5/8 GitHub auth =="
gh auth status 2>/dev/null || gh auth login

echo "== 6/8 superpowers plugin (run inside Claude Code) =="
echo "  /plugin marketplace add obra/superpowers-marketplace"
echo "  /plugin install superpowers"

echo "== 7/8 curated skills (web/product set) + impeccable =="
KEEP="obra/superpowers rebelytics/one-skill-to-rule-them-all mattpocock/grill-with-docs \
anthropics/skills vercel/react-best-practices"
# Install curated packs (agent: prefer the exact repos we use; ask if unsure)
npx -y skills@latest add anthropics/skills --copy -g || true
npx -y impeccable install --providers=claude --scope=global || true

echo "== 8/8 MCP servers (keyless/local) + basic-memory =="
uv tool install basic-memory || true
claude mcp add --scope user --transport http context7 https://mcp.context7.com/mcp || true
claude mcp add --scope user fetch -- uvx mcp-server-fetch || true
claude mcp add --scope user sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking || true
claude mcp add --scope user serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant || true
claude mcp add --scope user -e BASIC_MEMORY_HOME="$HOME/Obsidian/Brain" basic-memory -- "$HOME/.local/bin/basic-memory" mcp || true
# GitHub MCP (optional): set GITHUB_TOKEN, then:
# claude mcp add --scope user --transport http github https://api.githubcopilot.com/mcp/ --header "Authorization: Bearer $GITHUB_TOKEN"

echo ""
echo "== clone the repo =="
mkdir -p ~/code && cd ~/code && gh repo clone spinkicks/gt100k || true

echo ""
echo "DONE. Next: open ~/code/gt100k, read AGENTS.md, and run  claude  (or /speckit-specify to work the PRD)."
echo "Verify:  claude mcp list   (expect several 'Connected')"
