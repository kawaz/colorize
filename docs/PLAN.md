# Colorize 開発計画

## プロジェクト概要
ログファイルの構造を解析し、chalkを使って色付けするCLIツール。
Chevrotainパーサで複雑な構造（JSON、配列、マルチライン）を正確に認識。

## 開発フェーズ

### Phase 1: 基本セットアップ
- [x] プロジェクト構造の設計
- [ ] Bunプロジェクトの初期化
- [ ] TypeScript設定
- [ ] 依存関係インストール（Chevrotain, chalk）

### Phase 2: Lexer実装
- [ ] 基本トークン定義
  - タイムスタンプ（ISO8601）
  - 数値（整数、小数）
  - 文字列（クォート付き）
  - 識別子
  - IPアドレス
  - URL
  - 記号類
- [ ] トークンのテスト

### Phase 3: Parser実装
- [ ] 基本構造の定義
  - JSONオブジェクト
  - JSON配列
  - キーバリューペア
  - HTTPログ形式
- [ ] エラー回復機能の実装
- [ ] ファジーマッチング対応

### Phase 4: 色付け実装
- [ ] Visitor パターンでCST走査
- [ ] chalkを使った色付けマッピング
  - タイムスタンプ: blue
  - 文字列: green
  - 数値: cyan
  - キー: yellow
  - エラー: red
  - 警告: yellow
  - IP: magenta
  - URL: underline + cyan

### Phase 5: マルチライン対応
- [ ] マルチラインログの検出
- [ ] 連結オプションの実装
- [ ] インデント保持

### Phase 6: CLI実装
- [ ] colorize.ts作成（#!/usr/bin/env bun）
- [ ] コマンドライン引数処理
- [ ] パイプ入力対応
- [ ] ストリーミング処理

### Phase 7: テスト・ドキュメント
- [ ] ユニットテスト作成
- [ ] サンプルログでの動作確認
- [ ] 使用方法ドキュメント作成

## 技術的な実装方針

### Chevrotainの活用
```typescript
// Lexerの例
const createToken = chevrotain.createToken;
const Timestamp = createToken({
  name: "Timestamp",
  pattern: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?/
});

// Parserの例（エラー回復付き）
class LogParser extends CstParser {
  constructor() {
    super(allTokens, {
      recoveryEnabled: true,
      nodeLocationTracking: "full"
    });
  }
}
```

### Chalkの活用
```typescript
import chalk from 'chalk';

const colorMap = {
  timestamp: chalk.blue,
  string: chalk.green,
  number: chalk.cyan,
  key: chalk.yellow,
  error: chalk.red.bold,
  warning: chalk.yellow.bold,
  ip: chalk.magenta,
  url: chalk.cyan.underline,
};
```

### ファジーマッチング戦略
1. 不完全なJSONでも可能な限り解析
2. 閉じ括弧が不足していても構造を推測
3. 認識できない部分は生テキストとして扱う

### パフォーマンス最適化
- ストリーミング処理で大容量ログに対応
- Bunの高速実行を活用
- 不要な文字列結合を避ける

## 実装の優先順位
1. **必須機能**
   - 基本的なログ構造の認識と色付け
   - パイプ入力対応
   - JSONオブジェクトの解析

2. **重要機能**
   - マルチライン対応
   - HTTPログ形式の認識
   - エラー回復

3. **追加機能**
   - カラーテーマ切り替え
   - 出力フォーマットのカスタマイズ
   - 統計情報の表示

## 成功基準
- サンプルログ（docs/sample-log-*）が正しく色付けされる
- 不完全な構造でもクラッシュしない
- パイプラインで他のツールと組み合わせ可能
- `./colorize.ts < logfile.txt` で直接実行可能