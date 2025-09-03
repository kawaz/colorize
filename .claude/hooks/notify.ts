#!/usr/bin/env bun

// Claude Code通知スクリプト
// JSON入力を解析して適切な音声通知を生成

import { spawn } from "child_process";

// プロジェクト設定
const PROJECT_NAME = "colorize";
const VOICE_NAME = "Kyoko";
const VOICE_RATE = "220";

interface HookInput {
  hook_event_name?: string;
  tool_name?: string;
  tool_input?: any;
  message?: string;
  user_message?: string;
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
}

// 音声通知を非同期で実行
function notify(message: string): void {
  spawn("say", ["-v", VOICE_NAME, "-r", VOICE_RATE, message], {
    detached: true,
    stdio: "ignore"
  }).unref();
}

// 通知パターンの定義
const patterns = [
  // エラー系（高優先度）
  { regex: /テスト.*失敗|test.*fail/i, message: "テスト失敗" },
  { regex: /エラー|error|失敗|fail|問題|issue/i, message: "エラー発生" },
  
  // 成功系（中優先度）
  { regex: /テスト.*成功|test.*pass|test.*OK/i, message: "テスト成功" },
  { regex: /ビルド.*成功|build.*success/i, message: "ビルド成功" },
  
  // 完了系（低優先度 - 特定のものから順にチェック）
  { regex: /テスト.*完了|test.*complete/i, message: "テスト完了" },
  { regex: /機能.*実装.*完了|feature.*implement/i, message: "機能実装完了" },
  { regex: /リファクタ|refactor/i, message: "リファクタリング完了" },
  { regex: /実装|implement|complete|完了|finished|done/i, message: "タスク完了" },
  
  // その他
  { regex: /commit|コミット/i, message: "コミット完了" },
  { regex: /PR|pull request|プルリク/i, message: "PR作成" },
  { regex: /README|ドキュメント|document|docs/i, message: "ドキュメント更新" },
];

// メッセージ内容から適切な通知を生成
function analyzeMessage(message: string): void {
  // 最初にマッチしたパターンで通知
  for (const pattern of patterns) {
    if (pattern.regex.test(message)) {
      notify(`${PROJECT_NAME}で、${pattern.message}。`);
      return;
    }
  }
}

// メイン処理
async function main() {
  let input: HookInput;

  try {
    // 標準入力からJSONを読み込む
    const stdin = await Bun.stdin.text();
    input = JSON.parse(stdin);
  } catch (error) {
    // JSON解析エラーの場合は終了
    process.exit(0);
  }

  const { hook_event_name, tool_name, tool_input, message, user_message } = input;

  // Notificationイベント
  if (hook_event_name === "Notification" && message) {
    analyzeMessage(message);
  }

  // PostToolUseイベント
  if (hook_event_name === "PostToolUse") {
    if (tool_name === "Bash" && tool_input?.command) {
      const command = tool_input.command;
      if (/git commit/i.test(command)) {
        notify(`${PROJECT_NAME}で、コミット作成中。`);
      }
    }
  }

  // UserSubmitPromptイベント
  if (hook_event_name === "UserSubmitPrompt" && user_message) {
    // 危険な操作の検知のみ
    if (/本番|production|deploy|デプロイ/i.test(user_message)) {
      notify(`${PROJECT_NAME}で、本番環境への操作を検知。注意してください。`);
    } else if (/削除|delete|remove|rm -rf/i.test(user_message)) {
      notify(`${PROJECT_NAME}で、削除操作を検知。`);
    }
  }

  // Stop/SessionStartイベントは通知しない（冗長なため）

  // continueフラグを出力（フックチェーンを継続）
  console.log(JSON.stringify({ continue: true }));
}

main().catch(() => {
  // エラーが発生してもフックチェーンは継続
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
});