#!/bin/bash

# 大量のログデータを生成
generate_logs() {
  for i in {1..10000}; do
    echo "2025-09-01T12:00:00.000Z [INFO] Processing request #$i with status: success"
  done
}

echo "Testing performance with 10,000 lines..."

# 通常モード（一括処理）
echo "Normal mode (batch processing):"
time generate_logs | ./colorize.ts > /dev/null

# ラインバッファリングモード
echo "Line-buffered mode:"
time generate_logs | ./colorize.ts -l > /dev/null

echo "Done"