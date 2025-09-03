#!/bin/bash

# Claude Code Test Runner Hook
# テストを実行して結果を簡潔に表示

set -e

cd "$CLAUDE_PROJECT_DIR"

if command -v bun >/dev/null 2>&1; then
    echo "🧪 Running tests..."
    TEST_OUTPUT=$(FORCE_COLOR=1 bun test 2>&1)
    
    # パス/失敗数を抽出
    PASS=$(echo "$TEST_OUTPUT" | grep -oE "[0-9]+ pass" | grep -oE "[0-9]+" | head -1 || echo "0")
    FAIL=$(echo "$TEST_OUTPUT" | grep -oE "[0-9]+ fail" | grep -oE "[0-9]+" | head -1 || echo "0")
    
    if [ "$FAIL" = "0" ] && [ "$PASS" != "0" ]; then
        echo "✅ All $PASS tests passed"
    elif [ "$FAIL" != "0" ]; then
        echo "❌ $FAIL tests failed (out of $(($PASS + $FAIL)) total)"
        # 失敗したテストを表示
        echo "$TEST_OUTPUT" | grep "fail" | head -5
    else
        echo "⚠️  No tests found or test runner failed"
    fi
else
    echo "⚠️  Bun is not installed"
fi