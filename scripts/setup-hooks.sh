#!/bin/bash

# Gitフックをセットアップするスクリプト

set -e

# カラー出力用の設定
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up Git hooks...${NC}"

# プロジェクトルートディレクトリを取得
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Gitフックディレクトリを設定
git config core.hooksPath .githooks

# 実行権限を付与
chmod +x "${PROJECT_ROOT}/.githooks/pre-commit"
chmod +x "${PROJECT_ROOT}/.githooks/pre-push"
chmod +x "${PROJECT_ROOT}/scripts/sync-readme.sh"

echo -e "${GREEN}✓ Git hooks have been set up successfully!${NC}"
echo ""
echo "The following hooks are now active:"
echo "  - pre-commit: Runs lint, test, and build checks"
echo "  - pre-push: Runs comprehensive tests and validations"
echo ""
echo "To disable hooks temporarily, use:"
echo "  git commit --no-verify"
echo "  git push --no-verify"
echo ""
echo "To disable hooks permanently, run:"
echo "  git config --unset core.hooksPath"