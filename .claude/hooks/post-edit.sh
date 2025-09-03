#!/bin/bash

# Claude Code Post-Edit Hook
# コード変更後に自動実行される軽量チェック

set -e

# Quick lint check (最初の5エラーのみ表示)
if command -v bun >/dev/null 2>&1; then
    LINT_ERRORS=$(bun run lint 2>&1 | grep -E "error" | head -3)
    if [ -n "$LINT_ERRORS" ]; then
        echo "⚠️  Lint issues detected:"
        echo "$LINT_ERRORS"
        # 自動修正を試みる
        bun run lint --write >/dev/null 2>&1 || true
    fi
fi

# TypeScript型チェック（エラーがあれば最初の3つを表示）
if command -v tsc >/dev/null 2>&1; then
    TSC_ERRORS=$(tsc --noEmit 2>&1 | grep "error" | head -3)
    if [ -n "$TSC_ERRORS" ]; then
        echo "⚠️  TypeScript errors:"
        echo "$TSC_ERRORS"
    fi
fi

# ファイルサイズの警告（100KB以上）
LARGE_FILES=$(find src -name "*.ts" -size +100k 2>/dev/null)
if [ -n "$LARGE_FILES" ]; then
    echo "⚠️  Large files detected (>100KB):"
    echo "$LARGE_FILES" | head -3
fi

echo "✅ Post-edit checks complete"