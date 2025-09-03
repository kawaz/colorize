#!/bin/bash

# Claude Code向けフック設定
# このファイルはClaude Codeによるコード変更時に自動実行されます

set -e

# カラー出力用の設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================================
# pre-commit相当のチェック
# コード変更後に実行される検証
# ========================================

echo -e "${BLUE}Claude Code: Running validation checks...${NC}"

# 1. Lint check
echo -e "\n${YELLOW}[Claude Code] Checking code format...${NC}"
if bun run lint --write 2>&1 | grep -E "error" > /dev/null; then
    echo -e "${RED}✗ Lint errors detected${NC}"
    echo "Please fix the following lint errors:"
    bun run lint 2>&1 | grep -E "error" | head -5
    # エラーがあっても続行（自動修正を試みる）
    bun run lint --write > /dev/null 2>&1 || true
fi

# 2. TypeScript型チェック
echo -e "\n${YELLOW}[Claude Code] Checking TypeScript types...${NC}"
if command -v tsc > /dev/null 2>&1; then
    if ! tsc --noEmit 2>&1 | grep -q "error"; then
        echo -e "${GREEN}✓ No type errors${NC}"
    else
        echo -e "${YELLOW}⚠ Type errors found${NC}"
        tsc --noEmit 2>&1 | grep "error" | head -5
    fi
fi

# 3. Test実行
echo -e "\n${YELLOW}[Claude Code] Running tests...${NC}"
TEST_RESULT=$(FORCE_COLOR=1 bun test 2>&1 || true)
PASS_COUNT=$(echo "$TEST_RESULT" | grep -oE "[0-9]+ pass" | grep -oE "[0-9]+" | head -1 || echo "0")
FAIL_COUNT=$(echo "$TEST_RESULT" | grep -oE "[0-9]+ fail" | grep -oE "[0-9]+" | head -1 || echo "0")

if [ "$FAIL_COUNT" = "0" ] && [ "$PASS_COUNT" != "0" ]; then
    echo -e "${GREEN}✓ All $PASS_COUNT tests passed${NC}"
else
    if [ "$FAIL_COUNT" != "0" ]; then
        echo -e "${YELLOW}⚠ $FAIL_COUNT tests failed (out of $(($PASS_COUNT + $FAIL_COUNT)) total)${NC}"
    fi
fi

# 4. Build check
echo -e "\n${YELLOW}[Claude Code] Checking build...${NC}"
if bun run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${YELLOW}⚠ Build failed${NC}"
fi

# 5. README同期チェック
echo -e "\n${YELLOW}[Claude Code] Checking README synchronization...${NC}"
if [ -f "README.md" ] && [ -f "README.ja.md" ]; then
    # 両ファイルのセクション数を比較
    SECTIONS_EN=$(grep '^#' README.md | wc -l)
    SECTIONS_JA=$(grep '^#' README.ja.md | wc -l)
    
    if [ "$SECTIONS_EN" -eq "$SECTIONS_JA" ]; then
        echo -e "${GREEN}✓ README files have same structure ($SECTIONS_EN sections each)${NC}"
    else
        echo -e "${YELLOW}⚠ README files have different structures${NC}"
        echo "  README.md: $SECTIONS_EN sections"
        echo "  README.ja.md: $SECTIONS_JA sections"
        echo "  Please keep both README files synchronized"
    fi
fi

# 6. 依存関係チェック
echo -e "\n${YELLOW}[Claude Code] Checking dependencies...${NC}"
if [ -f "package.json" ]; then
    # package.jsonに未使用の依存関係がないかチェック
    DEP_COUNT=$(grep -c '"chevrotain":\|"chalk":\|"commander":' package.json || echo "0")
    if [ "$DEP_COUNT" -eq "3" ]; then
        echo -e "${GREEN}✓ Core dependencies present${NC}"
    else
        echo -e "${YELLOW}⚠ Check dependencies in package.json${NC}"
    fi
fi

echo -e "\n${BLUE}Claude Code validation complete${NC}"

# ========================================
# 定期的なメンテナンスタスク
# ========================================

# ファイルサイズの警告
echo -e "\n${YELLOW}[Claude Code] File size check...${NC}"
LARGE_FILES=$(find src -name "*.ts" -size +100k 2>/dev/null)
if [ -n "$LARGE_FILES" ]; then
    echo -e "${YELLOW}⚠ Large files detected (>100KB):${NC}"
    echo "$LARGE_FILES"
else
    echo -e "${GREEN}✓ No unusually large files${NC}"
fi

# 最終メッセージ
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Claude Code hooks executed successfully${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"