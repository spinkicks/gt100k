#!/usr/bin/env bash
# GT100K onboarding — sets up the same integrated factory the operator runs
# (Claude Code + Codex, 3 MCPs, context hygiene, loop harness). Works on macOS or
# Linux/WSL. Give it to your Claude Code agent ("run this step by step, stop if
# anything errors") or run it yourself:  bash docs/onboarding/teammate-setup.sh
#
# SECRETS YOU PROVIDE (never commit):
#   - Your OWN TrueFoundry token (Claude settings.json + Codex TFY_API_KEY)
#   - Your OWN GitHub login (gh auth login)
set -uo pipefail

case "$(uname -s)" in
  Darwin) OS=mac ;;
  Linux)  OS=linux ;;
  *)      OS=other ;;
esac
echo "== detected OS: $OS =="

echo "== 1/9 base tools (node, gh, git, uv) =="
if [ "$OS" = mac ]; then
  command -v brew >/dev/null || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || true)"
  brew install node gh git
elif [ "$OS" = linux ]; then
  sudo apt-get update -y && sudo apt-get install -y git curl
  command -v gh >/dev/null || { curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg 2>/dev/null; \
    echo "deb [signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null; \
    sudo apt-get update -y && sudo apt-get install -y gh; }
  command -v node >/dev/null || { curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash; export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm install --lts; }
fi
command -v uv >/dev/null || curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

echo "== 2/9 Claude Code =="
command -v claude >/dev/null || curl -fsSL https://claude.ai/install.sh | bash

echo "== 3/9 Codex CLI (the loop's default agent) =="
command -v codex >/dev/null || npm install -g @openai/codex || true

echo "== 4/9 TrueFoundry auth (BOTH agents) =="
echo "ACTION REQUIRED:"
echo "  Claude — put YOUR token in ~/.claude/settings.json under env:"
echo '    "ANTHROPIC_BASE_URL": "https://tfy.promptlens.trilogy.com",'
echo '    "ANTHROPIC_AUTH_TOKEN": "<YOUR_OWN_TFY_TOKEN>"'
echo '    "model": "claude-opus-4-8[1m]"'
echo "  Codex — export your token in your shell rc, and set ~/.codex/config.toml"
echo "    model_provider=tfy / model=gpt-5.6-sol (copy the operator's config.toml, no secrets):"
echo '    export TFY_API_KEY=<YOUR_OWN_TFY_TOKEN>'
echo "  Verify:  claude -p 'pong'   and   codex --version"

echo "== 5/9 GitHub auth =="
gh auth status 2>/dev/null || gh auth login

echo "== 6/9 superpowers plugin (run inside Claude Code) =="
echo "  /plugin marketplace add obra/superpowers-marketplace"
echo "  /plugin install superpowers"

echo "== 7/9 curated skills + impeccable =="
npx -y skills@latest add anthropics/skills --copy -g || true
npx -y impeccable install --providers=claude --scope=global || true

echo "== 8/9 MCP servers (all three — match the operator) =="
claude mcp add --scope user --transport http context7      https://mcp.context7.com/mcp || true
claude mcp add --scope user --transport http aws-knowledge https://knowledge-mcp.global.api.aws || true
# terraform runs via Docker (needs Docker installed):
claude mcp add --scope user terraform -- docker run -i --rm hashicorp/terraform-mcp-server || true
echo "  (Codex reads the same three from ~/.codex/config.toml — copy the operator's [mcp_servers.*] blocks.)"

echo "== 9/9 clone repos =="
mkdir -p ~/code && cd ~/code
gh repo clone spinkicks/gt100k || true
gh repo clone spinkicks/gt100k-factory || true

echo "== context hygiene (auto-compaction ~40%) =="
[ -f ~/code/gt100k-factory/harness/setup-context-hygiene.sh ] \
  && bash ~/code/gt100k-factory/harness/setup-context-hygiene.sh || echo "  (run it after the factory clone finishes)"

echo ""
echo "DONE. Next: read ~/code/gt100k/AGENTS.md, then run  claude  (or /speckit-specify)."
echo "Verify MCPs:  claude mcp list   (expect context7, aws-knowledge, terraform Connected)"
echo "Factory:      ~/code/gt100k-factory/harness/README.md  (loop harness + review gate)"
