# npm公開設定手順

## NPMトークンの設定

### 方法1: Classic Token（CI/CDには便利）

1. **npmでClassic Tokenを生成**:
   - https://www.npmjs.com/settings/~/tokens にアクセス
   - "Generate New Token" → "Classic Token" をクリック
   - Token type: **"Automation"** を選択（重要）
   - トークンをコピー

   ✅ **メリット**: 
   - 期限なしで設定可能（メンテナンスフリー）
   - 一度設定すれば永続的に動作
   - CI/CD環境に最適

### 方法2: Granular Access Token（よりセキュア）

1. **npmでGranular Access Tokenを生成**:
   - https://www.npmjs.com/settings/~/tokens にアクセス
   - "Generate New Token" → "Granular Access Token" をクリック
   - Token name: `github-actions-publish` など任意の名前
   - Expiration: 最長期間を選択（365日など）
   - Packages and scopes:
     - "Select packages": "@kawaz/colorize" を指定
     - Permissions: "Read and write" を選択
   - "Generate token" をクリック
   - トークンをコピー

   ⚠️ **デメリット**: 
   - 期限設定が必須（定期的な更新が必要）
   - 期限切れでCI/CDが停止するリスク

   ✅ **メリット**:
   - 特定パッケージのみに権限を限定可能
   - より細かいセキュリティ制御

2. **GitHubリポジトリにシークレットを設定**:
   - https://github.com/kawaz/colorize/settings/secrets/actions にアクセス
   - "New repository secret" をクリック
   - Name: `NPM_TOKEN`
   - Secret: コピーしたトークンを貼り付け
   - "Add secret" をクリック

## 公開方法

### 自動公開（推奨）
GitHubでReleaseを作成すると自動的にnpmに公開されます：
1. https://github.com/kawaz/colorize/releases/new
2. タグとリリースノートを作成
3. "Publish release"をクリック
4. GitHub Actionsが自動的にnpmへ公開

### 手動公開
GitHub Actionsから手動で実行も可能：
1. https://github.com/kawaz/colorize/actions/workflows/npm-publish.yml
2. "Run workflow"をクリック
3. オプション：
   - Version: 公開するバージョン（例: 1.0.1）
   - Tag: npmのdist-tag（latest, beta, next等）
4. "Run workflow"をクリック

## Provenanceについて

このワークフローは`--provenance`フラグを使用して、パッケージの出所を証明します。
これにより、npmパッケージページに「Published from GitHub Actions」バッジが表示され、
ユーザーはパッケージが信頼できるソースから公開されたことを確認できます。