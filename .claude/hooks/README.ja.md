# Colorizeプロジェクト用 Claude Code フック

このディレクトリには、colorizeプロジェクトとClaude Codeを統合するためのTypeScriptベースのフックが含まれています。

## 概要

フックシステムは、Bunランタイムを使用して最適なパフォーマンスで様々な開発イベントの自動通知と検証を提供します。

## フックスクリプト

### `notify.ts`
macOSの`say`コマンドを使用して、様々なイベントの日本語音声通知を処理します。

**機能:**
- 優先度ベースのパターンマッチング
- コード内で直接設定可能
- 複数のイベントタイプをサポート

**サポートされるイベント:**
- `Notification`: Claudeからの一般的な通知
- `PreToolUse`: 実行前検証（git commit用）
- `UserSubmitPrompt`: ユーザー入力の監視
- `Stop`: セッション完了（通知無効）
- `SessionStart`: セッション初期化（通知無効）

### `pre-commit.ts`
git commit前にコードを検証します。

**機能:**
- `bun run lint`を実行（自動修正を試みる）
- `bun test`を実行して全テストの成功を確認
- `.md`と`.ja.md`ファイル間のドキュメント同期をチェック
- 検証が失敗した場合はコミットをブロック
- 英語ドキュメントの日本語版を自動作成

## 設定


### `.claude/settings.json`
Claude Codeへのフック登録:

```json
{
  "hooks": {
    "PreToolUse": [...],
    "Notification": [...]
  }
}
```

## アーキテクチャ

### 入出力フォーマット
すべてのフックはstdin経由でJSONを受信し、`continue`フラグを含むJSONを出力します:


**入力:**
```json
{
  "hook_event_name": "string",
  "tool_name": "string",
  "tool_input": {},
  "message": "string"
}
```

**出力:**
```json
{
  "continue": true
}
```

## 開発

### 新しいパターンの追加
`notify.ts`を編集して新しい通知パターンを追加:

```typescript
const patterns = [
  { regex: /your-regex/i, message: "通知メッセージ" }
];
```

### デバッグ
- フック内のstderrエラー出力を監視

## ベストプラクティス

1. **常に`{continue: true}`を返す** - フックチェーンを維持
2. **エラーを適切に処理** - フックチェーンを破壊しない
3. **フックを高速に保つ** - 可能な限り非同期操作を使用
4. **変更をテスト** - デプロイ前に動作確認

## トラブルシューティング

### 通知が機能しない
- `say`コマンドが利用可能か確認（macOSのみ）
- 入力の適切なJSONフォーマットを確認

### README同期が変更を検出しない
- ファイルパスが絶対パスか確認
- 両方のファイルが存在するか確認
- 適切な`.md`または`.ja.md`拡張子を確認

### フックが実行されない
- 実行権限を確認（`chmod +x`）
- `.claude/settings.json`設定を確認
- BunがインストールされPATHに含まれているか確認