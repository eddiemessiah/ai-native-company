#!/usr/bin/env bash
# Product lines as git worktrees: one branch and one checkout per line, so several
# agents (or people) can work in parallel without touching each other's files.
#
#   pnpm worktree lines           list the product lines and what each one owns
#   pnpm worktree <line> [base]   create (or reopen) <root>/<repo>-<line> on branch line/<line>
#   pnpm worktree list            list every worktree
#   pnpm worktree rm <line>       remove a clean worktree; the branch is kept
#
# Env: WORKTREE_ROOT  folder for new worktrees (default: the folder holding this repo)
#      NO_INSTALL=1   skip `pnpm install` in the new worktree
set -euo pipefail

# name|dev port|what the line owns (keep in sync with the table in CLAUDE.md)
LINES='brain|3001|packages/brain: decision layer, providers, recipes, gates
catalog|3002|packages/catalog: offers, prices, brand, study tracks and chapters
web|3003|apps/web pages, components and styles: the site and the directory
apis|3004|apps/web/app/api/v1, lib/x402.ts, lib/paid-handlers.ts: agent-payable endpoints
study|3005|AI Study Group: app/study, catalog study.ts, company/gtm/study-group-global.md
company-brain|3006|Company Brain offering: client deployments, playbook, setup scripts
research|3007|research/ and content/posts: the research branch and the blog
gtm|3008|company/gtm and content/threads: outbound, content engine, launches
ops|3009|company/ops and company/funding: playbooks, rulebook, grants
agents|3010|packages/agents and packages/mcp: Nova Check, Nova Receipt, nova-mcp
gtm-harness|3011|GTM Harness for founders: packages/gtm-harness, app/gtm, app/api/gtm'

die() { printf 'worktree: %s\n' "$*" >&2; exit 1; }

common_dir=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || die "run this inside the repository"
main_root=$(dirname "$common_dir")
repo=$(basename "$main_root")
root=${WORKTREE_ROOT:-$(dirname "$main_root")}

line_field() { # <line> <field number>
  awk -F'|' -v n="$1" -v f="$2" '$1 == n { print $f; exit }' <<<"$LINES"
}

port_for() {
  local port
  port=$(line_field "$1" 2)
  if [[ -z $port ]]; then
    port=$((3100 + $(printf '%s' "$1" | cksum | cut -d' ' -f1) % 100))
  fi
  printf '%s' "$port"
}

cmd_lines() {
  printf '%-14s %-6s %s\n' LINE PORT OWNS
  awk -F'|' '{ printf "%-14s %-6s %s\n", $1, $2, $3 }' <<<"$LINES"
}

cmd_rm() {
  local line=${1:-}
  [[ -n $line ]] || die "usage: pnpm worktree rm <line>"
  local path="$root/$repo-$line"
  # No --force: git refuses when the worktree has uncommitted work, which is the point.
  git worktree remove "$path" || die "commit or stash the work in $path first"
  printf 'Removed %s. Branch line/%s is kept; delete it with: git branch -d line/%s\n' "$path" "$line" "$line"
}

cmd_add() {
  local line=$1
  [[ $line =~ ^[a-z0-9][a-z0-9-]*$ ]] || die "line names are lowercase letters, digits and dashes: \"$line\""
  git rev-parse --verify --quiet HEAD >/dev/null || die "the repository needs at least one commit first"

  local base=${2:-$(git symbolic-ref --short -q HEAD || git rev-parse HEAD)}
  local branch="line/$line"
  local path="$root/$repo-$line"
  local scope
  scope=$(line_field "$line" 3)

  if git worktree list --porcelain | grep -qxF "worktree $path"; then
    printf 'Worktree already open: %s\n' "$path"
  elif git show-ref --verify --quiet "refs/heads/$branch"; then
    git worktree add "$path" "$branch"
  else
    git worktree add -b "$branch" "$path" "$base"
  fi

  # Env files are gitignored, so a fresh checkout has none. Copy local ones over.
  local env
  for env in apps/web/.env.local apps/web/.env; do
    if [[ -f "$main_root/$env" && ! -e "$path/$env" ]]; then
      cp "$main_root/$env" "$path/$env"
      printf 'Copied %s\n' "$env"
    fi
  done

  if [[ ${NO_INSTALL:-} != 1 ]]; then
    (cd "$path" && pnpm install --frozen-lockfile --prefer-offline)
  fi

  cat <<EOF

Line:    $line${scope:+ ($scope)}
Branch:  $branch
Path:    $path

  cd "$path"
  PORT=$(port_for "$line") pnpm dev   # dev server on its own port
  pnpm check           # typecheck + tests before every commit

Stay inside the line's files. Changes to shared packages go through the brain or catalog line.
EOF
}

case ${1:-} in
  "" | -h | --help | help) awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0" ;;
  lines) cmd_lines ;;
  list) git worktree list ;;
  rm | remove) shift; cmd_rm "${1:-}" ;;
  *) cmd_add "$1" "${2:-}" ;;
esac
