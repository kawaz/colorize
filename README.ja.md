# @kawaz/colorize

カスタマイズ可能なトークン定義とテーマを備えた強力なルールベースのログカラーリゼーションツール。

## 特徴

- **ルールベースのトークン化**: 正規表現を使って宣言的にトークンを定義
- **名前付きキャプチャグループ**: 複雑なパターンの細かい色付け
- **カスタマイズ可能なテーマ**: ビルトインテーマ（default、none、monokai）とユーザー定義の配色
- **ユーザー設定**: 設定ファイルでカスタムトークンとテーマを拡張
- **スマートなログ解析**: タイムスタンプ、ログレベル、IPアドレス、URL、HTTPメソッド/ステータスコードなどを自動検出
- **タイムスタンプ重複除去**: kubectlログなどからの重複タイムスタンプを削除
- **高速パフォーマンス**: BunとChevrotainによる高速処理

## インストール

### npm/bunxの使用（推奨）

```bash
# インストール不要で直接実行
npx @kawaz/colorize
# または
bunx @kawaz/colorize

# グローバルインストール
npm install -g @kawaz/colorize
# または
bun add -g @kawaz/colorize
```

### ソースから

```bash
# リポジトリをクローン
git clone https://github.com/kawaz/colorize.git
cd colorize

# 依存関係をインストール
bun install

# プロジェクトをビルド
bun run build

# 直接実行
./dist/colorize.js
```

## 使い方

### 基本的な使い方

```bash
# ログをcolorize経由でパイプ
cat logfile.txt | colorize

# ファイルから読み込み
colorize < logfile.txt

# リアルタイムログ監視
tail -f /var/log/app.log | colorize

# Dockerと一緒に
docker logs -f container_name | colorize

# kubectlと一緒に
kubectl logs -f pod_name | colorize

# npx/bunxでインストール不要で実行
cat app.log | npx @kawaz/colorize
tail -f app.log | bunx @kawaz/colorize -t github
```

### オプション

```bash
colorize [options] [file]

オプション:
  -V, --version               バージョン番号を出力
  -t, --theme <theme>         使用するカラーテーマ (default, none, monokai)
  -d, --debug                 デバッグ出力を有効化
  --list-themes               利用可能なテーマを一覧表示
  -m, --join-multiline        複数行ログを結合
  --deduplicate-timestamps    重複タイムスタンプを削除
  -r, --relative-time         相対タイムスタンプを表示
  --force-color               色出力を強制
  --simple                    複雑なルールの代わりにシンプルなルールを使用
  -v, --verbose               詳細出力
  --no-user-config            ユーザー設定ファイルを無視
  --generate-config           サンプル設定ファイルを生成
  --upgrade                   最新バージョンにアップグレード
  -h, --help                  コマンドのヘルプを表示
```

### 例

```bash
# 相対時間付きでGitHubテーマを使用
cat app.log | colorize -t github -r

# 複数行スタックトレースを結合
cat error.log | colorize -m

# lessにパイプする際に色を強制
cat app.log | colorize --force-color | less -R

# タイムスタンプ重複除去でkubectlログを処理
kubectl logs -f --timestamps pod_name | colorize --deduplicate-timestamps
```

### 環境変数

環境変数でデフォルトオプションを設定できます：

```bash
# デフォルトオプションを設定（テーマを含む）
export COLORIZE_OPTIONS="-r -t github --deduplicate-timestamps"

# コマンドライン引数が環境設定を上書き
# COLORIZE_OPTIONSのオプションを無効にするには--no-プレフィックスを使用
cat log.txt | colorize --no-deduplicate-timestamps  # envで設定されていても重複除去を無効

# 色出力を強制
export FORCE_COLOR=1
```

## テーマ

利用可能なビルトインテーマ：
- **default**: 読みやすさのためのバランスの取れた色
- **none**: 色なし（プレーンテキスト）
- **monokai**: Monokaiインスパイアの配色

利用可能なテーマを一覧表示：
```bash
colorize --list-themes
```

## ユーザー設定

### 設定ファイルの作成

サンプル設定を生成：
```bash
colorize --generate-config > ~/.config/colorize/config.ts
```

### 設定例

```typescript
import type { UserConfig } from "colorize";

const config: UserConfig = {
  // ベーステーマ
  parentTheme: "default",

  // カスタムトークン定義
  tokens: {
    // シンプルなパターン
    myKeyword: /\b(TODO|FIXME|NOTE)\b/,
    
    // サブトークン用の名前付きキャプチャグループ
    gitCommit: /(?<hash>[a-f0-9]{7,40})\s+(?<message>.+)/,
    
    // 複数パターン
    customError: [
      /\bERR_[A-Z_]+\b/,
      /\bE[0-9]{4}\b/,
    ],
  },

  // カスタムテーマ設定
  theme: {
    // カスタムトークンの色
    myKeyword: "magenta|bold",
    
    // サブトークンの色
    gitCommit_hash: "yellow",
    gitCommit_message: "white",
    
    // ビルトイン色の上書き
    string: "green",
    number: "#ff9900",
    
    // 関数による動的色付け
    customError: (ctx) => {
      if (ctx.value.startsWith("ERR_")) {
        return "red|bold|underline";
      }
      return "red";
    },
  },
};

export default config;
```

## カラーリング対象

- **タイムスタンプ**: ISO 8601、コンパクト形式、オプションで相対時間
- **ログレベル**: DEBUG、INFO、WARN、ERROR、FATAL（大文字小文字区別なし）
- **IPアドレス**: IPv4とIPv6の適切なハイライト
- **URL**: HTTP/HTTPS URL
- **HTTP**: メソッド（GET、POSTなど）とステータスコード（200、404、500など）
- **ソース情報**: 行番号付きファイルパス（[src/app.ts:42]）
- **文字列**: エスケープシーケンス付きクォート文字列
- **数値**: 整数と小数
- **ブール値**: true/false
- **特殊値**: null、undefined

## 開発

```bash
# 開発モードで実行
bun run dev

# テストを実行
bun test

# コードをフォーマット
bun run lint

# プロダクション用にビルド
bun run build
```

## 要件

- [Bun](https://bun.sh) ランタイム（v1.0以降）

## ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照

## 作者

kawaz

## 貢献

貢献は歓迎します！お気軽にPull Requestを提出してください。