#!/bin/bash

# READMEの同期チェックスクリプト
# README.mdとREADME.ja.mdの内容の同期を確認します

set -e

# カラー出力用の設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# プロジェクトルートディレクトリを取得
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
README_EN="${PROJECT_ROOT}/README.md"
README_JA="${PROJECT_ROOT}/README.ja.md"

# 両方のREADMEファイルが存在するか確認
if [ ! -f "$README_EN" ]; then
    echo -e "${RED}Error: README.md not found${NC}"
    exit 1
fi

if [ ! -f "$README_JA" ]; then
    echo -e "${YELLOW}Warning: README.ja.md not found${NC}"
    echo "Creating README.ja.md from README.md..."
    cp "$README_EN" "$README_JA"
    echo -e "${GREEN}README.ja.md created. Please translate it to Japanese.${NC}"
    exit 0
fi

# ファイルの最終更新日時を比較
MTIME_EN=$(stat -f %m "$README_EN" 2>/dev/null || stat -c %Y "$README_EN" 2>/dev/null)
MTIME_JA=$(stat -f %m "$README_JA" 2>/dev/null || stat -c %Y "$README_JA" 2>/dev/null)

if [ "$MTIME_EN" -gt "$MTIME_JA" ]; then
    echo -e "${YELLOW}Warning: README.md is newer than README.ja.md${NC}"
    echo "README.md was updated. Please update README.ja.md accordingly."
    echo ""
    echo "To see the differences in structure:"
    echo "  diff -u <(grep '^#' README.ja.md) <(grep '^#' README.md)"
    exit 1
elif [ "$MTIME_JA" -gt "$MTIME_EN" ]; then
    echo -e "${YELLOW}Warning: README.ja.md is newer than README.md${NC}"
    echo "README.ja.md was updated. Please ensure README.md has the same structure."
    echo ""
    echo "To see the differences in structure:"
    echo "  diff -u <(grep '^#' README.md) <(grep '^#' README.ja.md)"
    exit 1
fi

# ヘッダー構造が同じか確認
HEADERS_EN=$(grep '^#' "$README_EN" | sed 's/^#\+ //')
HEADERS_JA=$(grep '^#' "$README_JA" | sed 's/^#\+ //')

# ヘッダー数を比較
COUNT_EN=$(echo "$HEADERS_EN" | wc -l)
COUNT_JA=$(echo "$HEADERS_JA" | wc -l)

if [ "$COUNT_EN" -ne "$COUNT_JA" ]; then
    echo -e "${RED}Error: README files have different number of sections${NC}"
    echo "README.md has $COUNT_EN sections, README.ja.md has $COUNT_JA sections"
    echo ""
    echo "Differences:"
    diff -u <(echo "$HEADERS_JA") <(echo "$HEADERS_EN") || true
    exit 1
fi

echo -e "${GREEN}✓ README.md and README.ja.md appear to be in sync${NC}"
echo "  Both files have the same number of sections ($COUNT_EN sections)"
echo "  Both files have similar update times"