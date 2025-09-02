#!/bin/bash

# テスト用のログを1秒ごとに出力
while true; do
  echo "$(date -u +%Y-%m-%dT%H:%M:%S.000Z) Test log entry $RANDOM"
  sleep 1
done