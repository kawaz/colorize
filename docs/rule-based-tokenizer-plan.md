# ルールベースのトークナイザーへの全面的な書き換え計画

## 概要
現在のハードコーディングされたレクサー/パーサー/ビジター実装を、`src/rules.ts`を中心とした宣言的なルールベースのシステムに全面的に書き換える。

## 現状の問題点
- `lexer.ts`: 各トークンを個別にハードコーディング
- `parser.ts`: 文法規則をハードコーディング
- `visitor.ts`: トークンの色付けをハードコーディング
- 新しいトークンの追加に複数ファイルの修正が必要

## 新しいアーキテクチャの特徴

### ルール定義（`src/rules.ts`）の機能
1. **トークン定義の宣言的記述**
   - 正規表現パターンによる定義
   - 配列による複数パターンの定義（OR条件）
   - オブジェクトによる階層的定義

2. **パターンの埋め込み構文**
   - `{tokenName}` による他トークンパターンの再利用
   - 再帰的な展開をサポート

3. **名前付きキャプチャグループ**
   - `(?<name>pattern)` によるサブトークン定義
   - サブトークンの個別色付けが可能

4. **トークン優先順位**
   - 定義順による優先順位制御
   - 部品トークンの自動的な後方配置

5. **テーマ定義**
   - トークンごとの色定義
   - コンテキスト別テーマ（`parentToken_subToken`形式）
   - 簡略記法（`"yellow|bold"`）のサポート

## 実装コンポーネント

### 1. ルールエンジン（`src/rule-engine.ts`）
**責務:**
- `{tokenName}` パターンの再帰的展開
- 配列値を `(?:pattern1|pattern2)` に展開
- オブジェクト値を階層的トークンとして処理
- 名前付きキャプチャグループからサブトークンを抽出
- トークン優先順位の自動調整

**主要メソッド:**
- `expandPattern(pattern: string | RegExp): RegExp` - パターン展開
- `extractSubTokens(pattern: RegExp): Map<string, RegExp>` - サブトークン抽出
- `buildTokenHierarchy(tokens: object): TokenDefinition[]` - トークン階層構築

### 2. 動的レクサー（`src/lexer-dynamic.ts`）
**責務:**
- ルール定義から自動的にChevrotainトークンを生成
- カテゴリとサブトークンの自動設定
- 優先順位の制御
- 名前付きキャプチャグループのメタデータ保持

**主要メソッド:**
- `createDynamicLexer(rules: TokenDefinition[]): Lexer` - レクサー生成
- `createToken(definition: TokenDefinition): IToken` - トークン生成
- `setupCategories(tokens: IToken[]): void` - カテゴリ設定

### 3. 汎用パーサー（`src/parser-generic.ts`）
**責務:**
- ルール定義に基づいた汎用的な文法規則
- トークン固有のハードコーディングを排除
- 動的にトークンタイプを処理
- サブトークンのコンテキスト情報を保持

**主要メソッド:**
- `buildGrammar(tokens: IToken[]): void` - 文法規則の動的構築
- `parseLog(text: string): CstNode` - ログのパース

### 4. 汎用ビジター（`src/visitor-generic.ts`）
**責務:**
- テーマ定義に基づいた色付け
- サブトークンの個別処理
- コンテキスト別テーマ適用
- 簡略記法の展開処理

**主要メソッド:**
- `visitToken(token: IToken, context: string): string` - トークンの色付け
- `applyTheme(tokenType: string, value: string, context?: string): string` - テーマ適用
- `expandShorthand(theme: string): ThemeDefinition` - 簡略記法展開

### 5. 設定システム（`src/config-loader.ts`）
**責務:**
- `~/.config/colorize/config.ts` からのユーザー定義読み込み
- トークン定義のマージ
- テーマ継承システム
- undefined値による特定テーマの無効化

**主要メソッド:**
- `loadUserConfig(): UserConfig | null` - ユーザー設定読み込み
- `mergeTokens(base: Tokens, user: Tokens): Tokens` - トークン定義マージ
- `mergeThemes(base: Theme, user: Theme): Theme` - テーママージ

### 6. テーマリゾルバー（`src/theme-resolver.ts`）
**責務:**
- テーマの継承と解決
- 親テーマからの継承
- 部分オーバーライド処理

**主要メソッド:**
- `resolveTheme(theme: Theme, parentTheme?: string): ResolvedTheme` - テーマ解決
- `inheritTheme(child: Theme, parent: Theme): Theme` - テーマ継承

## ユーザー設定例

```typescript
// ~/.config/colorize/config.ts
export default {
  tokens: {
    // カスタムトークンの追加
    specialKeyword: /\b(TODO|FIXME|NOTE)\b/,
    customTimestamp: /\d{8}_\d{6}/,
  },
  
  // 親テーマの指定
  parentTheme: "monokai",
  
  theme: {
    // 新しいトークンの色定義
    specialKeyword: "red|bold",
    customTimestamp: "cyan",
    
    // 既存テーマのオーバーライド
    string: "green",
    
    // 特定テーマの無効化
    identifier: undefined,
    
    // コンテキスト別テーマ
    sourceInfo_filename: "blue|underline",
  }
}
```

## 移行計画

### フェーズ1: 基盤実装
1. rule-engine.tsの実装
2. lexer-dynamic.tsの実装
3. parser-generic.tsの実装
4. visitor-generic.tsの実装

### フェーズ2: 設定システム
5. config-loader.tsの実装
6. theme-resolver.tsの実装

### フェーズ3: 統合
7. cli.tsの更新
8. 既存コードの削除
9. テストの作成

### フェーズ4: 検証
10. インテグレーションテスト
11. パフォーマンステスト
12. ドキュメント更新

## 期待される効果

1. **保守性の向上**
   - 新しいトークンの追加が`rules.ts`への記述のみで完結
   - ハードコーディングの排除

2. **拡張性の向上**
   - ユーザー定義トークンのサポート
   - テーマの継承とカスタマイズ

3. **可読性の向上**
   - 宣言的なルール定義
   - 直感的なパターン記述

4. **パフォーマンス**
   - 動的生成によるオーバーヘッドは初期化時のみ
   - 実行時パフォーマンスは既存実装と同等

## 技術的な考慮事項

1. **Chevrotainとの互換性**
   - 既存のChevrotainベースの実装を維持
   - 動的にトークンとパーサーを生成

2. **エラーハンドリング**
   - パターンの循環参照検出
   - 無効なパターンのバリデーション

3. **パフォーマンス最適化**
   - パターン展開結果のキャッシュ
   - トークン優先順位の事前計算

4. **後方互換性**
   - 既存のCLIインターフェースを維持
   - テーマ名の互換性保持